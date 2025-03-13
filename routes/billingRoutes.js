const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Billing = require('../models/Billing');
const { auth } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');
const crypto = require('crypto');

// Ensure environment variables are loaded
require('dotenv').config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Razorpay API keys are missing! Check your .env file.');
}

// Initialize Razorpay correctly
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Route: Create a Razorpay Order
router.post('/create-razorpay-order', auth, async (req, res) => {
  try {
    const { amount, billId } = req.body;
    
    if (!amount || !billId) {
      return res.status(400).json({ message: 'Amount and Bill ID are required' });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to smallest unit (paise)
      currency: 'INR',
      receipt: `bill_${billId}`,
    });

    res.json({ orderId: order.id, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('❌ Error creating Razorpay order:', err);
    res.status(500).json({ message: 'Error creating order', error: err.message });
  }
});

// Route: Verify Razorpay Payment
router.post('/verify-razorpay-payment', auth, async (req, res) => {
  try {
    const { billId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    
    if (!billId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ message: 'Invalid payment details' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature === razorpaySignature) {
      await Billing.findByIdAndUpdate(billId, { status: 'paid', paidAt: new Date() });
      return res.json({ success: true });
    } else {
      return res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (err) {
    console.error('❌ Payment verification error:', err);
    res.status(500).json({ message: 'Error verifying payment', error: err.message });
  }
});

// Route: Fetch All Bills
router.get('/', auth, async (req, res) => {
  try {
    let bills;
    if (req.user.role === 'resident') {
      bills = await Billing.find({ resident: req.user.resident })
        .populate('resident', 'name')
        .populate('room', 'roomNumber');
    } else {
      bills = await Billing.find()
        .populate('resident', 'name')
        .populate('room', 'roomNumber');
    }

    // Send overdue bill notifications
    const now = new Date();
    for (const bill of bills) {
      if (bill.status === 'unpaid' && bill.dueDate < now) {
        await sendNotification(
          bill.resident._id,
          `Bill overdue for Room ${bill.room.roomNumber}: ₹${bill.amount}`,
          'billing'
        );
      }
    }

    res.json(bills);
  } catch (err) {
    console.error('❌ Error fetching bills:', err);
    res.status(500).json({ message: 'Error fetching bills', error: err.message });
  }
});

module.exports = router;
