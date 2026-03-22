const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { cart, customerEmail, customerName } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.license,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const siteUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${siteUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?canceled=true`,
      metadata: {
        customer_name: customerName,
        cart_summary: JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity, license: i.license, price: i.price }))),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
