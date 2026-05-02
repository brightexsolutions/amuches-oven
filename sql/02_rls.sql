-- ============================================================
-- Amuche's Oven — Row Level Security (RLS) Policies
-- Run AFTER 01_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE cakes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_variants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule        ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ ACCESS (anon users can browse cakes)
-- ============================================================

-- Anyone can view available cakes
DROP POLICY IF EXISTS "Public can view available cakes" ON cakes;
CREATE POLICY "Public can view available cakes"
  ON cakes FOR SELECT
  USING (is_available = true);

-- Anyone can view cake images
DROP POLICY IF EXISTS "Public can view cake images" ON cake_images;
CREATE POLICY "Public can view cake images"
  ON cake_images FOR SELECT
  USING (true);

-- Anyone can view available variants
DROP POLICY IF EXISTS "Public can view variants" ON cake_variants;
CREATE POLICY "Public can view variants"
  ON cake_variants FOR SELECT
  USING (is_available = true);

-- Anyone can view public settings (for business info display)
DROP POLICY IF EXISTS "Public can view settings" ON settings;
CREATE POLICY "Public can view settings"
  ON settings FOR SELECT
  USING (true);

-- ============================================================
-- PUBLIC WRITE ACCESS (guests can place orders)
-- ============================================================

-- Anyone can create an order (no login required)
DROP POLICY IF EXISTS "Public can create orders" ON orders;
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Anyone can create order items
DROP POLICY IF EXISTS "Public can create order items" ON order_items;
CREATE POLICY "Public can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Anyone can track a WhatsApp order
DROP POLICY IF EXISTS "Public can create whatsapp orders" ON whatsapp_orders;
CREATE POLICY "Public can create whatsapp orders"
  ON whatsapp_orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view own order by number" ON orders;
DROP POLICY IF EXISTS "Public can view own order items" ON order_items;

-- ============================================================
-- AUTHENTICATED (ADMIN) FULL ACCESS
-- ============================================================

-- Admin can do everything on cakes
DROP POLICY IF EXISTS "Admin full access on cakes" ON cakes;
CREATE POLICY "Admin full access on cakes"
  ON cakes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin full access on images
DROP POLICY IF EXISTS "Admin full access on cake images" ON cake_images;
CREATE POLICY "Admin full access on cake images"
  ON cake_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin full access on variants
DROP POLICY IF EXISTS "Admin full access on variants" ON cake_variants;
CREATE POLICY "Admin full access on variants"
  ON cake_variants FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin full access on orders
DROP POLICY IF EXISTS "Admin full access on orders" ON orders;
CREATE POLICY "Admin full access on orders"
  ON orders FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin full access on order items
DROP POLICY IF EXISTS "Admin full access on order items" ON order_items;
CREATE POLICY "Admin full access on order items"
  ON order_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin full access on whatsapp orders
DROP POLICY IF EXISTS "Admin full access on whatsapp orders" ON whatsapp_orders;
CREATE POLICY "Admin full access on whatsapp orders"
  ON whatsapp_orders FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin full access on schedule
DROP POLICY IF EXISTS "Admin full access on schedule" ON schedule;
CREATE POLICY "Admin full access on schedule"
  ON schedule FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin full access on settings
DROP POLICY IF EXISTS "Admin full access on settings" ON settings;
CREATE POLICY "Admin full access on settings"
  ON settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
