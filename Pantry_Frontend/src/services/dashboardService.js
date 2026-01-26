// src/services/dashboardService.js
// COMPLETELY STATIC VERSION - NO API CALLS AT ALL

const STATIC_DATA = {
  stats: {
    totalOrders: 24,
    availableItems: 156,
    walletBalance: 0,
    monthlySales: 12450,
    totalUsers: 45,
    pendingOrders: 3
  },
  recentOrders: [
    { 
      _id: '1', 
      orderId: 'ORD-240123-4567', 
      items: [{name: 'Coffee', quantity: 2}], 
      totalAmount: 40, 
      status: 'completed', 
      createdAt: new Date() 
    },
    { 
      _id: '2', 
      orderId: 'ORD-240123-4568', 
      items: [{name: 'Sandwich', quantity: 1}], 
      totalAmount: 50, 
      status: 'processing', 
      createdAt: new Date() 
    },
    { 
      _id: '3', 
      orderId: 'ORD-240123-4569', 
      items: [{name: 'Chips', quantity: 3}], 
      totalAmount: 90, 
      status: 'pending', 
      createdAt: new Date() 
    },
    { 
      _id: '4', 
      orderId: 'ORD-240123-4570', 
      items: [{name: 'Tea', quantity: 1}], 
      totalAmount: 15, 
      status: 'completed', 
      createdAt: new Date() 
    }
  ],
  alerts: [
    { _id: '1', message: 'Coffee running low (5 units left)', type: 'warning', item: 'Coffee', currentStock: 5 },
    { _id: '2', message: '3 new orders pending', type: 'info' },
    { _id: '3', message: 'Milk stock expired', type: 'error', item: 'Milk' },
    { _id: '4', message: 'Monthly report ready', type: 'success' }
  ],
  stockStatus: {
    inStock: 65,
    lowStock: 20,
    outOfStock: 15
  }
};

// ALWAYS return static data - NO API calls
export const getAllDashboardData = async () => {
  console.log('📊 Dashboard: Using static data (no backend APIs)');
  return STATIC_DATA;
};

// Individual functions (optional)
export const getDashboardStats = async () => STATIC_DATA.stats;
export const getRecentOrders = async () => STATIC_DATA.recentOrders;
export const getLowStockAlerts = async () => STATIC_DATA.alerts;
export const getStockStatus = async () => STATIC_DATA.stockStatus;