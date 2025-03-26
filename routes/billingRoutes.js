const express = require('express');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/billingController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create Razorpay order
router.post('/create-razorpay-order', auth, createRazorpayOrder);

// Verify Razorpay payment
router.post('/verify-razorpay-payment', auth, verifyRazorpayPayment);

module.exports = router;
