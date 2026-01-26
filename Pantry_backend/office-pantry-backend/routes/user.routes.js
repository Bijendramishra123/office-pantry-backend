const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all users (Admin/Manager only)
router.get(
  '/',
  roleMiddleware(['admin', 'manager']),
  userController.getAllUsers
);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('department').optional().notEmpty().withMessage('Department is required')
  ],
  userController.updateUser
);

// Delete user (Admin only)
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  userController.deleteUser
);

// Update wallet balance (Admin/Manager only)
router.post(
  '/:id/wallet',
  roleMiddleware(['admin', 'manager']),
  [
    body('amount').isNumeric().withMessage('Valid amount is required'),
    body('paymentMethod').isIn(['cash', 'card', 'upi', 'bank_transfer']).withMessage('Invalid payment method')
  ],
  userController.updateWallet
);

// Get user transactions
router.get('/:id/transactions', userController.getUserTransactions);

// Get user orders
router.get('/:id/orders', userController.getUserOrders);

module.exports = router;
