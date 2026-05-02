import { LOCAL_SETTINGS, getLocalCakes } from './dev-data.js';

export const LOCAL_DB_KEY = 'amuches-oven-local-db';
export const LOCAL_AUTH_KEY = 'amuches-oven-local-admin-session';
export const LOCAL_ADMIN_KEY = 'amuches-oven-local-admin-user';
export const LOCAL_BUCKET = 'cake-images';

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function makeId(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10)}`;
}

function getDefaultCakes() {
  return getLocalCakes().map(({ cake_images, cake_variants, ...cake }) => cake);
}

function getDefaultCakeImages() {
  return getLocalCakes().flatMap((cake) =>
    (cake.cake_images || []).map((image) => ({
      ...image,
      cake_id: cake.id,
      storage_path: image.storage_path || `local/cakes/${cake.slug}/${image.id || 'main'}.jpg`,
    }))
  );
}

function getDefaultCakeVariants() {
  return getLocalCakes().flatMap((cake) =>
    (cake.cake_variants || []).map((variant) => ({
      ...variant,
      cake_id: cake.id,
    }))
  );
}

function getDefaultOrders() {
  return [
    {
      id: 'ord-1',
      order_number: 'AOV-2026-DEMO1',
      customer_name: 'Jane Wanjiku',
      customer_phone: '+254700111222',
      customer_email: 'jane@example.com',
      delivery_address: 'Westlands, Nairobi',
      delivery_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      delivery_time: '10:00 AM - 12:00 PM',
      order_source: 'website',
      status: 'pending',
      payment_status: 'unpaid',
      payment_method: 'mobile_money',
      subtotal: 3500,
      delivery_fee: 300,
      total: 3800,
      is_delivery: true,
      is_custom: false,
      tracking_token: 'TRACKDEMO1',
      special_notes: 'Please write Happy Birthday on the cake.',
      admin_notes: '',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

function getDefaultOrderItems() {
  return [
    {
      id: 'item-1',
      order_id: 'ord-1',
      cake_id: 1,
      variant_id: 1,
      cake_name: 'Classic Chocolate Delight',
      flavor: 'Chocolate',
      size: '6"',
      quantity: 1,
      unit_price: 3500,
      subtotal: 3500,
      custom_description: null,
      custom_price: null,
    },
  ];
}

function getDefaultWhatsAppOrders() {
  return [
    {
      id: 'wa-1',
      reference_code: 'WA-DEMO1',
      customer_phone: '+254700333444',
      message_preview: 'Need a wedding cake for next Saturday.',
      is_converted: false,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];
}

export function buildDefaultDb() {
  return {
    settings: Object.entries(LOCAL_SETTINGS).map(([key, value]) => ({
      id: makeId('setting'),
      key,
      value,
      updated_at: new Date().toISOString(),
    })),
    cakes: clone(getDefaultCakes()),
    cake_images: clone(getDefaultCakeImages()),
    cake_variants: clone(getDefaultCakeVariants()),
    orders: clone(getDefaultOrders()),
    order_items: clone(getDefaultOrderItems()),
    whatsapp_orders: clone(getDefaultWhatsAppOrders()),
  };
}

export function getLocalDb() {
  const defaults = buildDefaultDb();
  const raw = localStorage.getItem(LOCAL_DB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const hydrated = {
        ...defaults,
        ...parsed,
        settings: Array.isArray(parsed.settings) && parsed.settings.length ? parsed.settings : defaults.settings,
        cakes: Array.isArray(parsed.cakes) && parsed.cakes.length ? parsed.cakes : defaults.cakes,
        cake_images: Array.isArray(parsed.cake_images) && parsed.cake_images.length ? parsed.cake_images : defaults.cake_images,
        cake_variants: Array.isArray(parsed.cake_variants) && parsed.cake_variants.length ? parsed.cake_variants : defaults.cake_variants,
        orders: Array.isArray(parsed.orders) ? parsed.orders : defaults.orders,
        order_items: Array.isArray(parsed.order_items) ? parsed.order_items : defaults.order_items,
        whatsapp_orders: Array.isArray(parsed.whatsapp_orders) ? parsed.whatsapp_orders : defaults.whatsapp_orders,
      };

      saveLocalDb(hydrated);
      return hydrated;
    } catch {}
  }

  saveLocalDb(defaults);
  return defaults;
}

export function saveLocalDb(db) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

export function getLocalAdminUser() {
  const raw = localStorage.getItem(LOCAL_ADMIN_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  const user = {
    email: 'admin@amuchesoven.co.ke',
    password: 'admin12345',
  };
  localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(user));
  return user;
}

export function getLocalSession() {
  const raw = localStorage.getItem(LOCAL_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocalSession(session) {
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
}

export function clearLocalSession() {
  localStorage.removeItem(LOCAL_AUTH_KEY);
}
