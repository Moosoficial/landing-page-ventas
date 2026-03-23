-- =============================================================================
-- supabase-licenses.sql
-- License Keys table for software license sales platform
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- =============================================================================

-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- TABLE: license_keys
-- =============================================================================

CREATE TABLE IF NOT EXISTS license_keys (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_key      TEXT        NOT NULL,         -- matches products.product_key ('photoshop', 'office', etc.)
  key_value        TEXT        NOT NULL UNIQUE,  -- the actual license key / serial number
  status           TEXT        NOT NULL DEFAULT 'available'
                               CHECK (status IN ('available', 'assigned', 'revoked')),
  assigned_to_email TEXT,
  assigned_at      TIMESTAMPTZ,
  order_id         UUID,                         -- soft reference to orders(id) — no FK to avoid cascade issues
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- INDEXES
-- =============================================================================

-- Fast lookup: "find an available key for product X"
CREATE INDEX IF NOT EXISTS idx_license_keys_product_status
  ON license_keys (product_key, status);

-- Look up all keys assigned to a given customer email
CREATE INDEX IF NOT EXISTS idx_license_keys_assigned_email
  ON license_keys (assigned_to_email);

-- Look up all keys linked to a specific order
CREATE INDEX IF NOT EXISTS idx_license_keys_order_id
  ON license_keys (order_id);


-- =============================================================================
-- ROW LEVEL SECURITY — NOTE
-- =============================================================================
-- RLS is intentionally NOT enabled on this table.
-- All interactions go through the backend using the Supabase SERVICE ROLE key,
-- which bypasses RLS entirely. Enabling RLS here would have no effect on
-- server-side operations and could interfere with key-assignment logic.
--
-- If you ever expose this table to client-side queries, enable RLS and add
-- appropriate policies:
--   ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SEED DATA — Example license keys for testing (all status = 'available')
-- =============================================================================

-- -------------------------------------------------------
-- Adobe Photoshop (product_key = 'photoshop')
-- -------------------------------------------------------
INSERT INTO license_keys (product_key, key_value, status) VALUES
  ('photoshop', 'PS24-A1B2-C3D4-E5F6', 'available'),
  ('photoshop', 'PS24-G7H8-I9J0-K1L2', 'available'),
  ('photoshop', 'PS24-M3N4-O5P6-Q7R8', 'available');

-- -------------------------------------------------------
-- Microsoft Office 365 (product_key = 'office')
-- -------------------------------------------------------
INSERT INTO license_keys (product_key, key_value, status) VALUES
  ('office', 'OFF365-1234-5678-ABCD', 'available'),
  ('office', 'OFF365-EFGH-IJKL-9012', 'available'),
  ('office', 'OFF365-MNOP-3456-QRST', 'available');

-- -------------------------------------------------------
-- AutoCAD 2024 (product_key = 'autocad')
-- -------------------------------------------------------
INSERT INTO license_keys (product_key, key_value, status) VALUES
  ('autocad', 'ACAD-2024-X1Y2-Z3W4', 'available'),
  ('autocad', 'ACAD-2024-V5U6-T7S8', 'available'),
  ('autocad', 'ACAD-2024-R9Q0-P1O2', 'available');

-- -------------------------------------------------------
-- Ableton Live 12 (product_key = 'ableton')
-- -------------------------------------------------------
INSERT INTO license_keys (product_key, key_value, status) VALUES
  ('ableton', 'ABL12-A1B2-C3D4-E5F6', 'available'),
  ('ableton', 'ABL12-G7H8-I9J0-K1L2', 'available'),
  ('ableton', 'ABL12-M3N4-O5P6-Q7R8', 'available');

-- -------------------------------------------------------
-- Adobe Illustrator (product_key = 'illustrator')
-- -------------------------------------------------------
INSERT INTO license_keys (product_key, key_value, status) VALUES
  ('illustrator', 'ILL24-A1B2-C3D4-E5F6', 'available'),
  ('illustrator', 'ILL24-G7H8-I9J0-K1L2', 'available'),
  ('illustrator', 'ILL24-M3N4-O5P6-Q7R8', 'available');


-- =============================================================================
-- VERIFICATION QUERY (optional — run manually to confirm seed data loaded)
-- =============================================================================
-- SELECT product_key, COUNT(*) AS total_keys,
--        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available
-- FROM license_keys
-- GROUP BY product_key
-- ORDER BY product_key;
