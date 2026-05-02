// ============================================================
// Amuche's Oven — Order Page (order.js)
// Multi-step form: cart review → details → delivery → confirm
// Submits to Supabase, sends WhatsApp confirmation
// ============================================================

import { supabaseClient } from './config.js';
import { fetchSettingsMap, generateOrderNumber } from './data-access.js';
import {
  formatCurrency, formatDate, whatsappLink, generateRef,
  toast, setButtonLoading, getMinDeliveryDate,
  hidePageLoader, $, $$
} from './utils.js';
import {
  getCartItems, getCartTotals, clearCart,
  updateCartUI, addToCart, removeFromCart, updateCartQuantity
} from './cart.js';

// ── State ─────────────────────────────────────────────────────
let currentStep  = 1;
let businessPhone= '+254700000000';
let orderData    = {};   // collected across steps

const STEPS = 5;

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  updateCartUI();
  document.body.classList.add('loaded');

  await loadSettings();
  checkCustomParam();
  renderStep1();
  renderSidebar();
  initDeliveryToggle();
  setMinDate();
  bindStepNav();
  initScrollTop();
});

// ── Settings ─────────────────────────────────────────────────

async function loadSettings() {
  const settings = await fetchSettingsMap();
  applyOrderSettings(settings);
}

function applyOrderSettings(s) {
  businessPhone = s.business_phone || '+254700000000';

  const fPhone = document.getElementById('footer-phone');
  const fEmail = document.getElementById('footer-email');
  const fHours = document.getElementById('footer-hours');
  const fYear  = document.getElementById('footer-year');

  if (fPhone) { fPhone.textContent = s.business_phone || businessPhone; fPhone.href = `tel:${businessPhone}`; }
  if (fEmail) { fEmail.textContent = s.business_email || 'hello@amuchesoven.co.ke'; fEmail.href = `mailto:${s.business_email}`; }
  if (fHours) fHours.textContent = s.business_hours || '8AM–8PM (Mon–Sat)';
  if (fYear)  fYear.textContent  = new Date().getFullYear();

  const waLink = whatsappLink(businessPhone, `Hello Amuche's Oven! 👋 I need help with my order.`);
  document.getElementById('footer-whatsapp-social')?.setAttribute('href', waLink);
  document.getElementById('footer-whatsapp-cta')?.setAttribute('href', waLink);
}

// ── Custom Order Param ────────────────────────────────────────

function checkCustomParam() {
  const type = new URLSearchParams(window.location.search).get('type');
  if (type === 'custom') {
    document.getElementById('custom-order-notice')?.classList.remove('hidden');
    document.getElementById('custom-cake-desc')?.focus();
  }
}

// ── Step 1: Cart Review ───────────────────────────────────────

