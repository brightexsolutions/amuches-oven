// ============================================================
// scripts/inject-env.js
// Runs at Netlify build time — replaces placeholders in _env.js
// with real environment variable values.
// ============================================================

const fs   = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '../_env.js');
let content   = fs.readFileSync(envFile, 'utf8');

const vars = {
  SUPABASE_URL:      process.env.SUPABASE_URL      || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
};

// Replace placeholder strings with actual values
content = content
  .replaceAll('NETLIFY_ENV_SUPABASE_URL',      vars.SUPABASE_URL)
  .replaceAll('NETLIFY_ENV_SUPABASE_ANON_KEY', vars.SUPABASE_ANON_KEY);

fs.writeFileSync(envFile, content);
console.log('[inject-env] Environment variables injected into _env.js ✓');
