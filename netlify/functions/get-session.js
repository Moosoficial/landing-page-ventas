const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { session_id } = event.queryStringParameters || {};

  if (!session_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta session_id' }) };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: session.customer_details?.email || '',
        customerName: session.customer_details?.name || session.metadata?.customer_name || '',
        amountTotal: session.amount_total / 100,
        paymentStatus: session.payment_status,
        orderNumber: 'PA-' + session.id.slice(-8).toUpperCase(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
