const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const PaymentAttempt = require('../models/PaymentAttempt');

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId || !process.env.RAZORPAY_KEY_SECRET) return null;
  if (!keyId.startsWith('rzp_test_')) throw new Error('This portfolio checkout only accepts Razorpay test keys.');
  return new Razorpay({ key_id: keyId, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

const readCart = (input) => {
  if (!Array.isArray(input) || input.length === 0 || input.length > 50) return null;
  const quantities = new Map();
  for (const item of input) {
    if (!item || typeof item.productId !== 'string' || !mongoose.isValidObjectId(item.productId)
      || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20) return null;
    const key = String(item.productId);
    quantities.set(key, (quantities.get(key) || 0) + item.qty);
    if (quantities.get(key) > 20) return null;
  }
  return [...quantities].map(([productId, qty]) => ({ productId, qty }));
};

const fetchPricedCart = async (items) => {
  const products = await Product.find({ _id: { $in: items.map((item) => item.productId) } }).lean();
  const productMap = new Map(products.map((product) => [String(product._id), product]));
  if (products.length !== items.length) return { error: 'A product in your cart is no longer available.' };

  const pricedItems = [];
  let amountPaise = 0;
  for (const item of items) {
    const product = productMap.get(String(item.productId));
    if (!product || !Number.isFinite(product.price) || product.price < 0) return { error: 'A product in your cart has an invalid price.' };
    if (!Number.isInteger(product.stock) || product.stock < item.qty) return { error: `${product.name} does not have enough stock.` };
    const pricePaise = Math.round(product.price * 100);
    amountPaise += pricePaise * item.qty;
    pricedItems.push({ productId: product._id, qty: item.qty, price: pricePaise / 100 });
  }
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 1 || amountPaise > 100000000) {
    return { error: 'Order total must be between ₹0.01 and ₹1,000,000.' };
  }
  return { pricedItems, amountPaise };
};

const verifyProviderPayment = async ({ orderId, paymentId, signature }) => {
  const instance = getRazorpayClient();
  if (!instance) return { error: 'Payment provider is not configured.' };
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return { error: 'Payment details are invalid.' };
  }

  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const supplied = Buffer.from(signature, 'hex');
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(expected, supplied)) {
    return { error: 'Payment signature is invalid.' };
  }

  try {
    const [order, payment] = await Promise.all([
      instance.orders.fetch(orderId),
      instance.payments.fetch(paymentId),
    ]);
    if (payment.order_id !== order.id || payment.status !== 'captured' || payment.amount !== order.amount || payment.currency !== 'INR') {
      return { error: 'Payment is not captured for this order.' };
    }
    return { order, payment };
  } catch (error) {
    console.error('Razorpay verification lookup failed:', error.message);
    return { error: 'Unable to confirm payment with the provider.' };
  }
};

const createOrder = async (req, res) => {
  const instance = getRazorpayClient();
  if (!instance) return res.status(503).json({ message: 'Razorpay is not configured. Set the provider keys to enable checkout.' });
  const items = readCart(req.body?.items);
  if (!items) return res.status(400).json({ message: 'Provide between 1 and 50 valid products with quantities from 1 to 20.' });

  try {
    const priced = await fetchPricedCart(items);
    if (priced.error) return res.status(409).json({ message: priced.error });
    const providerOrder = await instance.orders.create({
      amount: priced.amountPaise,
      currency: 'INR',
      receipt: `shopshere-${crypto.randomBytes(10).toString('hex')}`,
      notes: { userId: String(req.user._id) },
    });
    await PaymentAttempt.create({
      userId: req.user._id,
      razorpayOrderId: providerOrder.id,
      items: priced.pricedItems,
      amountPaise: priced.amountPaise,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return res.status(201).json({
      id: providerOrder.id,
      amount: providerOrder.amount,
      currency: providerOrder.currency,
      totalAmount: priced.amountPaise / 100,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Payment order creation failed:', error.message);
    return res.status(502).json({ message: 'Unable to start payment. Please try again.' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const orderId = req.body?.razorpay_order_id;
    const attempt = typeof orderId === 'string'
      ? await PaymentAttempt.findOne({ razorpayOrderId: orderId, userId: req.user._id, status: 'pending' })
      : null;
    if (!attempt || attempt.expiresAt <= new Date()) return res.status(400).json({ message: 'Payment attempt is invalid or expired.' });
    const result = await verifyProviderPayment({
      orderId,
      paymentId: req.body?.razorpay_payment_id,
      signature: req.body?.razorpay_signature,
    });
    if (result.error) return res.status(400).json({ message: result.error });
    if (result.order.amount !== attempt.amountPaise) return res.status(400).json({ message: 'Payment amount does not match the order.' });
    return res.status(200).json({ verified: true, amount: result.payment.amount, currency: result.payment.currency });
  } catch (error) {
    console.error('Payment verification failed:', error.message);
    return res.status(500).json({ message: 'Unable to verify payment.' });
  }
};

module.exports = { createOrder, verifyPayment, readCart, fetchPricedCart, verifyProviderPayment };
