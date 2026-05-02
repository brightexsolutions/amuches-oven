// ============================================================
// Amuche's Oven — Receipt / Invoice Generator (receipt.js)
// Opens a print-ready window with a styled invoice
// ============================================================

import { formatCurrency, formatDate } from './utils.js';

export function generateReceipt(order) {
  const items = order.order_items || [];
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee">
        <strong>${i.cake_name}</strong>
        ${i.flavor ? `<br/><small style="color:#8C7355">${i.flavor}${i.size?', '+i.size:''}</small>` : ''}
        ${i.custom_description ? `<br/><small style="color:#C45A2A;font-style:italic">${i.custom_description}</small>` : ''}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(i.unit_price)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${formatCurrency(i.subtotal)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Receipt ${order.order_number} — Amuche's Oven</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;color:#1A0A02;background:#fff;padding:40px}
    .receipt{max-width:680px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #C45A2A}
    .brand-name{font-size:26px;font-weight:700;color:#1A0A02;font-family:Georgia,serif}
    .brand-tag{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C45A2A;margin-top:4px}
    .brand-contact{font-size:12px;color:#8C7355;margin-top:8px;line-height:1.6}
    .doc-title{text-align:right}
    .doc-title h1{font-size:22px;font-weight:700;color:#1A0A02;margin-bottom:4px}
    .doc-title .ref{font-size:18px;color:#C45A2A;font-weight:700;letter-spacing:2px}
    .doc-title .date{font-size:12px;color:#8C7355;margin-top:6px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
    .meta-box{background:#FAF0E2;border-radius:8px;padding:16px}
    .meta-box h3{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#B89B78;margin-bottom:10px}
    .meta-box p{font-size:13px;color:#1A0A02;line-height:1.7;margin:0}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead th{background:#1A0A02;color:#FAF0E2;padding:10px 8px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600}
    thead th:last-child,thead th:nth-child(2),thead th:nth-child(3){text-align:right}
    thead th:nth-child(2){text-align:center}
    .totals{display:flex;justify-content:flex-end}
    .totals-box{width:260px}
    .totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#5C4A32;border-bottom:1px solid #E8D9C4}
    .totals-row.grand{font-size:16px;font-weight:700;color:#1A0A02;border-bottom:none;padding-top:10px}
    .totals-row.grand span:last-child{color:#C45A2A;font-size:20px}
    .status-badges{display:flex;gap:8px;margin-bottom:24px}
    .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
    .badge-status{background:#FEF3CD;color:#92610A}
    .badge-payment{background:#D4EDDA;color:#155724}
    .footer{margin-top:36px;padding-top:20px;border-top:1px solid #E8D9C4;text-align:center;font-size:12px;color:#B89B78;line-height:1.8}
    .footer strong{color:#C45A2A}
    @media print{body{padding:20px}.receipt{max-width:100%}}
  </style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div>
      <div class="brand-name">Amuche's Oven</div>
      <div class="brand-tag">Handcrafted Cakes · Nairobi, Kenya</div>
      <div class="brand-contact">
        hello@amuchesoven.co.ke<br/>
        Nairobi, Kenya
      </div>
    </div>
    <div class="doc-title">
      <h1>RECEIPT / INVOICE</h1>
      <div class="ref">${order.order_number}</div>
      <div class="date">Issued: ${formatDate(order.created_at, { short: true })}</div>
    </div>
  </div>

  <div class="status-badges">
    <span class="badge badge-status">Status: ${order.status}</span>
    <span class="badge badge-payment">Payment: ${order.payment_status}</span>
  </div>

  <div class="meta">
    <div class="meta-box">
      <h3>Bill To</h3>
      <p>
        <strong>${order.customer_name}</strong><br/>
        ${order.customer_phone}<br/>
        ${order.customer_email || ''}
      </p>
    </div>
    <div class="meta-box">
      <h3>Delivery Details</h3>
      <p>
        <strong>Date:</strong> ${formatDate(order.delivery_date, { short: true })}<br/>
        ${order.delivery_time ? `<strong>Time:</strong> ${order.delivery_time}<br/>` : ''}
        <strong>Type:</strong> ${order.is_delivery ? 'Delivery' : 'Pickup'}<br/>
        ${order.is_delivery && order.delivery_address ? `${order.delivery_address}` : ''}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
      <div class="totals-row"><span>Delivery Fee</span><span>${formatCurrency(order.delivery_fee)}</span></div>
      ${order.discount>0 ? `<div class="totals-row"><span>Discount</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
      <div class="totals-row grand"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
    </div>
  </div>

  ${order.special_notes ? `<div style="margin-top:20px;background:#FEF3CD;border-radius:8px;padding:14px;font-size:13px"><strong>Notes:</strong> ${order.special_notes}</div>` : ''}

  <div class="footer">
    Thank you for ordering from <strong>Amuche's Oven</strong>!<br/>
    Every cake is baked fresh with love. We hope you enjoy it.<br/><br/>
    For queries: <strong>hello@amuchesoven.co.ke</strong> · Nairobi, Kenya<br/>
    Track your order at: <strong>amuchesoven.co.ke/track</strong>
  </div>
</div>
<script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
