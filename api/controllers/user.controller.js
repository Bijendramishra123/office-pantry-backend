const User = require('../models/User.model');
const Order = require('../models/Order.model');
const Transaction = require('../models/Transaction.model');
const { validationResult } = require('express-validator');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin/manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Manager privileges required.'
      });
    }

    const {
      page = 1,
      limit = 20,
      role,
      department,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (department) {
      query.department = department;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: totalUsers,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.userId !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user stats
    const totalOrders = await Order.countDocuments({ user: user._id });
    const totalSpentResult = await Order.aggregate([
      { $match: { user: user._id, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalSpent = totalOrders > 0 ? totalSpentResult[0]?.total || 0 : 0;

    const userWithStats = {
      ...user.toObject(),
      stats: {
        totalOrders,
        totalSpent,
        walletBalance: user.walletBalance
      }
    };

    res.status(200).json({
      success: true,
      data: userWithStats
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.userId !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prevent role changes by non-admins
    if (req.body.role && req.user.role !== 'admin') {
      delete req.body.role;
    }

    // Prevent wallet balance updates from this endpoint
    if (req.body.walletBalance) {
      delete req.body.walletBalance;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating user',
      error: error.message
    });
  }
};

// Update wallet balance
exports.updateWallet = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod, notes } = req.body;
    const userId = req.params.id;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Manager privileges required.'
      });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldBalance = user.walletBalance;
    user.walletBalance += amount;
    await user.save({ session });

    // Create transaction record
    const transaction = await Transaction.create([{
      user: userId,
      type: amount > 0 ? 'credit' : 'debit',
      amount: Math.abs(amount),
      balanceAfter: user.walletBalance,
      description: notes || `Wallet ${amount > 0 ? 'recharge' : 'deduction'}`,
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
      initiatedBy: req.user.userId
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Wallet ${amount > 0 ? 'credited' : 'debited'} successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          oldBalance,
          newBalance: user.walletBalance
        },
        transaction: transaction[0]
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Update wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating wallet',
      error: error.message
    });
  }
};

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { page = 1, limit = 20, type, startDate, endDate } = req.query;

    const query = { user: userId };
    if (type) query.type = type;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .populate('initiatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalTransactions = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total: totalTransactions,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalTransactions / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query.orderStatus = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('items.item', 'name price image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders',
      error: error.message
    });
  }
};
