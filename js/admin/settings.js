// ============================================================
// Amuche's Oven — Admin Settings (settings.js)
// ============================================================

import { supabaseClient } from '../config.js';
import { fetchSettingsMap } from '../data-access.js';
import { initAdminLayout } from './layout.js';
import { toast, setButtonLoading, hidePageLoader } from '../utils.js';

const FIELDS = [
  { key:'business_phone',   id:'s-phone'        },
  { key:'business_email',   id:'s-email'        },
  { key:'business_address', id:'s-address'      },
  { key:'business_hours',   id:'s-hours'        },
  { key:'delivery_fee',     id:'s-delivery-fee' },
  { key:'min_order_days',   id:'s-min-days'     },
  { key:'currency_symbol',  id:'s-currency'     },
  { key:'instagram_url',    id:'s-instagram'    },
  { key:'facebook_url',     id:'s-facebook'     },
  { key:'tiktok_url',       id:'s-tiktok'       },
  { key:'announcement_enabled', id:'s-announcement-enabled', type:'checkbox' },
  { key:'announcement_text', id:'s-announcement-text' },
  { key:'announcement_link_label', id:'s-announcement-link-label' },
  { key:'announcement_link_url', id:'s-announcement-link-url' },
];

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  const session = await initAdminLayout('./settings.html');
  if (!session) return;

  // Show current email
  const emailEl = document.getElementById('current-admin-email');
  if (emailEl) emailEl.textContent = `Logged in as: ${session.user.email}`;

  await loadSettings();

  document.getElementById('save-settings-btn')?.addEventListener('click', saveSettings);
  document.getElementById('update-pw-btn')?.addEventListener('click', updatePassword);
  document.getElementById('clear-cancelled-btn')?.addEventListener('click', clearCancelled);
});

async function loadSettings() {
  const map = await fetchSettingsMap();
  FIELDS.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    if (f.type === 'checkbox') {
      el.checked = String(map[f.key] || 'false') === 'true';
      return;
    }
    el.value = map[f.key] || '';
  });
}

async function saveSettings() {
  const btn = document.getElementById('save-settings-btn');
  setButtonLoading(btn, true, 'Saving…');

  try {
    for (const f of FIELDS) {
      const el  = document.getElementById(f.id);
      const val = f.type === 'checkbox'
        ? String(Boolean(el?.checked))
        : (el?.value.trim() || '');
      const { error } = await supabaseClient
        .from('settings')
        .upsert({ key: f.key, value: val, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    }
    toast.success('Settings saved successfully!');
  } catch(e) {
    toast.error('Failed to save settings: ' + (e.message||''));
  } finally {
    setButtonLoading(btn, false);
  }
}

async function updatePassword() {
  const btn     = document.getElementById('update-pw-btn');
  const newPw   = document.getElementById('s-new-pw')?.value;
  const confirm = document.getElementById('s-confirm-pw')?.value;

  if (!newPw)            { toast.warning('Please enter a new password.'); return; }
  if (newPw.length < 8)  { toast.warning('Password must be at least 8 characters.'); return; }
  if (newPw !== confirm) { toast.error('Passwords do not match.'); return; }

  setButtonLoading(btn, true, 'Updating…');
  const { error } = await supabaseClient.auth.updateUser({ password: newPw });
  setButtonLoading(btn, false);

  if (error) { toast.error('Failed: ' + error.message); return; }
  toast.success('Password updated successfully!');
  document.getElementById('s-new-pw').value     = '';
  document.getElementById('s-confirm-pw').value = '';
}

async function clearCancelled() {
  if (!confirm('Permanently delete all cancelled orders? This cannot be undone.')) return;

  const { error, count } = await supabaseClient
    .from('orders')
    .delete({ count: 'exact' })
    .eq('status', 'cancelled');

  if (error) { toast.error('Delete failed: ' + error.message); return; }
  toast.success(`Removed ${count || 0} cancelled order(s).`);
}
