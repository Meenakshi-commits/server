const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Fetch all users (restricted to admins)
router.get('/', authenticate, authorize('admin'), getAllUsers);

module.exports = router;
