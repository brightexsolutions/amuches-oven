// ============================================================
// _env.js — Environment Variable Injection
// ============================================================
// For PRODUCTION (Netlify): Values replaced at build time
// For LOCAL DEV: Set values manually below or use Netlify CLI
// ============================================================

// 👇 SET THESE FOR LOCAL DEVELOPMENT 👇
// Get from: Supabase Dashboard → Settings → API
const LOCAL_SUPABASE_URL = '';       // e.g. 'https://xxxx.supabase.co'
const LOCAL_SUPABASE_KEY = '';       // e.g. 'eyJhbGciOiJIUzI1Ni...'

// Check if running on Netlify (build-time injection worked)
const isNetlifyBuild = "NETLIFY_ENV_SUPABASE_URL" !== 'NETLIFY_ENV_SUPABASE_URL';

window.__ENV__ = {
  SUPABASE_URL:      isNetlifyBuild ? "NETLIFY_ENV_SUPABASE_URL"      : (LOCAL_SUPABASE_URL || ''),
  SUPABASE_ANON_KEY: isNetlifyBuild ? "NETLIFY_ENV_SUPABASE_ANON_KEY" : (LOCAL_SUPABASE_KEY || ''),
};
