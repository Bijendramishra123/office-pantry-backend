const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes (require authentication)
router.use(authMiddleware);

// Create category (Admin/Manager only)
router.post(
  '/',
  roleMiddleware(['admin', 'manager']),
  [
    body('name').notEmpty().withMessage('Category name is required')
  ],
  categoryController.createCategory
);

// Update category (Admin/Manager only)
router.put(
  '/:id',
  roleMiddleware(['admin', 'manager']),
  [
    body('name').optional().notEmpty().withMessage('Category name cannot be empty')
  ],
  categoryController.updateCategory
);

// Delete category (Admin only)
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  categoryController.deleteCategory
);

module.exports = router;
