const Razorpay = require('razorpay');
const Billing = require('../models/Billing');
const crypto = require('crypto');

// Ensure environment variables are loaded
require('dotenv').config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Razorpay API keys are missing! Check your .env file.');
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createRazorpayOrder = async (req, res) => {
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
};

exports.verifyRazorpayPayment = async (req, res) => {
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
};
