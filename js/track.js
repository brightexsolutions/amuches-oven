// ============================================================
// Amuche's Oven — Track Order Page (track.js)
// ============================================================

import { fetchOrderByNumber, fetchSettingsMap } from './data-access.js';
import { formatCurrency, formatDate, whatsappLink, toast, setButtonLoading, hidePageLoader } from './utils.js';
import { updateCartUI } from './cart.js';

const STATUS_FLOW = [
  { key:'pending',    icon:'fa-clock',        label:'Order Received',    desc:'We have your order and will confirm it shortly via WhatsApp.' },
  { key:'confirmed',  icon:'fa-circle-check', label:'Order Confirmed',   desc:'Your order is confirmed and payment has been received. Baking scheduled!' },
  { key:'baking',     icon:'fa-fire',         label:'Baking in Progress',desc:'Amuche is baking your cake fresh right now with love and quality ingredients.' },
  { key:'decorating', icon:'fa-palette',      label:'Being Decorated',   desc:'Your cake is being beautifully decorated and personalised just for you.' },
  { key:'ready',      icon:'fa-box-open',     label:'Ready',             desc:'Your cake is ready and packaged carefully for delivery or pickup.' },
  { key:'delivered',  icon:'fa-truck',        label:'Delivered',         desc:'Your cake has been delivered. We hope you love it — enjoy!' },
];

let businessPhone = '+254700000000';

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  updateCartUI();
  document.body.classList.add('loaded');
  await loadSettings();

  // Check URL param
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) {
    const input = document.getElementById('track-input');
    if (input) { input.value = ref.toUpperCase(); }
    trackOrder(ref.toUpperCase());
  }

  document.getElementById('track-btn')?.addEventListener('click', () => {
    const val = document.getElementById('track-input')?.value.trim().toUpperCase();
    if (!val) { toast.warning('Please enter your order reference number.'); return; }
    trackOrder(val);
  });

  document.getElementById('track-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('track-btn')?.click();
  });

  // Auto-uppercase input
  document.getElementById('track-input')?.addEventListener('input', e => {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(pos, pos);
  });
});

async function trackOrder(orderNum) {
  const btn    = document.getElementById('track-btn');
  const result = document.getElementById('track-result');
  setButtonLoading(btn, true, 'Searching…');
  result.classList.add('hidden');
  result.innerHTML = '';

  try {
    const order = await fetchOrderByNumber(orderNum).catch(() => null);

    if (!order) {
      result.innerHTML = renderNotFound(orderNum);
      result.classList.remove('hidden');
      return;
    }
    result.innerHTML = renderOrderResult(order);
    result.classList.remove('hidden');
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    bindWhatsAppBtn(order);

  } catch(e) {
    toast.error('Something went wrong. Please try again.');
  } finally {
    setButtonLoading(btn, false);
  }
}

