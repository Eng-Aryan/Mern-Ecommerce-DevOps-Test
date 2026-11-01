import Stripe from 'stripe';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { getSettings } from '../utils/settings.js';

const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new HttpError(400, 'Card payments are not enabled');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// stripeEnabled is true only when a key is set AND the admin has card payments switched on
export const config = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({ stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY) && settings.cardEnabled !== false });
});

const markPaid = async (order, session) => {
  if (order.isPaid) return order;
  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = { id: session.payment_intent?.toString() || session.id, status: session.payment_status };
  order.statusHistory.push({ status: order.status, note: 'Payment received' });
  await order.save();
  return order;
};

// POST /api/payment/session/:orderId → hosted Stripe Checkout page
export const createSession = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order || order.user.toString() !== req.user._id.toString()) throw new HttpError(404, 'Order not found');
  if (order.isPaid) throw new HttpError(400, 'This order is already paid');
  if (order.status === 'Cancelled') throw new HttpError(400, 'This order was cancelled');

  const settings = await getSettings();
  const client = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: req.user.email,
    metadata: { orderId: order._id.toString() },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (settings.currency || 'USD').toLowerCase(),
          unit_amount: Math.round(order.totalPrice * 100),
          product_data: { name: `Order #${order._id.toString().slice(-8).toUpperCase()}` },
        },
      },
    ],
    success_url: `${client}/order/${order._id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${client}/order/${order._id}`,
  });
  res.json({ url: session.url });
});

// POST /api/payment/confirm/:orderId  { sessionId } — verifies payment with Stripe, then marks the order paid
export const confirmPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order || order.user.toString() !== req.user._id.toString()) throw new HttpError(404, 'Order not found');
  if (order.isPaid) return res.json(order);

  const session = await stripe().checkout.sessions.retrieve(req.body.sessionId);
  if (session.metadata?.orderId !== order._id.toString()) throw new HttpError(400, 'Payment does not match this order');
  if (session.payment_status !== 'paid') throw new HttpError(400, 'Payment has not been completed');
  res.json(await markPaid(order, session));
});

// POST /api/payment/webhook — Stripe calls this so orders are marked paid even if the
// customer closes the tab. Needs STRIPE_WEBHOOK_SECRET; the body must be the raw bytes.
export const webhook = async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return res.status(400).json({ message: 'Webhook is not configured' });
  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
  } catch (err) {
    return res.status(400).json({ message: `Webhook signature check failed: ${err.message}` });
  }
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const order = session.metadata?.orderId && (await Order.findById(session.metadata.orderId));
      if (order && session.payment_status === 'paid') await markPaid(order, session);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler failed:', err);
    res.status(500).json({ message: 'Webhook handler failed' });
  }
};
