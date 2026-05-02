// ============================================================
// Amuche's Oven — Admin Schedule (schedule.js)
// ============================================================

import { fetchOrdersForDeliveryRange } from '../data-access.js';
import { initAdminLayout } from './layout.js';
import { formatDate, formatCurrency, statusBadge, hidePageLoader } from '../utils.js';

let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let ordersCache  = {};   // keyed by YYYY-MM-DD
let selectedDate = new Date().toISOString().split('T')[0];

function getCustomerLabel(order) {
  return order?.customer_name?.trim() || 'Unknown customer';
}

function getCustomerFirstName(order) {
  return getCustomerLabel(order).split(' ')[0] || 'Customer';
}

function getOrderItemsLabel(order) {
  const items = (order?.order_items || [])
    .map((item) => item?.cake_name?.trim())
    .filter(Boolean);

  return items.length ? items.join(', ') : 'Custom cake request';
}

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();
  const session = await initAdminLayout('./schedule.html');
  if (!session) return;

  document.getElementById('prev-month')?.addEventListener('click', async () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    await loadMonthOrders();
    renderCalendar();
  });
  document.getElementById('next-month')?.addEventListener('click', async () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    await loadMonthOrders();
    renderCalendar();
  });
  document.getElementById('go-today')?.addEventListener('click', async () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    selectedDate = today.toISOString().split('T')[0];
    await loadMonthOrders();
    renderCalendar();
    window._showDay(selectedDate);
  });
  document.getElementById('close-day-panel')?.addEventListener('click', () => { document.getElementById('day-detail-panel').style.display='none'; });

  await loadMonthOrders();
  renderCalendar();
  loadUpcoming();
});

async function loadMonthOrders() {
  const start = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-01`;
  const end   = new Date(currentYear, currentMonth+1, 0).toISOString().split('T')[0];
  const data = await fetchOrdersForDeliveryRange({
    start,
    end,
    includeItems: true,
    excludeCancelled: true,
  });

  ordersCache = {};
  (data||[]).forEach(o => {
    const key = o.delivery_date;
    if (!ordersCache[key]) ordersCache[key] = [];
    ordersCache[key].push(o);
  });
}

function renderCalendar() {
  const label   = document.getElementById('cal-month-label');
  const grid    = document.getElementById('calendar-grid');
  const today   = new Date().toISOString().split('T')[0];

  label.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-KE',{month:'long',year:'numeric'});

  const firstDay  = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMon = new Date(currentYear, currentMonth+1, 0).getDate();
  const daysInPrev= new Date(currentYear, currentMonth, 0).getDate();

  let cells = '';
  // Prev month padding
  for (let i = firstDay-1; i >= 0; i--) {
    cells += `<div class="schedule-day other-month"><div class="schedule-day-num">${daysInPrev-i}</div></div>`;
  }
  // Current month
  for (let d = 1; d <= daysInMon; d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDate;
    const dayOrders = ordersCache[dateStr] || [];

    const events = dayOrders.slice(0,3).map(o => {
      const cls = o.status==='baking' ? 'baking' : o.status==='decorating' ? 'decorating' : o.status==='pending'||o.status==='confirmed' ? '' : 'delivery';
      return `<div class="schedule-event ${cls?'schedule-event--'+cls:''}" style="${!cls?'background:#FEF3CD;color:#92610A':''}">${getCustomerFirstName(o)}</div>`;
    }).join('');

    const more = dayOrders.length > 3 ? `<div style="font-size:9px;color:var(--clr-stone-400);padding:1px 4px">+${dayOrders.length-3} more</div>` : '';

    cells += `<div class="schedule-day ${isToday?'today':''} ${isSelected?'selected':''}" data-date="${dateStr}" onclick="window._showDay('${dateStr}')">
      <div class="schedule-day-num">${d}</div>
      ${isSelected ? '<div class="schedule-day-indicator" aria-hidden="true"></div>' : ''}
      ${events}${more}
    </div>`;
  }
  // Next month padding
  const remaining = 42 - (firstDay + daysInMon);
  for (let d = 1; d <= remaining; d++) {
    cells += `<div class="schedule-day other-month"><div class="schedule-day-num">${d}</div></div>`;
  }

  grid.innerHTML = cells;
}

window._showDay = (dateStr) => {
  selectedDate = dateStr;
  renderCalendar();

  const orders = ordersCache[dateStr] || [];
  const panel  = document.getElementById('day-detail-panel');
  const title  = document.getElementById('day-detail-title');
  const list   = document.getElementById('day-orders-list');

  title.textContent = `Orders for ${formatDate(dateStr,{short:true})} (${orders.length})`;

  if (!orders.length) {
    list.innerHTML = `<div style="text-align:center;padding:var(--sp-8);color:var(--clr-stone-400)"><i class="fas fa-calendar-xmark" style="font-size:1.5rem;display:block;margin-bottom:var(--sp-3)"></i>No orders this day</div>`;
  } else {
    list.innerHTML = orders.map(o => `
      <div class="day-order-item">
        <div>
          <strong>${o.order_number || 'No order number'}</strong> — ${getCustomerLabel(o)}
          <div style="font-size:var(--fz-xs);color:var(--clr-stone-400)">
            ${getOrderItemsLabel(o)}
            ${o.delivery_time?' · '+o.delivery_time:''}
            · ${o.is_delivery?'Delivery':'Pickup'}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          ${statusBadge(o.status)}
          <strong>${formatCurrency(o.total)}</strong>
          <a href="./orders.html?order=${o.order_number}" class="action-btn action-btn--view" title="View order"><i class="fas fa-arrow-right"></i></a>
        </div>
      </div>`).join('');
  }

  panel.style.display = '';
  panel.scrollIntoView({ behavior:'smooth', block:'start' });
};

async function loadUpcoming() {
  const today   = new Date().toISOString().split('T')[0];
  const in14    = new Date(Date.now()+14*864e5).toISOString().split('T')[0];
  const data = await fetchOrdersForDeliveryRange({
    start: today,
    end: in14,
    includeItems: true,
    excludeCancelled: true,
  });

  const tbody = document.getElementById('upcoming-orders-body');
  if (!data?.length) { tbody.innerHTML=`<tr><td colspan="7" class="table-empty">No upcoming deliveries</td></tr>`; return; }

  tbody.innerHTML = data.map(o => `
    <tr>
      <td data-label="Order" data-priority="primary"><a href="./orders.html?order=${o.order_number}" style="font-weight:var(--fw-semibold);color:var(--clr-terracotta)">${o.order_number || 'No order number'}</a></td>
      <td data-label="Customer" data-priority="secondary">${getCustomerLabel(o)}</td>
      <td data-label="Cake" data-mobile-hidden="true" style="font-size:var(--fz-xs);color:var(--clr-stone-500)">${getOrderItemsLabel(o)}</td>
      <td data-label="Delivery"><strong>${formatDate(o.delivery_date,{short:true})}</strong></td>
      <td data-label="Time">${o.delivery_time||'—'}</td>
      <td data-label="Type">${o.is_delivery?'<span class="badge badge--confirmed">Delivery</span>':'<span class="badge badge--baking">Pickup</span>'}</td>
      <td data-label="Status">${statusBadge(o.status)}</td>
    </tr>`).join('');
}
