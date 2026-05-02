// ============================================================
// Amuche's Oven — Data + Auth Configuration
// Supports Supabase in production and localStorage fallback
// during development when env keys are missing.
// ============================================================

import { createLocalClient } from './local-client.js';
import { LOCAL_BUCKET } from './local-db.js';

const SUPABASE_URL = window.__ENV__?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.warn("[Amuche's Oven] Supabase credentials missing. Using localStorage fallback mode.");
}

export const supabaseClient = isSupabaseConfigured
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'amuches-oven-auth',
      },
      global: {
        headers: { 'x-application-name': 'amuches-oven' },
      },
    })
  : createLocalClient();

export async function signIn(email, password) {
  return supabaseClient.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabaseClient.auth.signOut();
}

export async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data?.session ?? null;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    window.location.href = './login.html';
    return null;
  }
  return session;
}

export async function uploadCakeImage(file, path) {
  const { data, error } = await supabaseClient.storage.from(LOCAL_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: true,
    contentType: file.type,
  });

  if (error) return { url: null, path: null, error: error.message };

  const publicUrl = data.publicUrl || supabaseClient.storage.from(LOCAL_BUCKET).getPublicUrl(data.path).data.publicUrl;
  return { url: publicUrl, path: data.path, error: null };
}

export async function deleteCakeImage(storagePath) {
  return supabaseClient.storage.from(LOCAL_BUCKET).remove([storagePath]);
}

export function getPublicImageUrl(storagePath) {
  if (!storagePath || storagePath === 'placeholder') return null;
  const { data } = supabaseClient.storage.from(LOCAL_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
