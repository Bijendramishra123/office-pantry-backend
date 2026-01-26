const Order = require('../models/Order.model');
const User = require('../models/User.model');
const Item = require('../models/Item.model');
const Inventory = require('../models/Inventory.model');
const Transaction = require('../models/Transaction.model');

// Get sales report
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchStage = {};
    
    // Date range filter
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Filter completed orders only
    matchStage.orderStatus = 'completed';

    let groupStage;
    const dateFormat = {
      day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
      year: { $dateToString: { format: "%Y", date: "$createdAt" } }
    }[groupBy] || dateFormat.day;

    groupStage = {
      $group: {
        _id: dateFormat,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        totalItemsSold: { $sum: { $sum: "$items.quantity" } },
        averageOrderValue: { $avg: "$totalAmount" }
      }
    };

    const salesReport = await Order.aggregate([
      { $match: matchStage },
      groupStage,
      { $sort: { _id: 1 } }
    ]);

    // Get overall stats
    const overallStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalItemsSold: { $sum: { $sum: "$items.quantity" } },
          averageOrderValue: { $avg: "$totalAmount" }
        }
      }
    ]);

    // Get top selling items
    const topItems = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      { $unwind: "$itemDetails" },
      {
        $project: {
          itemName: "$itemDetails.name",
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        timeSeries: salesReport,
        overall: overallStats[0] || {},
        topItems
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sales report',
      error: error.message
    });
  }
};

// Get inventory report
exports.getInventoryReport = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find()
      .populate('item', 'name category price costPrice')
      .lean();

    // Calculate inventory value
    let totalInventoryValue = 0;
    let totalCostValue = 0;
    const inventoryByStatus = {
      'in-stock': { count: 0, value: 0 },
      'low-stock': { count: 0, value: 0 },
      'out-of-stock': { count: 0, value: 0 },
      'expired': { count: 0, value: 0 }
    };

    inventoryItems.forEach(item => {
      const itemValue = item.quantity * item.item.price;
      const itemCost = item.quantity * item.item.costPrice;
      
      totalInventoryValue += itemValue;
      totalCostValue += itemCost;

      if (inventoryByStatus[item.status]) {
        inventoryByStatus[item.status].count++;
        inventoryByStatus[item.status].value += itemValue;
      }
    });

    // Get low stock items
    const lowStockItems = inventoryItems.filter(item => 
      item.status === 'low-stock' || item.status === 'out-of-stock'
    ).slice(0, 20);

    // Get items that need reorder
    const reorderItems = inventoryItems.filter(item => 
      item.quantity <= (item.item?.minStockLevel || 10)
    ).slice(0, 20);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems: inventoryItems.length,
          totalInventoryValue,
          totalCostValue,
          profitPotential: totalInventoryValue - totalCostValue,
          byStatus: inventoryByStatus
        },
        lowStockItems: lowStockItems.map(item => ({
          itemName: item.item.name,
          currentStock: item.quantity,
          minStockLevel: item.item.minStockLevel,
          status: item.status
        })),
        reorderItems: reorderItems.map(item => ({
          itemName: item.item.name,
          currentStock: item.quantity,
          minStockLevel: item.item.minStockLevel,
          reorderQuantity: (item.item.maxStockLevel || 100) - item.quantity
        }))
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating inventory report',
      error: error.message
    });
  }
};

// Get user activity report
exports.getUserActivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    
    // Date range filter
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Get top users by orders
    const topUsers = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          userName: "$userDetails.name",
          userEmail: "$userDetails.email",
          department: "$userDetails.department",
          totalOrders: 1,
          totalSpent: 1,
          averageOrderValue: 1
        }
      }
    ]);

    // Get orders by department
    const ordersByDept = await Order.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: "$userDetails" },
      {
        $group: {
          _id: "$userDetails.department",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          uniqueUsers: { $addToSet: "$user" }
        }
      },
      {
        $project: {
          department: "$_id",
          totalOrders: 1,
          totalRevenue: 1,
          uniqueUsersCount: { $size: "$uniqueUsers" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Get new users by month
    const newUsers = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        topUsers,
        ordersByDept,
        newUsers
      }
    });
  } catch (error) {
    console.error('Get user activity report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating user activity report',
      error: error.message
    });
  }
};

// Get financial report
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    
    // Date range filter
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Get revenue from completed orders
    const revenueData = await Order.aggregate([
      { $match: { ...matchStage, orderStatus: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          cost: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get transaction summary
    const transactionSummary = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get wallet balances
    const walletStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$walletBalance" },
          averageBalance: { $avg: "$walletBalance" },
          userCount: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } }
        }
      }
    ]);

    // Calculate profit
    let totalRevenue = 0;
    let totalCost = 0;
    
    revenueData.forEach(item => {
      totalRevenue += item.revenue;
      // For simplicity, assuming 30% cost of goods sold
      totalCost += item.revenue * 0.3;
    });

    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        revenue: revenueData,
        transactions: transactionSummary,
        wallet: walletStats[0] || {},
        summary: {
          totalRevenue,
          totalCost,
          profit,
          profitMargin: profitMargin.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating financial report',
      error: error.message
    });
  }
};
