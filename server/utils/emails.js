import { formatMoney } from './settings.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shortId = (id) => String(id).slice(-8).toUpperCase();
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

const wrap = (settings, title, body) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1b1f23">
  <h2 style="color:#0e3b43;margin-bottom:4px">${esc(settings.storeName)}</h2>
  <h3 style="margin-top:0">${esc(title)}</h3>
  ${body}
  <p style="color:#777;font-size:12px;margin-top:32px">${esc(settings.storeName)} · ${esc(settings.contact?.email || '')}</p>
</div>`;

export const orderConfirmation = (order, settings) => {
  const rows = order.items
    .map((i) => `<tr><td style="padding:4px 0">${esc(i.name)}${i.variantLabel ? ` (${esc(i.variantLabel)})` : ''} × ${i.qty}</td><td style="text-align:right">${formatMoney(settings, i.price * i.qty)}</td></tr>`)
    .join('');
  const html = wrap(
    settings,
    `Thanks for your order #${shortId(order._id)}`,
    `<p>We've received your order and will email you when it ships.</p>
     <table style="width:100%;border-collapse:collapse">${rows}
     <tr><td style="border-top:1px solid #ddd;padding-top:8px"><strong>Total</strong></td><td style="border-top:1px solid #ddd;text-align:right;padding-top:8px"><strong>${formatMoney(settings, order.totalPrice)}</strong></td></tr></table>
     <p><a href="${clientUrl()}/order/${order._id}">View your order</a></p>`
  );
  return { subject: `Order #${shortId(order._id)} confirmed`, html, text: `Thanks for your order #${shortId(order._id)}. Total ${formatMoney(settings, order.totalPrice)}. ${clientUrl()}/order/${order._id}` };
};

export const orderStatus = (order, settings) => {
  const track = order.trackingNumber ? `<p>Carrier: <strong>${esc(order.carrier || '—')}</strong><br>Tracking number: <strong>${esc(order.trackingNumber)}</strong></p>` : '';
  const html = wrap(settings, `Your order #${shortId(order._id)} is ${order.status.toLowerCase()}`, `${track}<p><a href="${clientUrl()}/order/${order._id}">Track your order</a></p>`);
  return { subject: `Order #${shortId(order._id)} ${order.status.toLowerCase()}`, html, text: `Your order #${shortId(order._id)} is now ${order.status}. ${clientUrl()}/order/${order._id}` };
};

export const resetPassword = (url, settings) => ({
  subject: `Reset your ${settings.storeName} password`,
  html: wrap(settings, 'Reset your password', `<p>Use the button below to choose a new password. The link works for one hour.</p><p><a href="${url}" style="background:#0e3b43;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Choose a new password</a></p><p style="font-size:13px;color:#555">If you didn't ask for this, you can ignore this email.</p>`),
  text: `Reset your password (valid for one hour): ${url}`,
});

export const welcome = (user, settings) => ({
  subject: `Welcome to ${settings.storeName}`,
  html: wrap(settings, `Welcome, ${user.name.split(' ')[0]}!`, `<p>Your account is ready. <a href="${clientUrl()}/shop">Start shopping</a>.</p>`),
  text: `Welcome to ${settings.storeName}! ${clientUrl()}/shop`,
});

export const contactNotice = (msg, settings) => ({
  subject: `[${settings.storeName}] New message: ${msg.subject || 'Contact form'}`,
  html: wrap(settings, 'New contact message', `<p><strong>${esc(msg.name)}</strong> &lt;${esc(msg.email)}&gt;</p><p>${esc(msg.message).replace(/\n/g, '<br>')}</p>`),
  text: `${msg.name} <${msg.email}>\n\n${msg.message}`,
});
