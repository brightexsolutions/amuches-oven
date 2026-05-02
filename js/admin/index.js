import {
  fetchDashboardStats,
  fetchPendingWhatsappOrders,
  fetchRecentOrders,
  fetchOrdersForDeliveryRange,
} from '../data-access.js';
import { initAdminLayout } from './layout.js';
import { formatCurrency, formatDate, timeAgo, statusBadge, hidePageLoader } from '../utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  const session = await initAdminLayout('./index.html');
  if (!session) return;

  document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar-mobile-toggle').style.display = '';
  }

  document.getElementById('sidebar-mobile-toggle-fab')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('open');
  });

  await Promise.all([loadStats(), loadRecentOrders(), loadUpcoming(), loadWAOrders()]);
});

async function loadStats() {
  const stats = await fetchDashboardStats();
  document.getElementById('stat-today').textContent = stats.todayCount;
  document.getElementById('stat-pending').textContent = stats.pendingCount;
  document.getElementById('stat-total').textContent = stats.totalCount;
  document.getElementById('stat-revenue').textContent = formatCurrency(stats.revenue);
}

async function loadRecentOrders() {
  const data = await fetchRecentOrders(8);

  const tbody = document.getElementById('recent-orders-body');
  if (!data?.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No orders yet</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((order) => `
    <tr>
      <td><a href="./orders.html?order=${order.order_number}" style="font-weight:var(--fw-semibold);color:var(--clr-terracotta)">${order.order_number}</a></td>
      <td>${order.customer_name}</td>
      <td>${formatCurrency(order.total)}</td>
      <td>${statusBadge(order.status)}</td>
      <td style="color:var(--clr-stone-400);font-size:var(--fz-xs)">${timeAgo(order.created_at)}</td>
    </tr>
  `).join('');
}

async function loadUpcoming() {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
  const data = await fetchOrdersForDeliveryRange({
    start: today,
    end: nextWeek,
    limit: 8,
    excludeCancelled: true,
  });

  const tbody = document.getElementById('upcoming-body');
  if (!data?.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No upcoming deliveries</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((order) => `
    <tr>
      <td><strong>${order.order_number}</strong></td>
      <td>${order.customer_name}</td>
      <td><strong>${formatDate(order.delivery_date, { short: true })}</strong></td>
      <td>${statusBadge(order.status)}</td>
    </tr>
  `).join('');
}

async function loadWAOrders() {
  const { data, count } = await fetchPendingWhatsappOrders(10);

  document.getElementById('wa-order-count').textContent = `${count || 0} unconverted`;

  const tbody = document.getElementById('wa-orders-body');
  if (!data?.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No WhatsApp orders pending</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((order) => `
    <tr>
      <td><strong>${order.reference_code}</strong></td>
      <td>${order.customer_phone}</td>
      <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:var(--fz-xs);color:var(--clr-stone-400)">${order.message_preview || '—'}</td>
      <td style="font-size:var(--fz-xs);color:var(--clr-stone-400)">${timeAgo(order.created_at)}</td>
      <td>
        <a href="https://wa.me/${order.customer_phone.replace(/\D/g, '')}" target="_blank" class="action-btn action-btn--check" title="Reply on WhatsApp"><i class="fab fa-whatsapp"></i></a>
      </td>
    </tr>
  `).join('');
}
