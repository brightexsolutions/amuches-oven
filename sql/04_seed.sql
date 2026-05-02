-- ============================================================
-- Amuche's Oven — Sample Seed Data
-- Run LAST, after all other SQL files
-- Uses Unsplash image URLs as placeholders (replace with real Supabase storage URLs)
-- ============================================================

-- ============================================================
-- SAMPLE CAKES
-- ============================================================

-- 1. Classic Birthday Cake
INSERT INTO cakes (id, name, slug, description, category, is_available, is_featured, base_price, allows_custom, min_order_days, display_order)
VALUES (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Classic Birthday Cake',
  'classic-birthday-cake',
  'A timeless celebration cake layered with your choice of flavour and finished with smooth buttercream or fondant. Perfect for birthdays of any age.',
  'birthday',
  true,
  true,
  12000,
  true,
  3,
  1
);

-- 2. Luxury Wedding Cake
INSERT INTO cakes (id, name, slug, description, category, is_available, is_featured, base_price, allows_custom, min_order_days, display_order)
VALUES (
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Luxury Wedding Cake',
  'luxury-wedding-cake',
  'An elegant multi-tiered masterpiece crafted for your most special day. Available in two or three tiers with custom floral or pearl decorations.',
  'wedding',
  true,
  true,
  85000,
  true,
  14,
  2
);

-- 3. Chocolate Lava Cake
INSERT INTO cakes (id, name, slug, description, category, is_available, is_featured, base_price, allows_custom, min_order_days, display_order)
VALUES (
  'a1b2c3d4-0003-0003-0003-000000000003',
  'Chocolate Dream Cake',
  'chocolate-dream-cake',
  'Rich, indulgent layers of dark chocolate sponge filled with velvety ganache and topped with chocolate shards. A chocoholic''s paradise.',
  'everyday',
  true,
  true,
  15000,
  false,
  2,
  3
);

-- 4. Anniversary Cake
INSERT INTO cakes (id, name, slug, description, category, is_available, is_featured, base_price, allows_custom, min_order_days, display_order)
VALUES (
  'a1b2c3d4-0004-0004-0004-000000000004',
  'Anniversary Delight',
  'anniversary-delight',
  'Celebrate your love with a romantic cake adorned with edible roses and a personalised message. Made to make every anniversary unforgettable.',
  'anniversary',
  true,
  false,
  18000,
  true,
  5,
  4
);

-- 5. Corporate Event Cake
INSERT INTO cakes (id, name, slug, description, category, is_available, is_featured, base_price, allows_custom, min_order_days, display_order)
VALUES (
  'a1b2c3d4-0005-0005-0005-000000000005',
  'Corporate Celebration Cake',
  'corporate-celebration-cake',
  'Professionally branded cakes for launches, milestones, and corporate events. Logo printing, brand colours, and custom messaging available.',
  'corporate',
  true,
  false,
  35000,
  true,
  7,
  5
);

-- 6. Red Velvet Classic
INSERT INTO cakes (id, name, slug, description, category, is_available, is_featured, base_price, allows_custom, min_order_days, display_order)
VALUES (
  'a1b2c3d4-0006-0006-0006-000000000006',
  'Red Velvet Classic',
  'red-velvet-classic',
  'The beloved red velvet — moist, vibrant layers paired with tangy cream cheese frosting. A crowd favourite for any occasion.',
  'birthday',
  true,
  false,
  13500,
  false,
  3,
  6
);

-- ============================================================
-- CAKE VARIANTS (flavors × sizes × prices)
-- ============================================================

-- Classic Birthday Cake variants
INSERT INTO cake_variants (cake_id, flavor, size, price, serves, display_order) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Vanilla Bean',       '6 inch (serves 8)', 1200, 8,  1),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Vanilla Bean',       '8 inch (serves 12)', 1700, 12, 2),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Vanilla Bean',       '10 inch (serves 20)', 2300, 20, 3),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Chocolate Fudge',    '6 inch (serves 8)', 1300, 8,  4),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Chocolate Fudge',    '8 inch (serves 12)', 1850, 12, 5),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Chocolate Fudge',    '10 inch (serves 20)', 2500, 20, 6),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Lemon Drizzle',      '6 inch (serves 8)', 1250, 8,  7),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Lemon Drizzle',      '8 inch (serves 12)', 1750, 12, 8),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Strawberry Cream',   '6 inch (serves 8)', 1400, 8,  9),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Strawberry Cream',   '8 inch (serves 12)', 1950, 12, 10);

