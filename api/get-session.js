const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Falta session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items'],
    });

    const orderNumber = 'PA-' + session.id.slice(-8).toUpperCase();
    const customerEmail = session.customer_details?.email || '';
    const customerName = session.customer_details?.name || session.metadata?.customer_name || '';
    const amountTotal = session.amount_total / 100;

    // Guardar en Supabase si el pago fue exitoso
    if (session.payment_status === 'paid') {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Verificar si ya existe para evitar duplicados
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (!existing) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            stripe_session_id: session.id,
            customer_email: customerEmail,
            customer_name: customerName,
            total_amount: amountTotal,
            payment_status: 'paid',
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error guardando orden:', orderError.message);
        } else {
          // Guardar items del pedido
          const cartItems = JSON.parse(session.metadata?.cart_summary || '[]');
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
          console.log('✅ Pedido guardado:', orderNumber);
        }
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
