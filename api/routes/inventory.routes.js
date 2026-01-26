const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventory.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all inventory items
router.get('/', inventoryController.getAllInventory);

// Get inventory alerts
router.get('/alerts', inventoryController.getAlerts);

// Get item history
router.get('/history/:itemId', inventoryController.getItemHistory);

// Update stock (Admin/Manager only)
router.post(
  '/update',
  roleMiddleware(['admin', 'manager']),
  [
    body('itemId').notEmpty().withMessage('Item ID is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
    body('operation').isIn(['add', 'subtract', 'set']).withMessage('Invalid operation')
  ],
  inventoryController.updateStock
);

// Bulk update inventory (Admin/Manager only)
router.post(
  '/bulk-update',
  roleMiddleware(['admin', 'manager']),
  [
    body('updates').isArray().withMessage('Updates must be an array'),
    body('updates.*.itemId').notEmpty().withMessage('Item ID is required'),
    body('updates.*.quantity').isInt({ min: 0 }).withMessage('Valid quantity is required')
  ],
  inventoryController.bulkUpdateStock
);

module.exports = router;