-- Luxury Wedding Cake variants
INSERT INTO cake_variants (cake_id, flavor, size, price, serves, display_order) VALUES
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Vanilla & Champagne', '2-Tier (serves 30)', 8500, 30,  1),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Vanilla & Champagne', '3-Tier (serves 60)', 14500, 60,  2),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Chocolate & Raspberry','2-Tier (serves 30)', 9000, 30,  3),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Chocolate & Raspberry','3-Tier (serves 60)', 15500, 60,  4),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Lemon & Elderflower', '2-Tier (serves 30)', 8800, 30,  5),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Lemon & Elderflower', '3-Tier (serves 60)', 15000, 60,  6);

-- Chocolate Dream Cake variants
INSERT INTO cake_variants (cake_id, flavor, size, price, serves, display_order) VALUES
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Dark Chocolate',      '6 inch (serves 8)', 1500, 8,  1),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Dark Chocolate',      '8 inch (serves 12)', 2100, 12, 2),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Dark Chocolate',      '10 inch (serves 20)', 2800, 20, 3),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Milk Chocolate',      '6 inch (serves 8)', 1450, 8,  4),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Milk Chocolate',      '8 inch (serves 12)', 2000, 12, 5);

-- Anniversary Delight variants
INSERT INTO cake_variants (cake_id, flavor, size, price, serves, display_order) VALUES
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Rose & Vanilla',      '6 inch (serves 8)', 1800, 8,  1),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Rose & Vanilla',      '8 inch (serves 12)', 2600, 12, 2),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Champagne & Berry',   '6 inch (serves 8)', 2000, 8,  3),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Champagne & Berry',   '8 inch (serves 12)', 2900, 12, 4);

-- Red Velvet variants
INSERT INTO cake_variants (cake_id, flavor, size, price, serves, display_order) VALUES
  ('a1b2c3d4-0006-0006-0006-000000000006', 'Red Velvet',          '6 inch (serves 8)', 1350, 8,  1),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'Red Velvet',          '8 inch (serves 12)', 1900, 12, 2),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'Red Velvet',          '10 inch (serves 20)', 2600, 20, 3);

-- Corporate variants
INSERT INTO cake_variants (cake_id, flavor, size, price, serves, display_order) VALUES
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Vanilla (Branded)',   'Sheet Cake (30)', 3500, 30, 1),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Chocolate (Branded)', 'Sheet Cake (30)', 3700, 30, 2),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Assorted (Branded)',  'Sheet Cake (50)', 5500, 50, 3);

-- ============================================================
-- CAKE IMAGES (Unsplash placeholder URLs — replace with Supabase storage URLs)
-- ============================================================
INSERT INTO cake_images (cake_id, storage_path, public_url, alt_text, is_primary, display_order) VALUES
  -- Classic Birthday Cake
  ('a1b2c3d4-0001-0001-0001-000000000001', 'placeholder', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80&auto=format&fit=crop', 'Classic birthday cake with pastel frosting', true, 1),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'placeholder', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80&auto=format&fit=crop', 'Birthday cake slice close up', false, 2),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'placeholder', 'https://images.unsplash.com/photo-1620182901755-44b5a45f6c14?w=800&q=80&auto=format&fit=crop', 'Layered birthday cake decoration', false, 3),

  -- Luxury Wedding Cake
  ('a1b2c3d4-0002-0002-0002-000000000002', 'placeholder', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&q=80&auto=format&fit=crop', 'Elegant white wedding cake with flowers', true, 1),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'placeholder', 'https://images.unsplash.com/photo-1547007264-7c20ff61cf5c?w=800&q=80&auto=format&fit=crop', 'Multi-tier wedding cake detail', false, 2),

  -- Chocolate Dream
  ('a1b2c3d4-0003-0003-0003-000000000003', 'placeholder', 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80&auto=format&fit=crop', 'Rich chocolate layer cake', true, 1),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'placeholder', 'https://images.unsplash.com/photo-1567327613485-fbc7bf616f26?w=800&q=80&auto=format&fit=crop', 'Chocolate cake with ganache drip', false, 2),

  -- Anniversary Delight
  ('a1b2c3d4-0004-0004-0004-000000000004', 'placeholder', 'https://images.unsplash.com/photo-1587117312344-9a17b3e22dd6?w=800&q=80&auto=format&fit=crop', 'Romantic anniversary cake with roses', true, 1),

  -- Corporate Cake
  ('a1b2c3d4-0005-0005-0005-000000000005', 'placeholder', 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80&auto=format&fit=crop', 'Corporate branded sheet cake', true, 1),

  -- Red Velvet
  ('a1b2c3d4-0006-0006-0006-000000000006', 'placeholder', 'https://images.unsplash.com/photo-1586788224331-947f68671cf1?w=800&q=80&auto=format&fit=crop', 'Red velvet cake with cream cheese frosting', true, 1),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'placeholder', 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&q=80&auto=format&fit=crop', 'Red velvet slice showing layers', false, 2);
