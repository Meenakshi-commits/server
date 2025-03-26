const express = require('express');
const {
  createResident,
  getResidents,
  getResidentById,
  updateResident,
  deleteResident,
} = require('../controllers/residentController');
const { auth, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Create a new resident (admin only)
router.post('/', auth, restrictTo('admin'), createResident);

// Get all residents (admin and users)
router.get('/', auth, getResidents);

// Get a resident by ID (admin and resident)
router.get('/:id', auth, getResidentById);

// Update a resident by ID (admin only)
router.put('/:id', auth, restrictTo('admin'), updateResident);

// Delete a resident by ID (admin only)
router.delete('/:id', auth, restrictTo('admin'), deleteResident);

module.exports = router;
