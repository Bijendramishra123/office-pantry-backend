const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// All routes require authentication
router.use(authMiddleware);

// Create new order
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').notEmpty().withMessage('Item ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('paymentMethod').isIn(['wallet', 'cash', 'card', 'upi']).withMessage('Invalid payment method')
  ],
  orderController.createOrder
);

// Get user's orders
router.get('/my-orders', orderController.getUserOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order status (Admin/Manager only)
router.put(
  '/:id/status',
  roleMiddleware(['admin', 'manager']),
  [
    body('status').isIn(['pending', 'processing', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  orderController.updateOrderStatus
);

// Cancel order
router.put(
  '/:id/cancel',
  [
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  orderController.cancelOrder
);

// Get all orders (Admin/Manager only)
router.get(
  '/',
  roleMiddleware(['admin', 'manager']),
  orderController.getAllOrders
);

module.exports = router;
