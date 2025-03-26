const express = require('express');
const {
  getUserReport,
  getRoomReport,
  getBillingReport,
  getMaintenanceReport,
} = require('../controllers/reportController');
const { auth, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Get user report (admin only)
router.get('/users', auth, restrictTo('admin'), getUserReport);

// Get room report (admin only)
router.get('/rooms', auth, restrictTo('admin'), getRoomReport);

// Get billing report (admin only)
router.get('/billing', auth, restrictTo('admin'), getBillingReport);

// Get maintenance report (admin only)
router.get('/maintenance', auth, restrictTo('admin'), getMaintenanceReport);

module.exports = router;