function renderStep1() {
  const items       = getCartItems();
  const container   = document.getElementById('order-cart-items');
  const emptyEl     = document.getElementById('order-empty-cart');
  const nextBtn     = document.getElementById('step1-next');
  const customSection = document.getElementById('custom-add-section');

  if (!items.length) {
    container?.classList.add('hidden');
    emptyEl?.classList.remove('hidden');
    customSection && (customSection.style.display = 'none');
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  emptyEl?.classList.add('hidden');
  if (nextBtn) nextBtn.disabled = false;

  const totals = getCartTotals();

  if (container) {
    container.innerHTML = `
      <div class="cart-items">
        ${items.map(item => `
          <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-img">
              ${item.image_url
                ? `<img src="${item.image_url}" alt="${item.cake_name}" loading="lazy" />`
                : `<div class="cart-item-img-placeholder"><i class="fas fa-cake-candles"></i></div>`}
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.cake_name}</div>
              ${item.flavor ? `<div class="cart-item-meta">${item.flavor}${item.size ? ' · ' + item.size : ''}</div>` : ''}
              ${item.custom_description ? `<div class="cart-item-custom"><i class="fas fa-pen"></i> ${item.custom_description}</div>` : ''}
              <div class="cart-item-price">${formatCurrency(item.unit_price)} × ${item.quantity}</div>
            </div>
            <div class="cart-item-controls">
              <div class="qty-control">
                <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease"><i class="fas fa-minus"></i></button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase"><i class="fas fa-plus"></i></button>
              </div>
              <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove"><i class="fas fa-xmark"></i></button>
            </div>
          </div>`).join('')}
      </div>
      <div class="cart-summary" style="margin-top:var(--sp-5)">
        <div class="cart-summary-row"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div>
        <div class="cart-summary-row"><span>Delivery fee</span><span>${formatCurrency(totals.delivery)}</span></div>
        <div class="cart-summary-row cart-summary-total"><span>Total</span><span>${formatCurrency(totals.total)}</span></div>
      </div>`;

    // Bind qty controls
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = getCartItems().find(i => i.id === btn.dataset.id);
          if (!current) return;
          updateCartQuantity(btn.dataset.id, current.quantity + (btn.dataset.action === 'inc' ? 1 : -1));
          renderStep1();
          renderSidebar();
      });
    });

    container.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(btn.dataset.id);
          renderStep1();
          renderSidebar();
      });
    });
  }

  // Custom cake add button
  document.getElementById('add-custom-btn')?.addEventListener('click', () => {
    const desc = document.getElementById('custom-cake-desc')?.value.trim();
    if (!desc) { toast.warning('Please describe your custom cake first.'); return; }

    addToCart({
      cake_id:            'custom-' + generateRef(4),
      variant_id:         null,
      cake_name:          'Custom Cake',
      unit_price:         0,
      quantity:           1,
      custom_description: desc,
      is_custom:          true,
    });

    document.getElementById('custom-cake-desc').value = '';
    toast.success('Custom cake request added to your order!');
    renderStep1();
    renderSidebar();
  });
}

// ── Sidebar Summary ───────────────────────────────────────────

