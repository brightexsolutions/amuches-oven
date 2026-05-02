import { supabaseClient } from '../config.js';
import {
  fetchBusinessPhone,
  fetchOrderById,
  fetchOrderByNumber,
  searchOrders,
} from '../data-access.js';
import { initAdminLayout } from './layout.js';
import {
  formatCurrency,
  formatDate,
  statusBadge,
  whatsappLink,
  setButtonLoading,
  hidePageLoader,
  ORDER_STATUSES,
  toast,
} from '../utils.js';
import { generateReceipt } from '../receipt.js';

const PAGE_SIZE = 15;

let currentPage = 0;
let totalCount = 0;
let currentOrder = null;
let businessPhone = '+254700000000';

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  const session = await initAdminLayout('./orders.html');
  if (!session) return;

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar-mobile-toggle').style.display = '';
  }

  document.getElementById('sidebar-mobile-toggle-fab')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('open');
  });

  await loadBusinessPhone();
  await loadOrders();
  bindEvents();

  const ref = new URLSearchParams(window.location.search).get('order');
  if (ref) await openOrderByNumber(ref);
});

function bindEvents() {
  let debounce;
  document.getElementById('order-search')?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      currentPage = 0;
      loadOrders();
    }, 300);
  });

  ['filter-status', 'filter-payment', 'filter-source'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      currentPage = 0;
      loadOrders();
    });
  });

  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage -= 1;
      loadOrders();
    }
  });

  document.getElementById('next-page')?.addEventListener('click', () => {
    if ((currentPage + 1) * PAGE_SIZE < totalCount) {
      currentPage += 1;
      loadOrders();
    }
  });

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('order-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'order-modal') closeModal();
  });
}

async function loadBusinessPhone() {
  businessPhone = await fetchBusinessPhone();
}

