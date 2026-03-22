const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let stripeEvent;

  try {
    stripeEvent = req.body;
    console.log('📦 Body type:', typeof stripeEvent);
    console.log('📦 Event type:', stripeEvent?.type);
    console.log('📦 Body keys:', Object.keys(stripeEvent || {}));

    if (!stripeEvent || !stripeEvent.type) {
      console.error('❌ Evento invalido - body:', JSON.stringify(stripeEvent));
      return res.status(400).json({ error: 'Evento invalido' });
    }
  } catch (err) {
    console.error('Error parseando evento:', err.message);
    return res.status(400).json({ error: err.message });
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    try {
      const orderNumber = 'PA-' + session.id.slice(-8).toUpperCase();
      const cartItems = JSON.parse(session.metadata?.cart_summary || '[]');

      // Evitar duplicados si Stripe reintenta el webhook
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single();

      if (existing) {
        console.log('Pedido ya existe, ignorando duplicado:', orderNumber);
        return res.status(200).json({ received: true });
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email || '',
          customer_name: session.customer_details?.name || session.metadata?.customer_name || '',
          total_amount: session.amount_total / 100,
          payment_status: 'paid',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (cartItems.length > 0) {
        const items = cartItems.map(item => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          license_type: item.license || 'Licencia digital',
          quantity: item.qty || 1,
          unit_price: item.price || 0,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      console.log('✅ Pedido guardado en Supabase:', orderNumber);

    } catch (err) {
      console.error('❌ Error guardando pedido:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(200).json({ received: true });
}

module.exports = handler;
