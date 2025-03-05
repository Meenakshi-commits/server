const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Billing = require('../models/Billing');
const { auth } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/create-order', async (req, res) => {
  const { amount, currency, receipt } = req.body;

  try {
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency,
      receipt,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/create-razorpay-order', auth, async (req, res) => {
  const { amount, billId } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `bill_${billId}`,
    });
    res.json({ orderId: order.id, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/verify-razorpay-payment', auth, async (req, res) => {
  const { billId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
  const crypto = require('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature === razorpaySignature) {
    await Billing.findByIdAndUpdate(billId, { status: 'paid', paidAt: new Date() });
    res.json({ success: true });
  } else {
    res.status(400).json({ message: 'Payment verification failed' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    let bills;
    if (req.user.role === 'resident') {
      bills = await Billing.find({ resident: req.user.resident }).populate('resident', 'name').populate('room', 'roomNumber');
    } else {
      bills = await Billing.find().populate('resident', 'name').populate('room', 'roomNumber');
    }
    const now = new Date();
    for (const bill of bills) {
      if (bill.status === 'unpaid' && bill.dueDate < now) {
        await sendNotification(bill.resident._id, `Bill overdue for Room ${bill.room.roomNumber}: $${bill.amount}`, 'billing');
      }
    }
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;