// ============================================================
// Amuche's Oven — Shared Data Access Helpers
// Centralizes common read/query flows for settings, cakes,
// orders, and WhatsApp follow-up records.
// ============================================================

import { supabaseClient, isSupabaseConfigured } from './config.js';
import {
  LOCAL_SETTINGS,
} from './dev-data.js';
import { getLocalDb } from './local-db.js';
import { generateRef } from './utils.js';

const SETTINGS_SELECT = 'key,value';
const CAKES_SELECT = `
  id, name, slug, description, category,
  base_price, is_featured, is_available, min_order_days, allows_custom, display_order,
  cake_images ( id, public_url, storage_path, is_primary, display_order, alt_text ),
  cake_variants ( id, flavor, size, price, serves, is_available, display_order )
`;

function rowsToSettings(rows) {
  return {
    ...LOCAL_SETTINGS,
    ...Object.fromEntries((rows || []).map((row) => [row.key, row.value])),
  };
}

function getLocalSettingsMap() {
  const db = getLocalDb();
  return rowsToSettings(db.settings || []);
}

function sortCakeRelations(cake) {
  if (!cake) return cake;
  return {
    ...cake,
    cake_images: [...(cake.cake_images || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    cake_variants: [...(cake.cake_variants || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
  };
}

function getLocalCakesFromDb() {
  const db = getLocalDb();
  return (db.cakes || [])
    .map((cake) =>
      sortCakeRelations({
        ...cake,
        cake_images: (db.cake_images || []).filter((image) => String(image.cake_id) === String(cake.id)),
        cake_variants: (db.cake_variants || []).filter((variant) => String(variant.cake_id) === String(cake.id)),
      })
    )
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

function getLocalAvailableCakes() {
  return getLocalCakesFromDb().filter((cake) => cake.is_available);
}

function getLocalFeaturedCakes(limit = 3) {
  return getLocalAvailableCakes()
    .filter((cake) => cake.is_featured)
    .slice(0, limit);
}

function getLocalCakeBySlug(slug) {
  return getLocalAvailableCakes().find((cake) => cake.slug === slug) || null;
}

function getLocalRelatedCakes(category, excludeId, limit = 3) {
  return getLocalAvailableCakes()
    .filter((cake) => cake.category === category && String(cake.id) !== String(excludeId))
    .slice(0, limit);
}

export async function fetchSettingsMap() {
  if (!isSupabaseConfigured) {
    return getLocalSettingsMap();
  }

  try {
    const { data, error } = await supabaseClient.from('settings').select(SETTINGS_SELECT);
    if (error) throw error;
    return rowsToSettings(data);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return getLocalSettingsMap();
  }
}

export async function fetchSettingValue(key, fallback = '') {
  const settings = await fetchSettingsMap();
  return settings[key] || fallback;
}

export async function fetchBusinessPhone() {
  return fetchSettingValue('business_phone', LOCAL_SETTINGS.business_phone);
}

export async function fetchAvailableCakes() {
  if (!isSupabaseConfigured) {
    return getLocalAvailableCakes();
  }

  try {
    const { data, error } = await supabaseClient
      .from('cakes')
      .select(CAKES_SELECT)
      .eq('is_available', true)
      .order('display_order');

    if (error) throw error;
    return (data || []).map(sortCakeRelations);
  } catch (error) {
    console.error('Available cakes fetch error:', error);
    return getLocalAvailableCakes();
  }
}

export async function fetchFeaturedCakes(limit = 3) {
  if (!isSupabaseConfigured) {
    return getLocalFeaturedCakes(limit);
  }

  try {
    const { data, error } = await supabaseClient
      .from('cakes')
      .select(CAKES_SELECT)
      .eq('is_featured', true)
      .eq('is_available', true)
      .order('display_order')
      .limit(limit);

    if (error) throw error;
    return (data || []).map(sortCakeRelations);
  } catch (error) {
    console.error('Featured cakes fetch error:', error);
    return getLocalFeaturedCakes(limit);
  }
}

export async function fetchCakeBySlug(slug) {
  if (!isSupabaseConfigured) {
    return getLocalCakeBySlug(slug);
  }

  try {
    const { data, error } = await supabaseClient
      .from('cakes')
      .select(CAKES_SELECT)
      .eq('slug', slug)
      .eq('is_available', true)
      .single();

    if (error) throw error;
    return sortCakeRelations(data);
  } catch (error) {
    console.error('Cake fetch error:', error);
    return getLocalCakeBySlug(slug);
  }
}

export async function fetchRelatedCakes(category, excludeId, limit = 3) {
  if (!isSupabaseConfigured) {
    return getLocalRelatedCakes(category, excludeId, limit);
  }

  try {
    const { data, error } = await supabaseClient
      .from('cakes')
      .select(CAKES_SELECT)
      .eq('is_available', true)
      .eq('category', category)
      .neq('id', excludeId)
      .limit(limit);

    if (error) throw error;
    return (data || []).map(sortCakeRelations);
  } catch (error) {
    console.error('Related cakes fetch error:', error);
    return getLocalRelatedCakes(category, excludeId, limit);
  }
}

export async function fetchOrderById(id) {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchOrderByNumber(orderNumber) {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', orderNumber)
    .single();

  if (error) throw error;
  return data;
}

export async function searchOrders({
  page = 0,
  pageSize = 15,
  search = '',
  status = '',
  payment = '',
  source = '',
} = {}) {
  let query = supabaseClient
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (status) query = query.eq('status', status);
  if (payment) query = query.eq('payment_status', payment);
  if (source) query = query.eq('order_source', source);
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function fetchRecentOrders(limit = 8) {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('order_number,customer_name,total,status,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchOrdersForDeliveryRange({
  start,
  end,
  limit,
  includeItems = false,
  excludeCancelled = false,
} = {}) {
  const select = includeItems
    ? 'id,order_number,customer_name,delivery_date,delivery_time,status,total,is_delivery,order_items(cake_name)'
    : 'order_number,customer_name,delivery_date,status';

  let query = supabaseClient
    .from('orders')
    .select(select)
    .gte('delivery_date', start)
    .lte('delivery_date', end)
    .order('delivery_date');

  if (excludeCancelled) {
    query = query.not('status', 'eq', 'cancelled');
  }
  if (limit != null) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [todayRes, pendingRes, revenueRes, totalRes] = await Promise.all([
    supabaseClient.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
    supabaseClient.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseClient.from('orders').select('total').gte('created_at', monthStart).neq('status', 'cancelled'),
    supabaseClient.from('orders').select('id', { count: 'exact', head: true }),
  ]);

  return {
    todayCount: todayRes.count ?? 0,
    pendingCount: pendingRes.count ?? 0,
    totalCount: totalRes.count ?? 0,
    revenue: (revenueRes.data || []).reduce((sum, order) => sum + Number(order.total), 0),
  };
}

export async function fetchPendingWhatsappOrders(limit = 10) {
  const { data, count, error } = await supabaseClient
    .from('whatsapp_orders')
    .select('*', { count: 'exact' })
    .eq('is_converted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return {
    data: data || [],
    count: count || 0,
  };
}

export async function generateOrderNumber() {
  try {
    const { data, error } = await supabaseClient.rpc('generate_order_number');
    if (error) throw error;
    return data || `AOV-${new Date().getFullYear()}-${generateRef(4)}`;
  } catch (error) {
    console.error('Order number generation error:', error);
    return `AOV-${new Date().getFullYear()}-${generateRef(4)}`;
  }
}
