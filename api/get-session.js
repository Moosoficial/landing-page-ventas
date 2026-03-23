const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Falta session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const orderNumber = 'PA-' + session.id.slice(-8).toUpperCase();
    const customerEmail = session.customer_details?.email || '';
    const customerName = session.customer_details?.name || session.metadata?.customer_name || '';
    const amountTotal = session.amount_total / 100;
    const cartItems = JSON.parse(session.metadata?.cart_summary || '[]');

    if (session.payment_status === 'paid') {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      const { data: existing } = await supabase
        .from('orders')
        .select('id, email_sent')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (!existing) {
        // Guardar orden
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            stripe_session_id: session.id,
            customer_email: customerEmail,
            customer_name: customerName,
            total_amount: amountTotal,
            payment_status: 'paid',
            email_sent: false,
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error guardando orden:', orderError.message);
        } else {
          // Guardar items
          if (cartItems.length > 0 && order) {
            const items = cartItems.map(item => ({
              order_id: order.id,
              product_id: item.id,
              product_name: item.name,
              license_type: item.license || 'Licencia digital',
              quantity: item.qty || 1,
              unit_price: item.price || 0,
            }));
            await supabase.from('order_items').insert(items);
          }

          // Asignar claves de licencia del pool
          const assignedKeys = await assignLicenseKeys(supabase, order.id, customerEmail, cartItems);

          // Enviar email con las claves
          await sendConfirmationEmail({
            orderNumber,
            customerEmail,
            customerName,
            amountTotal,
            cartItems,
            assignedKeys,
          });

          await supabase
            .from('orders')
            .update({ email_sent: true })
            .eq('id', order.id);

          console.log('✅ Pedido guardado, licencias asignadas y email enviado:', orderNumber);
        }
      } else if (!existing.email_sent) {
        // Orden ya existe pero email no fue enviado — buscar claves ya asignadas
        const { data: keys } = await supabase
          .from('license_keys')
          .select('product_key, key_value')
          .eq('order_id', existing.id);

        const assignedKeys = (keys || []).map(k => ({
          productName: cartItems.find(i => i.id === k.product_key)?.name || k.product_key,
          keyValue: k.key_value,
        }));

        await sendConfirmationEmail({ orderNumber, customerEmail, customerName, amountTotal, cartItems, assignedKeys });
        await supabase.from('orders').update({ email_sent: true }).eq('stripe_session_id', session.id);
      }
    }

    return res.status(200).json({
      customerEmail,
      customerName,
      amountTotal,
      paymentStatus: session.payment_status,
      orderNumber,
    });

  } catch (error) {
    console.error('get-session error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// ─── Asignar claves del pool para cada item del carrito ───────────────────────
async function assignLicenseKeys(supabase, orderId, customerEmail, cartItems) {
  const assigned = [];

  for (const item of cartItems) {
    const qty = item.qty || 1;

    for (let i = 0; i < qty; i++) {
      // Buscar una clave disponible para este producto
      const { data: key, error } = await supabase
        .from('license_keys')
        .select('id, key_value')
        .eq('product_key', item.id)
        .eq('status', 'available')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`Error buscando clave para ${item.id}:`, error.message);
        continue;
      }

      if (!key) {
        // Sin stock — registrar alerta pero no bloquear (pago ya procesado)
        console.warn(`⚠️  Sin claves disponibles para: ${item.id}`);
        assigned.push({ productName: item.name, keyValue: null });
        continue;
      }

      // Marcar como asignada
      await supabase
        .from('license_keys')
        .update({
          status: 'assigned',
          assigned_to_email: customerEmail,
          assigned_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq('id', key.id);

      assigned.push({ productName: item.name, keyValue: key.key_value });
      console.log(`🔑 Clave asignada para ${item.id}:`, key.key_value);
    }
  }

  return assigned;
}

// ─── Email de confirmación con claves ─────────────────────────────────────────
async function sendConfirmationEmail({ orderNumber, customerEmail, customerName, amountTotal, cartItems, assignedKeys = [] }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const itemsHtml = cartItems.map(item => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align:center;">${item.qty || 1}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align:right;">€${item.price?.toFixed(2) || '0.00'}</td>
      </tr>
    `).join('');

    // Bloque de claves de licencia
    const keysHtml = assignedKeys.length > 0 ? `
      <div style="margin: 0 32px 32px;">
        <h3 style="color:#003345; font-size:16px; margin:0 0 16px;">🔑 Tus Claves de Licencia</h3>
        ${assignedKeys.map(k => `
          <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:16px 20px; margin-bottom:12px;">
            <p style="margin:0 0 8px; color:#64748b; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">${k.productName}</p>
            ${k.keyValue
              ? `<p style="margin:0; font-family:monospace; font-size:18px; font-weight:700; color:#003345; letter-spacing:2px; word-break:break-all;">${k.keyValue}</p>
                 <p style="margin:8px 0 0; color:#64748b; font-size:12px;">Guarda esta clave en un lugar seguro · No la compartas</p>`
              : `<p style="margin:0; color:#dc2626; font-size:14px;">Tu clave será enviada en un correo separado en las próximas horas.</p>`
            }
          </div>
        `).join('')}
      </div>
    ` : '';

    await resend.emails.send({
      from: 'Precision Atelier <onboarding@resend.dev>',
      to: customerEmail,
      subject: `🔑 Licencia Lista — ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0; padding:0; font-family: 'Inter', Arial, sans-serif; background:#f8fafc;">
          <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #003345, #004b63); padding: 40px 32px; text-align:center;">
              <h1 style="color:#56f5f8; margin:0; font-size:24px; letter-spacing:-0.5px;">Precision Atelier</h1>
              <p style="color:#96ceeb; margin:8px 0 0; font-size:14px;">Software Profesional Premium</p>
            </div>

            <!-- Success icon -->
            <div style="text-align:center; padding: 40px 32px 24px;">
              <div style="width:72px; height:72px; background:linear-gradient(135deg,#00696b,#2ddbde); border-radius:50%; margin:0 auto 20px; font-size:40px; line-height:72px; text-align:center;">✓</div>
              <h2 style="color:#003345; margin:0 0 8px; font-size:28px;">¡Pedido Confirmado!</h2>
              <p style="color:#64748b; margin:0; font-size:16px;">Hola ${customerName || 'Cliente'}, gracias por tu compra.</p>
            </div>

            <!-- Order details -->
            <div style="padding: 0 32px 32px;">
              <div style="background:#f0f9ff; border-radius:12px; padding:20px 24px; margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                  <span style="color:#64748b; font-size:14px;">Número de Orden</span>
                  <span style="color:#003345; font-weight:700; font-size:14px;">${orderNumber}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:#64748b; font-size:14px;">Estado</span>
                  <span style="color:#00696b; font-weight:600; font-size:14px;">✅ Pagado</span>
                </div>
              </div>

              <!-- Items table -->
              <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:12px 16px; text-align:left; font-size:13px; color:#64748b; font-weight:600;">Producto</th>
                    <th style="padding:12px 16px; text-align:center; font-size:13px; color:#64748b; font-weight:600;">Cant.</th>
                    <th style="padding:12px 16px; text-align:right; font-size:13px; color:#64748b; font-weight:600;">Precio</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>

              <!-- Total -->
              <div style="border-top:2px solid #003345; padding-top:16px; text-align:right; margin-bottom:8px;">
                <span style="color:#64748b; font-size:14px;">Total pagado: </span>
                <span style="color:#003345; font-size:22px; font-weight:800;">€${amountTotal.toFixed(2)}</span>
              </div>
              <p style="text-align:right; margin:0; color:#94a3b8; font-size:12px;">IVA incluido</p>
            </div>

            <!-- License keys -->
            ${keysHtml}

            <!-- Footer -->
            <div style="background:#f8fafc; padding:24px 32px; text-align:center; border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8; font-size:12px; margin:0;">
                © 2024 Precision Atelier · Software Profesional Premium<br>
                Este email fue enviado a ${customerEmail}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('📧 Email con licencias enviado a:', customerEmail);
  } catch (err) {
    console.error('❌ Error enviando email:', err.message);
  }
}
