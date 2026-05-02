// ============================================================
// _env.js — Environment Variable Injection
// ============================================================
// For PRODUCTION (Netlify): Values replaced at build time
// For LOCAL DEV: Set values manually below or use Netlify CLI
// ============================================================

window.__ENV__ = {
  SUPABASE_URL:      'NETLIFY_ENV_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NETLIFY_ENV_SUPABASE_ANON_KEY',
};
