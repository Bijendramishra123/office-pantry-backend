const { body, param, query } = require('express-validator');

// Common validation rules
const commonValidations = {
  email: body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  password: body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  name: body('name').notEmpty().trim().withMessage('Name is required'),
  employeeId: body('employeeId').notEmpty().trim().withMessage('Employee ID is required'),
  department: body('department').notEmpty().trim().withMessage('Department is required'),
  price: body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  quantity: body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
};

// Register validation
const registerValidation = [
  commonValidations.employeeId,
  commonValidations.name,
  commonValidations.email,
  commonValidations.password,
  commonValidations.department,
  body('role').optional().isIn(['employee', 'manager', 'admin']).withMessage('Invalid role')
];

// Login validation
const loginValidation = [
  commonValidations.email,
  body('password').notEmpty().withMessage('Password is required')
];

// Item validation
const itemValidation = [
  body('name').notEmpty().trim().withMessage('Item name is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  commonValidations.price,
  body('costPrice').isFloat({ min: 0 }).withMessage('Valid cost price is required'),
  body('description').optional().trim(),
  body('unit').optional().isIn(['piece', 'pack', 'bottle', 'can', 'cup', 'bowl']).withMessage('Invalid unit'),
  body('minStockLevel').optional().isInt({ min: 0 }).withMessage('Minimum stock level must be non-negative'),
  body('maxStockLevel').optional().isInt({ min: 0 }).withMessage('Maximum stock level must be non-negative'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean')
];

// Order validation
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.itemId').isMongoId().withMessage('Valid item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').isIn(['wallet', 'cash', 'card', 'upi']).withMessage('Invalid payment method'),
  body('notes').optional().trim()
];

// Inventory update validation
const inventoryUpdateValidation = [
  body('itemId').isMongoId().withMessage('Valid item ID is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Invalid operation'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required'),
  body('batchNumber').optional().trim(),
  body('notes').optional().trim()
];

// Wallet recharge validation
const walletRechargeValidation = [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('paymentMethod').isIn(['cash', 'card', 'upi', 'bank_transfer']).withMessage('Invalid payment method'),
  body('notes').optional().trim()
];

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Date range validation
const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required')
];

// ID parameter validation
const idValidation = [
  param('id').isMongoId().withMessage('Valid ID is required')
];

module.exports = {
  commonValidations,
  registerValidation,
  loginValidation,
  itemValidation,
  orderValidation,
  inventoryUpdateValidation,
  walletRechargeValidation,
  paginationValidation,
  dateRangeValidation,
  idValidation
};
