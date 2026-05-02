// ============================================================
// Amuche's Oven — Shared Utilities
// ============================================================

const CURRENCY_SYMBOL = 'KSh';

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${Number(amount).toLocaleString('en-KE')}`;
}

export function parseCurrency(str) {
  return parseFloat(String(str).replace(/[^\d.]/g, '')) || 0;
}

export function formatDate(date, { short = false } = {}) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  if (short) return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(datetime) {
  if (!datetime) return '—';
  const d = new Date(datetime);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export function getMinDeliveryDate(minDays = 3) {
  const d = new Date();
  d.setDate(d.getDate() + minDays);
  return d.toISOString().split('T')[0];
}

export function timeAgo(date) {
  const d = new Date(date);
  const diffMs    = Date.now() - d.getTime();
  const diffSecs  = Math.floor(diffMs / 1000);
  const diffMins  = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);
  if (diffSecs  < 60)  return 'just now';
  if (diffMins  < 60)  return `${diffMins}m ago`;
  if (diffHours < 24)  return `${diffHours}h ago`;
  if (diffDays === 1)  return 'yesterday';
  if (diffDays  < 7)   return `${diffDays}d ago`;
  return formatDate(date, { short: true });
}

export function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function truncate(text, max = 120) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trim() + '…' : text;
}

export function titleCase(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function generateRef(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Toast ─────────────────────────────────────────────────────

let _toastContainer = null;
function getToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.getElementById('toast-container');
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.id = 'toast-container';
      document.body.appendChild(_toastContainer);
    }
  }
  return _toastContainer;
}

export function showToast(message, { type = 'info', duration = 4000 } = {}) {
  const container = getToastContainer();
  const iconMap = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<i class="fas ${iconMap[type] || iconMap.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  const removeToast = () => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400);
  };
  const timer = setTimeout(removeToast, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); removeToast(); });
}

export const toast = {
  success: (msg, opts) => showToast(msg, { type: 'success', ...opts }),
  error:   (msg, opts) => showToast(msg, { type: 'error',   ...opts }),
  warning: (msg, opts) => showToast(msg, { type: 'warning', ...opts }),
  info:    (msg, opts) => showToast(msg, { type: 'info',    ...opts }),
};

// ── DOM ───────────────────────────────────────────────────────

export const $  = (sel, p = document) => p.querySelector(sel);
export const $$ = (sel, p = document) => Array.from(p.querySelectorAll(sel));

export function setVisible(el, visible) {
  if (!el) return;
  el.classList.toggle('hidden', !visible);
}

export function setButtonLoading(btn, loading, loadingText = 'Loading…') {
  if (!btn) return;
  if (loading) {
    btn._originalHTML = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${loadingText}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._originalHTML || btn.innerHTML;
    btn.disabled  = false;
  }
}

export function formToObject(form) {
  const data = {};
  new FormData(form).forEach((val, key) => { data[key] = val; });
  return data;
}

export function validateRequired(data, required) {
  const errors = required.filter(k => !data[k] || String(data[k]).trim() === '').map(k => `${titleCase(k.replace(/_/g, ' '))} is required`);
  return { valid: errors.length === 0, errors };
}

// ── Status Helpers ────────────────────────────────────────────

export const ORDER_STATUSES = [
  { value: 'pending',    label: 'Pending',    icon: 'fa-clock'        },
  { value: 'confirmed',  label: 'Confirmed',  icon: 'fa-circle-check' },
  { value: 'baking',     label: 'Baking',     icon: 'fa-fire'         },
  { value: 'decorating', label: 'Decorating', icon: 'fa-palette'      },
  { value: 'ready',      label: 'Ready',      icon: 'fa-box-open'     },
  { value: 'delivered',  label: 'Delivered',  icon: 'fa-truck'        },
  { value: 'cancelled',  label: 'Cancelled',  icon: 'fa-ban'          },
];

export const CATEGORIES = [
  { value: 'birthday',    label: 'Birthday'    },
  { value: 'wedding',     label: 'Wedding'     },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'corporate',   label: 'Corporate'   },
  { value: 'everyday',    label: 'Everyday'    },
  { value: 'custom',      label: 'Custom'      },
];

export function statusBadge(status) {
  const map = {
    pending:    'pending',    confirmed: 'confirmed', baking:    'baking',
    decorating: 'decorating', ready:    'ready',      delivered: 'delivered',
    cancelled:  'cancelled',  unpaid:   'unpaid',     partial:   'partial',
    paid:       'paid',
  };
  const label = titleCase(status);
  const cls   = map[status] || 'pending';
  return `<span class="badge badge--${cls}">${label}</span>`;
}

// ── WhatsApp ──────────────────────────────────────────────────

export function whatsappLink(phone, message) {
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppOrderMessage(cake, variant, ref) {
  const price  = variant ? formatCurrency(variant.price)  : 'TBD';
  const size   = variant?.size   || 'to discuss';
  const flavor = variant?.flavor || 'to discuss';
  return (
    `Hello Amuche's Oven! 🎂\n\n` +
    `I'd like to order:\n*${cake.name}*\n` +
    `Flavor: ${flavor}\nSize: ${size}\nPrice: ${price}\n\n` +
    `Order Ref: WA-${ref}\n\nPlease let me know availability. Thank you!`
  );
}

// ── Page Loader ───────────────────────────────────────────────

export function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 500);
  }
}

function installLoaderFailsafe() {
  const safeHide = () => {
    document.body?.classList.add('loaded');
    hidePageLoader();
  };

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setTimeout(safeHide, 0);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(safeHide, 0), { once: true });
  }

  window.addEventListener('load', safeHide, { once: true });
  window.addEventListener('error', () => setTimeout(safeHide, 0));
  window.addEventListener('unhandledrejection', () => setTimeout(safeHide, 0));
  setTimeout(safeHide, 3500);
}

installLoaderFailsafe();

// ── Local Storage ─────────────────────────────────────────────

export const storage = {
  get(key)        { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  remove(key)     { try { localStorage.removeItem(key); } catch {} },
};
