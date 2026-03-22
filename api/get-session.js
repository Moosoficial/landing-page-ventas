const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Falta session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    return res.status(200).json({
      customerEmail: session.customer_details?.email || '',
      customerName: session.customer_details?.name || session.metadata?.customer_name || '',
      amountTotal: session.amount_total / 100,
      paymentStatus: session.payment_status,
      orderNumber: 'PA-' + session.id.slice(-8).toUpperCase(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