function renderOrderResult(order) {
  const currentIdx = STATUS_FLOW.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  const timelineHTML = isCancelled
    ? `<div style="text-align:center;padding:var(--sp-8);color:var(--clr-error)"><i class="fas fa-ban" style="font-size:2rem;margin-bottom:var(--sp-3);display:block"></i><strong>This order has been cancelled.</strong><p style="font-size:var(--fz-sm);color:var(--clr-stone-400);margin-top:var(--sp-2)">Please contact us if you have questions.</p></div>`
    : `<div class="status-timeline">
        ${STATUS_FLOW.map((s, i) => {
          const isDone    = i < currentIdx;
          const isCurrent = i === currentIdx;
          return `
            <div class="timeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
              <div class="timeline-dot"><i class="fas ${s.icon}"></i></div>
              <div class="timeline-content">
                <div class="timeline-content-title">${s.label}</div>
                <div class="timeline-content-desc">${isCurrent ? s.desc : (isDone ? 'Completed' : 'Upcoming')}</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;

  const itemsHTML = (order.order_items || []).map(i =>
    `<div style="display:flex;justify-content:space-between;padding:var(--sp-2) 0;border-bottom:1px solid var(--clr-stone-100);font-size:var(--fz-sm)">
      <span>${i.cake_name}${i.flavor ? ' · '+i.flavor : ''}${i.size ? ', '+i.size : ''} × ${i.quantity}${i.custom_description ? '<br><small style="color:var(--clr-terracotta)">' + i.custom_description + '</small>' : ''}</span>
      <span style="font-weight:var(--fw-semibold);white-space:nowrap">${formatCurrency(i.subtotal)}</span>
    </div>`
  ).join('');

  return `
    <div class="order-result-card">
      <div class="order-result-header">
        <div>
          <div class="order-result-num">${order.order_number}</div>
          <div class="order-result-date">Placed ${formatDate(order.created_at, { short: true })}</div>
        </div>
        <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
          <span class="badge badge--${order.status}">${order.status.charAt(0).toUpperCase()+order.status.slice(1)}</span>
          <span class="badge badge--${order.payment_status}">${order.payment_status.charAt(0).toUpperCase()+order.payment_status.slice(1)}</span>
        </div>
      </div>

      <div class="order-result-body">
        <h3 style="font-family:var(--font-display);font-size:var(--fz-lg);margin-bottom:var(--sp-6)">Order Progress</h3>
        ${timelineHTML}

        <div class="order-detail-grid" style="margin-top:var(--sp-6)">
          <div class="order-detail-item"><strong>Customer</strong><span>${order.customer_name}</span></div>
          <div class="order-detail-item"><strong>Delivery Date</strong><span>${formatDate(order.delivery_date, { short: true })}</span></div>
          <div class="order-detail-item"><strong>Delivery Type</strong><span>${order.is_delivery ? 'Delivery' : 'Pickup'}</span></div>
          <div class="order-detail-item"><strong>Payment</strong><span>${order.payment_method?.replace('_',' ')}</span></div>
        </div>

        <div style="margin-top:var(--sp-5)">
          <h4 style="font-size:var(--fz-sm);font-weight:var(--fw-semibold);margin-bottom:var(--sp-3);letter-spacing:var(--ls-wide);text-transform:uppercase;color:var(--clr-stone-400)">Items</h4>
          ${itemsHTML}
          <div style="display:flex;justify-content:space-between;padding:var(--sp-3) 0;font-weight:var(--fw-semibold)">
            <span>Total</span>
            <span style="font-family:var(--font-display);color:var(--clr-terracotta)">${formatCurrency(order.total)}</span>
          </div>
        </div>

        <div style="margin-top:var(--sp-6);display:flex;gap:var(--sp-3);flex-wrap:wrap">
          <a id="track-wa-btn" href="#" class="btn btn--whatsapp" target="_blank" rel="noopener">
            <i class="fab fa-whatsapp"></i> Message Us
          </a>
          <a href="./order.html" class="btn btn--outline">
            <i class="fas fa-cake-candles"></i> Place New Order
          </a>
        </div>
      </div>
    </div>`;
}

function renderNotFound(ref) {
  return `
    <div class="track-not-found">
      <i class="fas fa-circle-question"></i>
      <h3>Order Not Found</h3>
      <p>We couldn't find an order with reference <strong>${ref}</strong>.</p>
      <p style="margin-top:var(--sp-2)">Double-check the reference from your WhatsApp confirmation, or contact us for help.</p>
      <a id="track-wa-not-found" href="${whatsappLink(businessPhone, `Hello! I'm looking for my order but can't find it. My reference was: ${ref}`)}" class="btn btn--whatsapp" style="margin-top:var(--sp-5)" target="_blank" rel="noopener">
        <i class="fab fa-whatsapp"></i> Contact Us on WhatsApp
      </a>
    </div>`;
}

function bindWhatsAppBtn(order) {
  const btn = document.getElementById('track-wa-btn');
  if (!btn) return;
  const msg = `Hello Amuche's Oven! 👋 I'm following up on my order *${order.order_number}*. Could you give me an update? Thank you!`;
  btn.href = whatsappLink(businessPhone, msg);
}

async function loadSettings() {
  const settings = await fetchSettingsMap();
  applyTrackSettings(settings);
}

function applyTrackSettings(s) {
  businessPhone = s.business_phone || businessPhone;

  const fPhone = document.getElementById('footer-phone');
  const fEmail = document.getElementById('footer-email');
  const fHours = document.getElementById('footer-hours');
  const fYear  = document.getElementById('footer-year');
  if (fPhone) { fPhone.textContent = s.business_phone; fPhone.href = `tel:${s.business_phone}`; }
  if (fEmail) { fEmail.textContent = s.business_email; fEmail.href = `mailto:${s.business_email}`; }
  if (fHours) fHours.textContent = s.business_hours;
  if (fYear)  fYear.textContent  = new Date().getFullYear();

  const waLink = whatsappLink(businessPhone, `Hello Amuche's Oven! 👋 I need help with my order.`);
  document.getElementById('footer-whatsapp-social')?.setAttribute('href', waLink);
  document.getElementById('footer-wa-cta')?.setAttribute('href', waLink);
}
