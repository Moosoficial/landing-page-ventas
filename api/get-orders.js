const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Falta el email' });
  }

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        payment_status,
        created_at,
        order_items (
          product_name,
          license_type,
          quantity,
          unit_price
        )
      `)
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ orders });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