function renderSidebar() {
  const items       = getCartItems();
  const totals      = getCartTotals();
  const sideItems   = document.getElementById('sidebar-items');
  const sideSubtotal= document.getElementById('sidebar-subtotal');
  const sideDelivery= document.getElementById('sidebar-delivery');
  const sideTotal   = document.getElementById('sidebar-total');

  if (sideItems) {
    sideItems.innerHTML = items.length
      ? items.map(item => `
          <div class="summary-item">
            <div class="summary-item-img">
              ${item.image_url
                ? `<img src="${item.image_url}" alt="${item.cake_name}" loading="lazy" />`
                : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--clr-stone-300);font-size:1.2rem"><i class="fas fa-cake-candles"></i></div>`}
            </div>
            <div>
              <div class="summary-item-name">${item.cake_name}</div>
              <div class="summary-item-meta">
                ${[item.flavor, item.size].filter(Boolean).join(' · ')}
                ${item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </div>
            </div>
            <div class="summary-item-price">${formatCurrency(item.unit_price * item.quantity)}</div>
          </div>`).join('')
      : `<p style="color:var(--clr-stone-400);font-size:var(--fz-sm)">No items yet</p>`;
  }

  if (sideSubtotal) sideSubtotal.textContent = formatCurrency(totals.subtotal);
  if (sideDelivery) sideDelivery.textContent = formatCurrency(totals.delivery);
  if (sideTotal)    sideTotal.textContent    = formatCurrency(totals.total);
}

// ── Step Navigation ───────────────────────────────────────────

function bindStepNav() {
  // Step 1 → 2
  document.getElementById('step1-next')?.addEventListener('click', () => {
    if (getCartItems().length === 0) { toast.warning('Add at least one cake to continue.'); return; }
    goToStep(2);
  });

  // Step 2 → 3
  document.getElementById('step2-next')?.addEventListener('click', () => {
    const name  = document.getElementById('cust-name')?.value.trim();
    const phone = document.getElementById('cust-phone')?.value.trim();
    if (!name)  { toast.warning('Please enter your name.'); document.getElementById('cust-name')?.focus(); return; }
    if (!phone) { toast.warning('Please enter your phone number.'); document.getElementById('cust-phone')?.focus(); return; }

    orderData.customer_name  = name;
    orderData.customer_phone = phone;
    orderData.customer_email = document.getElementById('cust-email')?.value.trim() || null;
    orderData.special_notes  = document.getElementById('cust-notes')?.value.trim() || null;
    goToStep(3);
  });
  document.getElementById('step2-back')?.addEventListener('click', () => goToStep(1));

  // Step 3 → 4
  document.getElementById('step3-next')?.addEventListener('click', () => {
    const isDelivery = document.getElementById('del-delivery')?.checked;
    const address    = document.getElementById('del-address')?.value.trim();
    const date       = document.getElementById('del-date')?.value;
    const time       = document.getElementById('del-time')?.value;
    const payment    = document.querySelector('input[name="payment_method"]:checked')?.value;

    if (isDelivery && !address) {
      toast.warning('Please enter your delivery address.');
      document.getElementById('del-address')?.focus();
      return;
    }
    if (!date) {
      toast.warning('Please select your delivery date.');
      document.getElementById('del-date')?.focus();
      return;
    }

    orderData.is_delivery       = isDelivery;
    orderData.delivery_address  = isDelivery ? address : 'Pickup';
    orderData.delivery_date     = date;
    orderData.delivery_time     = time || null;
    orderData.payment_method    = payment || 'mobile_money';

    renderStep4Review();
    goToStep(4);
  });
  document.getElementById('step3-back')?.addEventListener('click', () => goToStep(2));

  // Step 4 → Submit
  document.getElementById('step4-back')?.addEventListener('click', () => goToStep(3));
  document.getElementById('submit-order-btn')?.addEventListener('click', submitOrder);
}

function goToStep(step) {
  // Hide all steps
  $$('.order-step').forEach(el => el.classList.remove('active'));
  document.getElementById(`step-${step}`)?.classList.add('active');

  // Update progress indicators
  for (let i = 1; i <= 4; i++) {
    const progEl = document.getElementById(`prog-${i}`);
    const connEl = document.getElementById(`conn-${i}`);
    if (!progEl) continue;
    progEl.classList.remove('active', 'done');
    connEl?.classList.remove('done');

    if (i < step)      { progEl.classList.add('done'); connEl?.classList.add('done'); }
    else if (i === step) progEl.classList.add('active');
  }

  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Step 4: Review ────────────────────────────────────────────

function renderStep4Review() {
  const items  = getCartItems();
  const totals = getCartTotals();
  const el     = document.getElementById('review-content');
  if (!el) return;

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--sp-5)">

      <div>
        <div style="font-size:var(--fz-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--clr-stone-400);margin-bottom:var(--sp-3)">Order Items</div>
        ${items.map(i => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-3) 0;border-bottom:1px solid var(--clr-stone-100)">
            <div>
              <div style="font-weight:var(--fw-semibold);font-size:var(--fz-sm)">${i.cake_name} × ${i.quantity}</div>
              ${i.flavor ? `<div style="font-size:var(--fz-xs);color:var(--clr-stone-400)">${i.flavor}${i.size ? ' · '+i.size : ''}</div>` : ''}
              ${i.custom_description ? `<div style="font-size:var(--fz-xs);color:var(--clr-terracotta);font-style:italic">${i.custom_description}</div>` : ''}
            </div>
            <div style="font-weight:var(--fw-semibold)">${formatCurrency(i.unit_price * i.quantity)}</div>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding:var(--sp-3) 0;border-bottom:1px solid var(--clr-stone-100)">
          <span style="color:var(--clr-stone-500);font-size:var(--fz-sm)">Delivery fee</span>
          <span style="font-size:var(--fz-sm)">${formatCurrency(totals.delivery)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:var(--sp-4) 0;font-weight:var(--fw-bold)">
          <span>Total</span>
          <span style="font-family:var(--font-display);font-size:var(--fz-xl);color:var(--clr-terracotta)">${formatCurrency(totals.total)}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);background:var(--clr-stone-100);border-radius:var(--radius-lg);padding:var(--sp-5)">
        <div>
          <div style="font-size:var(--fz-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--clr-stone-400);margin-bottom:var(--sp-1)">Customer</div>
          <div style="font-size:var(--fz-sm);font-weight:var(--fw-medium)">${orderData.customer_name}</div>
          <div style="font-size:var(--fz-sm);color:var(--clr-stone-500)">${orderData.customer_phone}</div>
          ${orderData.customer_email ? `<div style="font-size:var(--fz-sm);color:var(--clr-stone-500)">${orderData.customer_email}</div>` : ''}
        </div>
        <div>
          <div style="font-size:var(--fz-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--clr-stone-400);margin-bottom:var(--sp-1)">Delivery</div>
          <div style="font-size:var(--fz-sm);font-weight:var(--fw-medium)">${orderData.is_delivery ? 'Delivery' : 'Pickup'}</div>
          <div style="font-size:var(--fz-sm);color:var(--clr-stone-500)">${formatDate(orderData.delivery_date, { short: true })}</div>
          ${orderData.delivery_time ? `<div style="font-size:var(--fz-sm);color:var(--clr-stone-500)">${orderData.delivery_time}</div>` : ''}
          ${orderData.delivery_address && orderData.is_delivery ? `<div style="font-size:var(--fz-xs);color:var(--clr-stone-400);margin-top:var(--sp-1)">${orderData.delivery_address}</div>` : ''}
        </div>
        <div>
          <div style="font-size:var(--fz-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--clr-stone-400);margin-bottom:var(--sp-1)">Payment</div>
          <div style="font-size:var(--fz-sm);font-weight:var(--fw-medium)">${paymentLabel(orderData.payment_method)}</div>
        </div>
        ${orderData.special_notes ? `
          <div>
            <div style="font-size:var(--fz-xs);font-weight:var(--fw-semibold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--clr-stone-400);margin-bottom:var(--sp-1)">Notes</div>
            <div style="font-size:var(--fz-sm);color:var(--clr-stone-500)">${orderData.special_notes}</div>
          </div>` : ''}
      </div>

      <div style="background:rgba(196,90,42,0.06);border:1px solid rgba(196,90,42,0.15);border-radius:var(--radius-md);padding:var(--sp-4);display:flex;gap:var(--sp-3);align-items:flex-start">
        <i class="fas fa-info-circle" style="color:var(--clr-terracotta);margin-top:2px;flex-shrink:0"></i>
        <p style="font-size:var(--fz-xs);color:var(--clr-stone-600);margin:0;line-height:var(--lh-relaxed)">
          By confirming this order, you agree that baking will begin after payment confirmation. Custom cake prices will be quoted before payment is requested.
        </p>
      </div>
    </div>`;
}

function paymentLabel(val) {
  return { mobile_money: 'M-Pesa', bank_transfer: 'Bank Transfer', cash: 'Cash on Delivery/Pickup' }[val] || val;
}

// ── Delivery Toggle ───────────────────────────────────────────

function initDeliveryToggle() {
  const radios  = $$('input[name="delivery_type"]');
  const addrSec = document.getElementById('delivery-address-section');

  radios.forEach(r => {
    r.addEventListener('change', () => {
      const isDelivery = document.getElementById('del-delivery')?.checked;
      if (addrSec) addrSec.style.display = isDelivery ? '' : 'none';
    });
  });
}

// ── Min Date ─────────────────────────────────────────────────

function setMinDate() {
  const dateInput = document.getElementById('del-date');
  if (!dateInput) return;
  const min = getMinDeliveryDate(3);
  dateInput.min = min;
  // Show helpful hint
  const hint = document.getElementById('date-hint');
  if (hint) hint.textContent = `Earliest available: ${formatDate(min, { short: true })}`;
}

// ── Submit Order ──────────────────────────────────────────────

async function submitOrder() {
  const btn    = document.getElementById('submit-order-btn');
  const items  = getCartItems();
  const totals = getCartTotals();

  if (!items.length) { toast.error('Your cart is empty.'); return; }

  setButtonLoading(btn, true, 'Placing order…');

  try {
    // Generate order number
    const orderNumber = await generateOrderNumber();

    const isCustom = items.some(i => i.is_custom);

    // Insert order
    const { data: order, error: orderErr } = await supabaseClient
      .from('orders')
      .insert({
        order_number:     orderNumber,
        customer_name:    orderData.customer_name,
        customer_phone:   orderData.customer_phone,
        customer_email:   orderData.customer_email  || null,
        delivery_address: orderData.delivery_address || null,
        delivery_date:    orderData.delivery_date,
        delivery_time:    orderData.delivery_time   || null,
        order_source:     'website',
        status:           'pending',
        payment_status:   'unpaid',
        payment_method:   orderData.payment_method,
        subtotal:         totals.subtotal,
        delivery_fee:     totals.delivery,
        total:            totals.total,
        is_delivery:      orderData.is_delivery,
        is_custom:        isCustom,
        special_notes:    orderData.special_notes || null,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert order items
    const orderItems = items.map(item => ({
      order_id:           order.id,
      cake_id:            item.is_custom ? null : item.cake_id,
      variant_id:         item.variant_id || null,
      cake_name:          item.cake_name,
      flavor:             item.flavor    || null,
      size:               item.size      || null,
      quantity:           item.quantity,
      unit_price:         item.unit_price,
      subtotal:           item.unit_price * item.quantity,
      custom_description: item.custom_description || null,
      custom_price:       item.custom_price       || null,
    }));

    const { error: itemsErr } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsErr) throw itemsErr;

    // Build WhatsApp confirmation message to business
    const waMsg = buildOrderWhatsAppMsg(order, items, totals, orderData);
    const waUrl = whatsappLink(businessPhone, waMsg);

    // Show confirmation
    document.getElementById('confirm-order-num').textContent = orderNumber;
    document.getElementById('confirm-whatsapp-btn').href = waUrl;

    // Mark progress as all done
    for (let i = 1; i <= 4; i++) {
      document.getElementById(`prog-${i}`)?.classList.replace('active','done') || document.getElementById(`prog-${i}`)?.classList.add('done');
      document.getElementById(`conn-${i}`)?.classList.add('done');
    }
    const prog5 = document.getElementById('prog-5');
    if (prog5) prog5.classList.add('done');

    goToStep(5);
    clearCart();

    // Auto-open WhatsApp after 1.5s
    setTimeout(() => window.open(waUrl, '_blank', 'noopener'), 1500);

  } catch(err) {
    console.error('Order submission error:', err);
    toast.error('Failed to place order. Please try again or contact us via WhatsApp.');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ── WhatsApp Message Builder ──────────────────────────────────

function buildOrderWhatsAppMsg(order, items, totals, data) {
  const itemLines = items.map(i =>
    `• ${i.cake_name}${i.flavor ? ' (' + i.flavor : ''}${i.size ? ', ' + i.size : ''}${i.flavor ? ')' : ''} × ${i.quantity} = ${formatCurrency(i.unit_price * i.quantity)}`
      + (i.custom_description ? `\n  ↳ Custom: ${i.custom_description}` : '')
  ).join('\n');

  return (
    `🎂 *New Order — Amuche's Oven*\n\n` +
    `*Order Ref:* ${order.order_number}\n` +
    `*Name:* ${data.customer_name}\n` +
    `*Phone:* ${data.customer_phone}\n` +
    (data.customer_email ? `*Email:* ${data.customer_email}\n` : '') +
    `\n*Items:*\n${itemLines}\n\n` +
    `*Subtotal:* ${formatCurrency(totals.subtotal)}\n` +
    `*Delivery:* ${formatCurrency(totals.delivery)}\n` +
    `*Total:* ${formatCurrency(totals.total)}\n\n` +
    `*Delivery Date:* ${formatDate(data.delivery_date, { short: true })}\n` +
    `*Time Slot:* ${data.delivery_time || 'Not specified'}\n` +
    `*Type:* ${data.is_delivery ? 'Delivery to ' + data.delivery_address : 'Pickup'}\n` +
    `*Payment:* ${paymentLabel(data.payment_method)}\n` +
    (data.special_notes ? `*Notes:* ${data.special_notes}\n` : '') +
    `\nPlease confirm this order at your earliest convenience. Thank you!`
  );
}

// ── Scroll Top ────────────────────────────────────────────────

function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
