-- Tabla de pedidos
CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  stripe_session_id text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  total_amount numeric NOT NULL,
  payment_status text DEFAULT 'paid',
  created_at timestamptz DEFAULT now()
);

-- Tabla de items por pedido
CREATE TABLE order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  license_type text,
  quantity integer DEFAULT 1,
  unit_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes para busquedas rapidas
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_stripe ON orders(stripe_session_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
