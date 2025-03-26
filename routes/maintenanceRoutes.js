const express = require('express');
const {
  createMaintenanceRequest,
  updateMaintenanceStatus,
  getMaintenanceRequests,
} = require('../controllers/maintenanceController');
const { auth, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Create a maintenance request (admin only)
router.post('/', auth, restrictTo('admin'), createMaintenanceRequest);

// Update maintenance request status (admin only)
router.put('/:id', auth, restrictTo('admin'), updateMaintenanceStatus);

// Get all maintenance requests (admin and residents)
router.get('/', auth, getMaintenanceRequests);

module.exports = router;