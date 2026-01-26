const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get sales report (Admin/Manager only)
router.get(
  '/sales',
  roleMiddleware(['admin', 'manager']),
  reportController.getSalesReport
);

// Get inventory report (Admin/Manager only)
router.get(
  '/inventory',
  roleMiddleware(['admin', 'manager']),
  reportController.getInventoryReport
);

// Get user activity report (Admin/Manager only)
router.get(
  '/user-activity',
  roleMiddleware(['admin', 'manager']),
  reportController.getUserActivityReport
);

// Get financial report (Admin only)
router.get(
  '/financial',
  roleMiddleware(['admin']),
  reportController.getFinancialReport
);

module.exports = router;
