const Order = require('../models/Order');
const PaymentAttempt = require('../models/PaymentAttempt');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');
const { verifyProviderPayment } = require('./paymentController');

const readAddress = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const fields = ['fullName', 'street', 'city', 'postalCode', 'country'];
  const address = {};
  for (const field of fields) {
    if (typeof input[field] !== 'string') return null;
    const value = input[field].trim();
    if (!value || value.length > 150) return null;
    address[field] = value;
  }
  return address;
};
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const addOrderItems = async (req, res) => {
  const orderId = req.body?.razorpay_order_id;
  const paymentId = req.body?.razorpay_payment_id;
  const signature = req.body?.razorpay_signature;
  const address = readAddress(req.body?.address);
  if (!address || typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') {
    return res.status(400).json({ message: 'Valid payment details and a complete shipping address are required.' });
  }

  const alreadyCreated = await Order.findOne({ razorpayOrderId: orderId });
  if (alreadyCreated) {
    if (String(alreadyCreated.userId) !== String(req.user._id) || alreadyCreated.paymentId !== paymentId) {
      return res.status(409).json({ message: 'This payment has already been used.' });
    }
    return res.status(200).json(alreadyCreated);
  }

  const attempt = await PaymentAttempt.findOne({ razorpayOrderId: orderId, userId: req.user._id, status: 'pending' });
  if (!attempt || attempt.expiresAt <= new Date()) return res.status(400).json({ message: 'Payment attempt is invalid or expired.' });

  const payment = await verifyProviderPayment({ orderId, paymentId, signature });
  if (payment.error) return res.status(400).json({ message: payment.error });
  if (payment.order.amount !== attempt.amountPaise) return res.status(400).json({ message: 'Payment amount does not match the order.' });

  const stockChanges = [];
  try {
    const attemptItems = attempt.items.map((item) => ({
      productId: item.productId,
      qty: item.qty,
      price: item.price,
    }));

    for (const item of attemptItems) {
      const result = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
      );
      if (result.modifiedCount !== 1) {
        throw Object.assign(new Error('A product is no longer in stock.'), { statusCode: 409 });
      }
      stockChanges.push(item);
    }

    const order = await Order.create({
      userId: req.user._id,
      items: attemptItems,
      totalAmount: attempt.amountPaise / 100,
      address,
      paymentId,
      razorpayOrderId: orderId,
    });
    try {
      await PaymentAttempt.updateOne({ _id: attempt._id, status: 'pending' }, { $set: { status: 'completed' } });
    } catch (error) {
      console.error('Payment attempt completion marker failed:', error.message);
    }

    const message = `<h2>Order Confirmation</h2><p>Hello ${escapeHtml(req.user.name)},</p><p>Your Shopshere order ${escapeHtml(order._id)} has been paid.</p><p>Total: ₹${order.totalAmount.toFixed(2)}</p><p>Shipping to: ${escapeHtml(address.street)}, ${escapeHtml(address.city)}.</p>`;
    sendEmail({ email: req.user.email, subject: 'Shopshere order confirmation', message })
      .catch((error) => console.error('Order confirmation email failed:', error.message));

    return res.status(201).json(order);
  } catch (error) {
    await Promise.all(stockChanges.map((item) => Product.updateOne({ _id: item.productId }, { $inc: { stock: item.qty } })));
    if (error.code === 11000) {
      const existing = await Order.findOne({ razorpayOrderId: orderId });
      if (existing && String(existing.userId) === String(req.user._id) && existing.paymentId === paymentId) {
        return res.status(200).json(existing);
      }
      return res.status(409).json({ message: 'This payment has already been used.' });
    }
    if (error.statusCode === 409) return res.status(409).json({ message: error.message });
    console.error('Order creation failed:', error.message);
    return res.status(500).json({ message: 'Unable to save the paid order.' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Order history failed:', error.message);
    return res.status(500).json({ message: 'Unable to load order history.' });
  }
};

const getOrders = async (req, res) => {
  try {
    const page = Math.max(1, Math.min(Number(req.query.page) || 1, 1000000));
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 100));
    const [orders, total] = await Promise.all([
      Order.find({}).populate('userId', '_id name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(),
    ]);
    return res.status(200).json({ orders, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin order list failed:', error.message);
    return res.status(500).json({ message: 'Unable to load orders.' });
  }
};

const updateOrderStatus = async (req, res) => {
  const allowedStatuses = ['Pending', 'Shipped', 'Delivered'];
  if (!/^[a-f\d]{24}$/i.test(req.params.id) || !allowedStatuses.includes(req.body?.status)) {
    return res.status(400).json({ message: 'Provide a valid order id and status.' });
  }
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.status(200).json(order);
  } catch (error) {
    console.error('Order status update failed:', error.message);
    return res.status(500).json({ message: 'Unable to update order status.' });
  }
};

module.exports = { addOrderItems, getMyOrders, getOrders, updateOrderStatus };
