const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const itemController = require('../controllers/item.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public routes
router.get('/', itemController.getAllItems);
router.get('/:id', itemController.getItemById);
router.get('/category/:categoryId', itemController.getItemsByCategory);

// Protected routes (require authentication)
router.use(authMiddleware);

// Create item (Admin/Manager only)
router.post(
  '/',
  roleMiddleware(['admin', 'manager']),
  [
    body('name').notEmpty().withMessage('Item name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('costPrice').isFloat({ min: 0 }).withMessage('Valid cost price is required')
  ],
  itemController.createItem
);

// Update item (Admin/Manager only)
router.put(
  '/:id',
  roleMiddleware(['admin', 'manager']),
  [
    body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('Valid cost price is required')
  ],
  itemController.updateItem
);

// Delete item (Admin only)
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  itemController.deleteItem
);

module.exports = router;
