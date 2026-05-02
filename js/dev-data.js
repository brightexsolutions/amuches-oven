// ============================================================
// Amuche's Oven — Shared Development Fallback Data
// ============================================================

export const LOCAL_SETTINGS = {
  business_phone: '+254700000000',
  business_email: 'hello@amuchesoven.co.ke',
  business_address: 'Nairobi, Kenya',
  business_hours: '8AM – 8PM (Mon–Sat)',
  delivery_fee: '300',
  min_order_days: '3',
  currency_symbol: 'KSh',
  instagram_url: '#',
  facebook_url: '#',
  tiktok_url: '#',
  announcement_enabled: 'true',
  announcement_text: 'Free delivery on wedding cakes and orders above KSh 5,000 within Nairobi.',
  announcement_link_label: 'Order now',
  announcement_link_url: './order.html',
};

const LOCAL_CAKES = [
  {
    id: 1,
    name: 'Classic Chocolate Delight',
    slug: 'classic-chocolate-delight',
    description: 'Rich chocolate cake with smooth ganache filling and decadent frosting.',
    category: 'birthday',
    base_price: 3500,
    is_featured: true,
    min_order_days: 2,
    allows_custom: false,
    is_available: true,
    display_order: 1,
    cake_images: [
      {
        id: 1,
        public_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80&auto=format&fit=crop',
        is_primary: true,
        display_order: 1,
        alt_text: 'Classic Chocolate Delight cake',
      },
    ],
    cake_variants: [
      { id: 1, flavor: 'Chocolate', size: '6"', price: 3500, serves: 8, is_available: true, display_order: 1 },
      { id: 2, flavor: 'Chocolate', size: '8"', price: 5500, serves: 15, is_available: true, display_order: 2 },
      { id: 3, flavor: 'Chocolate', size: '10"', price: 7500, serves: 25, is_available: true, display_order: 3 },
    ],
  },
  {
    id: 2,
    name: 'Vanilla Dream Wedding Cake',
    slug: 'vanilla-dream-wedding-cake',
    description: 'Elegant vanilla cake with buttercream roses — perfect for weddings.',
    category: 'wedding',
    base_price: 12000,
    is_featured: true,
    min_order_days: 7,
    allows_custom: true,
    is_available: true,
    display_order: 2,
    cake_images: [
      {
        id: 2,
        public_url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&q=80&auto=format&fit=crop',
        is_primary: true,
        display_order: 1,
        alt_text: 'Vanilla Dream Wedding Cake',
      },
    ],
    cake_variants: [
      { id: 4, flavor: 'Vanilla', size: '2-Tier', price: 12000, serves: 40, is_available: true, display_order: 1 },
      { id: 5, flavor: 'Lemon', size: '2-Tier', price: 14000, serves: 40, is_available: true, display_order: 2 },
      { id: 6, flavor: 'Vanilla', size: '3-Tier', price: 18000, serves: 60, is_available: true, display_order: 3 },
    ],
  },
  {
    id: 3,
    name: 'Red Velvet Romance',
    slug: 'red-velvet-romance',
    description: 'Classic red velvet with cream cheese frosting — a timeless favorite.',
    category: 'anniversary',
    base_price: 4500,
    is_featured: true,
    min_order_days: 2,
    allows_custom: false,
    is_available: true,
    display_order: 3,
    cake_images: [
      {
        id: 3,
        public_url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=800&q=80&auto=format&fit=crop',
        is_primary: true,
        display_order: 1,
        alt_text: 'Red Velvet Romance cake',
      },
    ],
    cake_variants: [
      { id: 7, flavor: 'Red Velvet', size: '6"', price: 4500, serves: 8, is_available: true, display_order: 1 },
      { id: 8, flavor: 'Red Velvet', size: '8"', price: 6500, serves: 15, is_available: true, display_order: 2 },
    ],
  },
  {
    id: 4,
    name: 'Strawberry Dream',
    slug: 'strawberry-dream',
    description: 'Light strawberry cake with fresh berry filling and whipped cream.',
    category: 'birthday',
    base_price: 3800,
    is_featured: false,
    min_order_days: 2,
    allows_custom: false,
    is_available: true,
    display_order: 4,
    cake_images: [
      {
        id: 4,
        public_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80&auto=format&fit=crop',
        is_primary: true,
        display_order: 1,
        alt_text: 'Strawberry Dream cake',
      },
    ],
    cake_variants: [
      { id: 9, flavor: 'Strawberry', size: '6"', price: 3800, serves: 8, is_available: true, display_order: 1 },
      { id: 10, flavor: 'Strawberry', size: '8"', price: 5800, serves: 15, is_available: true, display_order: 2 },
    ],
  },
  {
    id: 5,
    name: 'Carrot Cake Special',
    slug: 'carrot-cake-special',
    description: 'Spiced carrot cake with cream cheese frosting and walnuts.',
    category: 'everyday',
    base_price: 3200,
    is_featured: false,
    min_order_days: 1,
    allows_custom: false,
    is_available: true,
    display_order: 5,
    cake_images: [
      {
        id: 5,
        public_url: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80&auto=format&fit=crop',
        is_primary: true,
        display_order: 1,
        alt_text: 'Carrot Cake Special',
      },
    ],
    cake_variants: [
      { id: 11, flavor: 'Carrot', size: '6"', price: 3200, serves: 8, is_available: true, display_order: 1 },
      { id: 12, flavor: 'Carrot', size: '8"', price: 5200, serves: 15, is_available: true, display_order: 2 },
    ],
  },
  {
    id: 6,
    name: 'Black Forest Gateau',
    slug: 'black-forest-gateau',
    description: 'Classic German chocolate cake with cherries and whipped cream.',
    category: 'birthday',
    base_price: 4200,
    is_featured: false,
    min_order_days: 2,
    allows_custom: false,
    is_available: true,
    display_order: 6,
    cake_images: [
      {
        id: 6,
        public_url: 'https://images.unsplash.com/photo-1605807646983-377bc5a76493?w=800&q=80&auto=format&fit=crop',
        is_primary: true,
        display_order: 1,
        alt_text: 'Black Forest Gateau',
      },
    ],
    cake_variants: [
      { id: 13, flavor: 'Chocolate', size: '6"', price: 4200, serves: 8, is_available: true, display_order: 1 },
      { id: 14, flavor: 'Chocolate', size: '8"', price: 6200, serves: 15, is_available: true, display_order: 2 },
    ],
  },
  {
    id: 7,
    name: 'Lemon Drip Cake',
    slug: 'lemon-drip-cake',
    description: 'Zesty lemon cake with lemon curd filling and white chocolate drip.',
    category: 'everyday',
    base_price: 3600,
    is_featured: false,
    min_order_days: 2,
    allows_custom: false,
    is_available: true,
    display_order: 7,
    cake_images: [
      {
        id: 7,
        public_url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80&auto=format&fit=crop',
        is_primary: true,
        display_order: 1,
        alt_text: 'Lemon Drip Cake',
      },
    ],
    cake_variants: [
      { id: 15, flavor: 'Lemon', size: '6"', price: 3600, serves: 8, is_available: true, display_order: 1 },
      { id: 16, flavor: 'Lemon', size: '8"', price: 5600, serves: 15, is_available: true, display_order: 2 },
    ],
  },
  {
    id: 8,
    name: 'Corporate Celebration Cake',
    slug: 'corporate-celebration-cake',
    description: 'Professional cake for corporate events — customizable with company branding.',
    category: 'corporate',
    base_price: 8000,
    is_featured: false,
    min_order_days: 5,
    allows_custom: true,
    is_available: true,
    display_order: 8,
    cake_images: [
      {
        id: 8,
        public_url: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=800&q=80&auto=format&fit=crop',
        is_primary: true,
        display_order: 1,
        alt_text: 'Corporate Celebration Cake',
      },
    ],
    cake_variants: [
      { id: 17, flavor: 'Vanilla', size: 'Large', price: 8000, serves: 30, is_available: true, display_order: 1 },
      { id: 18, flavor: 'Chocolate', size: 'Large', price: 8000, serves: 30, is_available: true, display_order: 2 },
    ],
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getLocalCakes() {
  return clone(LOCAL_CAKES);
}

export function getLocalFeaturedCakes(limit = 3) {
  return getLocalCakes()
    .filter((cake) => cake.is_featured && cake.is_available)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .slice(0, limit);
}

export function getLocalCakeBySlug(slug) {
  return getLocalCakes().find((cake) => cake.slug === slug) || null;
}

export function getLocalRelatedCakes(category, excludeId, limit = 3) {
  return getLocalCakes()
    .filter((cake) => cake.is_available && cake.category === category && String(cake.id) !== String(excludeId))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .slice(0, limit);
}
