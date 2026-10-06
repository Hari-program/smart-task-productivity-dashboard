// ============================================
// Dashboard Routes
// All routes are protected (require authentication)
// ============================================

const express = require('express');
const router = express.Router();
const { getStats, getAnalytics } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

// Dashboard data
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);

module.exports = router;
