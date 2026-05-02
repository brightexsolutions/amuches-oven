-- ============================================================
-- Amuche's Oven — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CAKES / LISTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS cakes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'birthday',
    -- birthday | wedding | anniversary | custom | everyday | corporate
  is_available  BOOLEAN NOT NULL DEFAULT true,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  base_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
  allows_custom BOOLEAN NOT NULL DEFAULT false,
  min_order_days INT NOT NULL DEFAULT 3,
    -- minimum days advance notice required
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAKE IMAGES (multiple images per cake, stored in Supabase Storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS cake_images (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cake_id       UUID NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  alt_text      TEXT,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAKE VARIANTS (flavors × sizes → individual pricing)
-- ============================================================
CREATE TABLE IF NOT EXISTS cake_variants (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cake_id       UUID NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
  flavor        TEXT NOT NULL,
    -- e.g. "Chocolate Fudge", "Vanilla Bean", "Red Velvet", "Lemon Drizzle", "Strawberry"
  size          TEXT NOT NULL,
    -- e.g. "6 inch (serves 8)", "8 inch (serves 12)", "10 inch (serves 20)", "2-tier", "3-tier"
  price         DECIMAL(10,2) NOT NULL,
  serves        INT,
  is_available  BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number    TEXT UNIQUE NOT NULL,
    -- format: AOV-2024-0001
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_email  TEXT,
  delivery_address TEXT,
  delivery_date   DATE NOT NULL,
  delivery_time   TEXT,
    -- "Morning (9AM-12PM)" | "Afternoon (12PM-4PM)" | "Evening (4PM-7PM)" | "Pickup"

  -- Order source
  order_source    TEXT NOT NULL DEFAULT 'website',
    -- website | whatsapp | phone | walk_in
  whatsapp_ref    TEXT,
    -- WhatsApp order tracking reference

  -- Lifecycle status
  status          TEXT NOT NULL DEFAULT 'pending',
    -- pending | confirmed | baking | decorating | ready | delivered | cancelled
  payment_status  TEXT NOT NULL DEFAULT 'unpaid',
    -- unpaid | partial | paid
  payment_method  TEXT,
    -- bank_transfer | cash | mobile_money | card

  -- Financials
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee    DECIMAL(10,2) NOT NULL DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Flags
  is_custom       BOOLEAN NOT NULL DEFAULT false,
  is_delivery     BOOLEAN NOT NULL DEFAULT true,

  -- Notes
  special_notes   TEXT,
  admin_notes     TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  cake_id             UUID REFERENCES cakes(id) ON DELETE SET NULL,
  variant_id          UUID REFERENCES cake_variants(id) ON DELETE SET NULL,

  -- Denormalized (in case cake is later deleted)
  cake_name           TEXT NOT NULL,
  flavor              TEXT,
  size                TEXT,
  quantity            INT NOT NULL DEFAULT 1,
  unit_price          DECIMAL(10,2) NOT NULL,
  subtotal            DECIMAL(10,2) NOT NULL,

  -- For custom/bespoke items
  custom_description  TEXT,
  custom_price        DECIMAL(10,2)
);

-- ============================================================
-- WHATSAPP ORDER TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_orders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  reference_code  TEXT UNIQUE NOT NULL,
    -- short code shared with customer e.g. WA-20241201-XK9
  customer_phone  TEXT NOT NULL,
  message_preview TEXT,
  is_converted    BOOLEAN NOT NULL DEFAULT false,
    -- true when a proper order record is created from this WA order
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEDULE / BAKING CALENDAR
-- ============================================================
CREATE TABLE IF NOT EXISTS schedule (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
    -- baking | decorating | quality_check | delivery | pickup
  scheduled_date  DATE NOT NULL,
  scheduled_time  TEXT,
  duration_mins   INT NOT NULL DEFAULT 120,
  notes           TEXT,
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SETTINGS (key-value store for business config)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  label       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO settings (key, value, label) VALUES
  ('business_phone',    '+254700000000',          'Business WhatsApp/Phone'),
  ('business_email',    'hello@amuchesoven.co.ke',   'Business Email'),
  ('business_address',  'Nairobi, Kenya',           'Business Address'),
  ('delivery_fee',      '300',                    'Default Delivery Fee (KES)'),
  ('min_order_days',    '3',                        'Minimum advance days for orders'),
  ('business_hours',    '8AM - 8PM (Mon-Sat)',      'Business Hours'),
  ('currency_symbol',   'KSh',                        'Currency Symbol'),
  ('instagram_url',     '',                         'Instagram URL'),
  ('facebook_url',      '',                         'Facebook URL')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ORDER NUMBER SEQUENCE FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  seq INT;
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq FROM orders 
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  RETURN 'AOV-' || year_str || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cakes_updated_at BEFORE UPDATE ON cakes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cakes_category    ON cakes(category);
CREATE INDEX IF NOT EXISTS idx_cakes_featured    ON cakes(is_featured);
CREATE INDEX IF NOT EXISTS idx_cakes_available   ON cakes(is_available);
CREATE INDEX IF NOT EXISTS idx_cake_images_cake  ON cake_images(cake_id);
CREATE INDEX IF NOT EXISTS idx_variants_cake     ON cake_variants(cake_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date       ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_source     ON orders(order_source);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_schedule_date     ON schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedule_order    ON schedule(order_id);
