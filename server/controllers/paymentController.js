import Stripe from 'stripe';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new HttpError(400, 'Card payments are not enabled');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

export const config = (req, res) => res.json({ stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY) });

// POST /api/payment/session/:orderId → hosted Stripe Checkout page
export const createSession = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order || order.user.toString() !== req.user._id.toString()) throw new HttpError(404, 'Order not found');
  if (order.isPaid) throw new HttpError(400, 'This order is already paid');
  if (order.status === 'Cancelled') throw new HttpError(400, 'This order was cancelled');

  const client = process.env.CLIENT_URL || 'http://localhost:5173';
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: req.user.email,
    metadata: { orderId: order._id.toString() },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
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

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = { id: session.payment_intent?.toString() || session.id, status: session.payment_status };
  await order.save();
  res.json(order);
});
