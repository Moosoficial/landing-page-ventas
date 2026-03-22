const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    try {
      const orderNumber = 'PA-' + session.id.slice(-8).toUpperCase();
      const cartItems = JSON.parse(session.metadata?.cart_summary || '[]');

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
    }
  }

  return res.status(200).json({ received: true });
}

handler.config = { api: { bodyParser: false } };
module.exports = handler;
