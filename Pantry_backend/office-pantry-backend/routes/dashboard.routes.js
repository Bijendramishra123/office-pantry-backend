// backend/routes/dashboard.routes.js
import express from 'express';
import {
  getDashboardStats,
  getRecentOrders,
  getLowStockAlerts,
  getStockStatus
} from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // All dashboard routes require authentication

router.get('/stats', getDashboardStats);
router.get('/recent-orders', getRecentOrders);
router.get('/alerts', getLowStockAlerts);
router.get('/stock-status', getStockStatus);

export default router;