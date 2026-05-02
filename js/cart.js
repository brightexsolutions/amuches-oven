// ============================================================
// Amuche's Oven — Cart State Management
// ============================================================

import { storage, formatCurrency } from './utils.js';

const CART_KEY     = 'amuches-oven-cart';
const DELIVERY_FEE = 300;

function getCart()      { return storage.get(CART_KEY) || { items: [] }; }
function saveCart(cart) { storage.set(CART_KEY, cart); dispatchCartEvent(cart); updateCartUI(); }
function dispatchCartEvent(cart) { window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart })); }

export function addToCart(item) {
  const cart = getCart();
  const idx  = cart.items.findIndex(i => i.cake_id === item.cake_id && i.variant_id === item.variant_id);
  if (idx >= 0) {
    cart.items[idx].quantity += (item.quantity || 1);
  } else {
    cart.items.push({
      id:                 (crypto.randomUUID?.() || String(Date.now())),
      cake_id:            item.cake_id,
      variant_id:         item.variant_id         || null,
      cake_name:          item.cake_name,
      flavor:             item.flavor              || null,
      size:               item.size                || null,
      unit_price:         Number(item.unit_price),
      image_url:          item.image_url           || null,
      quantity:           item.quantity            || 1,
      custom_description: item.custom_description  || null,
      custom_price:       item.custom_price        || null,
      is_custom:          !!item.custom_description,
    });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(itemId) {
  const cart = getCart();
  cart.items = cart.items.filter(i => i.id !== itemId);
  saveCart(cart);
}

export function updateCartQuantity(itemId, quantity) {
  const cart = getCart();
  if (quantity < 1) { cart.items = cart.items.filter(i => i.id !== itemId); }
  else { const item = cart.items.find(i => i.id === itemId); if (item) item.quantity = quantity; }
  saveCart(cart);
}

export function clearCart()     { saveCart({ items: [] }); }
export function getCartItems()  { return getCart().items; }
export function getCartCount()  { return getCart().items.reduce((s, i) => s + i.quantity, 0); }
export function isCartEmpty()   { return getCart().items.length === 0; }

export function getCartTotals(includeDelivery = true) {
  const items    = getCart().items;
  const subtotal = items.reduce((s, i) => s + (i.unit_price * i.quantity), 0);
  const delivery = includeDelivery ? DELIVERY_FEE : 0;
  return { subtotal, delivery, total: subtotal + delivery, itemCount: items.reduce((s,i) => s + i.quantity, 0) };
}

export function updateCartUI() {
  const count = getCartCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count > 99 ? '99+' : String(count);
    el.classList.toggle('hidden', count === 0);
    el.classList.toggle('show',   count > 0);
  });
}

export function renderCartDrawer(drawerId = 'cart-drawer-content') {
  const container = document.getElementById(drawerId);
  if (!container) return;
  const items  = getCartItems();
  const totals = getCartTotals();

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-cake-candles"></i>
        <p>Your cart is empty</p>
        <a href="./menu.html" class="btn btn--primary btn--sm">Browse Our Cakes</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="cart-items">
      ${items.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-img">
            ${item.image_url
              ? `<img src="${item.image_url}" alt="${item.cake_name}" loading="lazy">`
              : `<div class="cart-item-img-placeholder"><i class="fas fa-cake-candles"></i></div>`}
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.cake_name}</div>
            ${item.flavor ? `<div class="cart-item-meta">${item.flavor}${item.size ? ' · '+item.size : ''}</div>` : ''}
            ${item.custom_description ? `<div class="cart-item-custom">${item.custom_description}</div>` : ''}
            <div class="cart-item-price">${formatCurrency(item.unit_price)}</div>
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
    <div class="cart-summary">
      <div class="cart-summary-row"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div>
      <div class="cart-summary-row"><span>Delivery fee</span><span>${formatCurrency(totals.delivery)}</span></div>
      <div class="cart-summary-row cart-summary-total"><span>Total</span><span>${formatCurrency(totals.total)}</span></div>
      <a href="./order.html" class="btn btn--primary btn--lg" style="width:100%;justify-content:center;margin-top:var(--sp-4);">
        <i class="fas fa-lock"></i> Proceed to Order
      </a>
      <p class="cart-disclaimer">
        <i class="fas fa-info-circle"></i>
        Final price may vary for custom orders. We confirm before baking.
      </p>
    </div>`;

  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getCartItems().find(i => i.id === btn.dataset.id);
      if (!item) return;
      updateCartQuantity(btn.dataset.id, item.quantity + (btn.dataset.action === 'inc' ? 1 : -1));
      renderCartDrawer(drawerId);
    });
  });

  container.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => { removeFromCart(btn.dataset.id); renderCartDrawer(drawerId); });
  });
}

window.addEventListener('storage', e => { if (e.key === CART_KEY) updateCartUI(); });
document.addEventListener('DOMContentLoaded', updateCartUI);