async function loadOrders() {
  const search = document.getElementById('order-search')?.value.trim();
  const status = document.getElementById('filter-status')?.value;
  const payment = document.getElementById('filter-payment')?.value;
  const source = document.getElementById('filter-source')?.value;
  const tbody = document.getElementById('orders-body');

  tbody.innerHTML = '<tr><td colspan="9" class="table-empty"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>';

  const { data, count } = await searchOrders({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search,
    status,
    payment,
    source,
  });
  totalCount = count;

  document.getElementById('order-count-label').textContent = `${totalCount} order${totalCount !== 1 ? 's' : ''}`;
  document.getElementById('page-info').textContent = totalCount
    ? `Showing ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} of ${totalCount}`
    : '';
  document.getElementById('prev-page').disabled = currentPage === 0;
  document.getElementById('next-page').disabled = (currentPage + 1) * PAGE_SIZE >= totalCount;

  if (!data?.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="table-empty"><i class="fas fa-inbox"></i><br/>No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((order) => `
    <tr style="cursor:pointer" data-order-id="${order.id}">
      <td><strong style="color:var(--clr-terracotta)">${order.order_number}</strong></td>
      <td>
        <div style="font-weight:var(--fw-medium)">${order.customer_name}</div>
        <div style="font-size:var(--fz-xs);color:var(--clr-stone-400)">${order.customer_phone}</div>
      </td>
      <td style="font-size:var(--fz-xs);color:var(--clr-stone-400)">${order.is_custom ? '<span class="badge badge--baking">Custom</span>' : ''}</td>
      <td><strong>${formatCurrency(order.total)}</strong></td>
      <td>
        <div style="font-weight:var(--fw-medium)">${formatDate(order.delivery_date, { short: true })}</div>
        <div style="font-size:var(--fz-xs);color:var(--clr-stone-400)">${order.delivery_time || ''}</div>
      </td>
      <td>${statusBadge(order.status)}</td>
      <td>${statusBadge(order.payment_status)}</td>
      <td><span style="font-size:var(--fz-xs);text-transform:capitalize">${order.order_source}</span></td>
      <td>
        <div class="table-actions">
          <button class="action-btn action-btn--view" data-view-order="${order.id}" title="View"><i class="fas fa-eye"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr[data-order-id]').forEach((row) => {
    row.addEventListener('click', () => openOrder(row.dataset.orderId));
  });

  tbody.querySelectorAll('[data-view-order]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openOrder(button.dataset.viewOrder);
    });
  });
}

async function openOrder(id) {
  const order = await fetchOrderById(id).catch(() => null);
  if (!order) return;

  currentOrder = order;
  renderModal(order);
  document.getElementById('order-modal').classList.add('active');
}

async function openOrderByNumber(orderNumber) {
  const data = await fetchOrderByNumber(orderNumber).catch(() => null);
  if (!data) return;

  currentOrder = data;
  renderModal(data);
  document.getElementById('order-modal').classList.add('active');
}

function renderModal(order) {
  document.getElementById('modal-order-num').textContent = order.order_number;
  document.getElementById('modal-order-badges').innerHTML = `${statusBadge(order.status)} ${statusBadge(order.payment_status)}`;

  const itemsHtml = (order.order_items || []).map((item) => `
    <div style="display:flex;justify-content:space-between;padding:var(--sp-2) 0;border-bottom:1px solid var(--clr-stone-100);font-size:var(--fz-sm)">
      <div><strong>${item.cake_name}</strong>${item.flavor ? ` · ${item.flavor}` : ''}${item.size ? `, ${item.size}` : ''} × ${item.quantity}${item.custom_description ? `<br><small style="color:var(--clr-terracotta)">${item.custom_description}</small>` : ''}</div>
      <div style="font-weight:var(--fw-semibold)">${formatCurrency(item.subtotal)}</div>
    </div>
  `).join('');

  document.getElementById('modal-body').innerHTML = `
    <div class="order-modal-grid">
      <div class="order-modal-field"><strong>Customer</strong><span>${order.customer_name}</span></div>
      <div class="order-modal-field"><strong>Phone</strong><span><a href="tel:${order.customer_phone}">${order.customer_phone}</a></span></div>
      ${order.customer_email ? `<div class="order-modal-field"><strong>Email</strong><span>${order.customer_email}</span></div>` : ''}
      <div class="order-modal-field"><strong>Delivery Date</strong><span>${formatDate(order.delivery_date, { short: true })}${order.delivery_time ? ` · ${order.delivery_time}` : ''}</span></div>
      <div class="order-modal-field"><strong>Delivery Type</strong><span>${order.is_delivery ? 'Delivery' : 'Pickup'}</span></div>
      ${order.delivery_address ? `<div class="order-modal-field" style="grid-column:1/-1"><strong>Address</strong><span>${order.delivery_address}</span></div>` : ''}
      <div class="order-modal-field"><strong>Payment Method</strong><span style="text-transform:capitalize">${(order.payment_method || '').replace('_', ' ')}</span></div>
      <div class="order-modal-field"><strong>Placed</strong><span>${formatDate(order.created_at)}</span></div>
    </div>
    <div style="margin-bottom:var(--sp-4)">
      ${itemsHtml}
      <div style="display:flex;justify-content:space-between;padding:var(--sp-3) 0;font-size:var(--fz-sm);color:var(--clr-stone-500)"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:var(--sp-2) 0;font-size:var(--fz-sm);color:var(--clr-stone-500)"><span>Delivery</span><span>${formatCurrency(order.delivery_fee)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:var(--sp-3) 0;font-weight:var(--fw-bold)"><span>Total</span><span style="font-family:var(--font-display);font-size:var(--fz-xl);color:var(--clr-terracotta)">${formatCurrency(order.total)}</span></div>
    </div>
    ${order.special_notes ? `<div style="background:var(--clr-stone-100);border-radius:var(--radius-md);padding:var(--sp-4);font-size:var(--fz-sm);margin-bottom:var(--sp-3)"><strong>Notes:</strong> ${order.special_notes}</div>` : ''}
  `;

  const statusSelect = document.getElementById('modal-status-select');
  statusSelect.innerHTML = ORDER_STATUSES.map((status) => `
    <option value="${status.value}" ${status.value === order.status ? 'selected' : ''}>${status.label}</option>
  `).join('');

  document.getElementById('modal-payment-select').value = order.payment_status || 'unpaid';
  document.getElementById('modal-admin-notes').value = order.admin_notes || '';

  const waMessage = `Hello ${order.customer_name}! 👋 This is Amuche's Oven. Just a quick update on your order *${order.order_number}*:\n\nYour order is currently *${order.status}*.\n\nPlease let us know if you have any questions. Thank you!`;
  document.getElementById('modal-wa-btn').onclick = () => window.open(whatsappLink(order.customer_phone || businessPhone, waMessage), '_blank');

  document.getElementById('modal-save-status').onclick = () => saveStatus(order.id, statusSelect.value);
  document.getElementById('modal-download-receipt').onclick = () => generateReceipt(order);
  document.getElementById('modal-track-link').onclick = () => window.open(`../track.html?ref=${order.order_number}`, '_blank');
}

async function saveStatus(orderId, status) {
  const button = document.getElementById('modal-save-status');
  const paymentStatus = document.getElementById('modal-payment-select').value;
  const adminNotes = document.getElementById('modal-admin-notes').value.trim();

  setButtonLoading(button, true, 'Saving…');
  const { error } = await supabaseClient
    .from('orders')
    .update({ status, payment_status: paymentStatus, admin_notes: adminNotes || null })
    .eq('id', orderId);
  setButtonLoading(button, false);

  if (error) {
    toast.error('Update failed.');
    return;
  }

  toast.success('Order updated!');
  if (currentOrder) {
    currentOrder.status = status;
    currentOrder.payment_status = paymentStatus;
  }
  document.getElementById('modal-order-badges').innerHTML = `${statusBadge(status)} ${statusBadge(paymentStatus)}`;
  await loadOrders();
}

function closeModal() {
  document.getElementById('order-modal').classList.remove('active');
}
