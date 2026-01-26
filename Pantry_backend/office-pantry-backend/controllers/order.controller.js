const Order = require('../models/Order.model');
const User = require('../models/User.model');
const Item = require('../models/Item.model');
const Inventory = require('../models/Inventory.model');
const Transaction = require('../models/Transaction.model');
const Notification = require('../models/Notification.model');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Create new order
exports.createOrder = async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    console.log('📥 [ORDER] Received order request from user:', req.user.userId);
    console.log('📦 [ORDER] Request body:', JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [ORDER] Validation errors:', errors.array());
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { items, paymentMethod, notes } = req.body;
    const userId = req.user.userId;

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      console.log('❌ [ORDER] No items in order');
      return res.status(400).json({
        success: false,
        message: 'No items in order. Please add items to cart.'
      });
    }

    // Validate items and check stock
    let subtotal = 0;
    const orderItems = [];

    console.log('🔄 [ORDER] Processing', items.length, 'items...');

    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      console.log(`📦 [ORDER] Processing item ${i + 1}:`, itemData);

      // Validate item data
      if (!itemData.itemId) {
        await session.abortTransaction();
        console.log('❌ [ORDER] Missing itemId for item:', itemData);
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing itemId`
        });
      }

      if (!itemData.quantity || itemData.quantity < 1) {
        await session.abortTransaction();
        console.log('❌ [ORDER] Invalid quantity for item:', itemData);
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for item ${i + 1}`
        });
      }

      // Find item
      const item = await Item.findById(itemData.itemId).session(session);
      if (!item) {
        await session.abortTransaction();
        console.log('❌ [ORDER] Item not found:', itemData.itemId);
        return res.status(400).json({
          success: false,
          message: `Item ${itemData.name || `with ID ${itemData.itemId}`} not found`
        });
      }

      console.log(`✅ [ORDER] Found item: ${item.name} (₹${item.price})`);

      if (!item.isAvailable) {
        await session.abortTransaction();
        console.log('❌ [ORDER] Item not available:', item.name);
        return res.status(400).json({
          success: false,
          message: `Item "${item.name}" is currently unavailable`
        });
      }

      // Check inventory
      const inventory = await Inventory.findOne({ item: item._id }).session(session);
      console.log(`📊 [ORDER] Inventory for ${item.name}:`, {
        requested: itemData.quantity,
        available: inventory?.quantity || 0,
        status: inventory?.status || 'unknown'
      });

      if (!inventory) {
        await session.abortTransaction();
        console.log('❌ [ORDER] No inventory record for item:', item.name);
        return res.status(400).json({
          success: false,
          message: `Inventory not found for "${item.name}"`
        });
      }

      if (inventory.quantity < itemData.quantity) {
        await session.abortTransaction();
        console.log('❌ [ORDER] Insufficient stock:', item.name);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.name}". Available: ${inventory.quantity}, Requested: ${itemData.quantity}`
        });
      }

      // Calculate item total
      const itemTotal = item.price * itemData.quantity;
      subtotal += itemTotal;

      orderItems.push({
        item: item._id,
        quantity: itemData.quantity,
        price: item.price,
        total: itemTotal
      });

      console.log(`✅ [ORDER] Added item to order: ${item.name} x${itemData.quantity} = ₹${itemTotal}`);
    }

    // Calculate tax (5% tax)
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + tax;

    console.log('💰 [ORDER] Calculated totals:', {
      subtotal: `₹${subtotal}`,
      tax: `₹${tax.toFixed(2)}`,
      totalAmount: `₹${totalAmount.toFixed(2)}`
    });

    // Check payment method
    const validPaymentMethods = ['wallet', 'cash', 'card', 'upi'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      await session.abortTransaction();
      console.log('❌ [ORDER] Invalid payment method:', paymentMethod);
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Valid methods: ${validPaymentMethods.join(', ')}`
      });
    }

    console.log('💳 [ORDER] Payment method:', paymentMethod);

    // Check payment method and process payment
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      console.log('❌ [ORDER] User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (paymentMethod === 'wallet') {
      console.log('💼 [ORDER] Wallet payment check:', {
        walletBalance: user.walletBalance,
        totalAmount,
        sufficient: user.walletBalance >= totalAmount
      });

      if (user.walletBalance < totalAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Available: ₹${user.walletBalance}, Required: ₹${totalAmount.toFixed(2)}`,
          availableBalance: user.walletBalance,
          requiredAmount: totalAmount
        });
      }
      
      // Deduct from wallet
      user.walletBalance -= totalAmount;
      await user.save({ session });
      console.log('✅ [ORDER] Wallet updated. New balance:', user.walletBalance);
    }

    // Update inventory - deduct stock
    console.log('📦 [ORDER] Updating inventory...');
    for (const itemData of items) {
      const updateResult = await Inventory.findOneAndUpdate(
        { item: itemData.itemId },
        { 
          $inc: { quantity: -itemData.quantity },
          $set: { 
            lastUpdated: new Date(),
            status: function() {
              const newQuantity = this.quantity - itemData.quantity;
              if (newQuantity <= 0) return 'out-of-stock';
              if (newQuantity <= 10) return 'low-stock';
              return 'in-stock';
            }
          }
        },
        { session, new: true }
      );
      console.log(`📦 [ORDER] Inventory updated for item ${itemData.itemId}:`, {
        deducted: itemData.quantity,
        newQuantity: updateResult.quantity,
        newStatus: updateResult.status
      });
    }

    // Create order
    console.log('📝 [ORDER] Creating order document...');
    const order = await Order.create([{
      user: userId,
      items: orderItems,
      subtotal,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'wallet' ? 'completed' : 'pending',
      notes: notes || undefined,
      orderStatus: 'pending'
    }], { session });

    console.log('✅ [ORDER] Order created with ID:', order[0]._id);
    console.log('📋 [ORDER] Order number:', order[0].orderNumber);

    // Create transaction record for wallet payment
    if (paymentMethod === 'wallet') {
      await Transaction.create([{
        user: userId,
        type: 'debit',
        amount: totalAmount,
        balanceAfter: user.walletBalance,
        reference: order[0]._id,
        referenceModel: 'Order',
        description: `Order payment - ${order[0].orderNumber}`,
        paymentMethod: 'wallet',
        status: 'completed',
        metadata: {
          orderNumber: order[0].orderNumber,
          itemsCount: items.length,
          totalAmount
        }
      }], { session });
      console.log('✅ [ORDER] Transaction recorded');
    }

    // Create order confirmation notification
    const notification = await Notification.create([{
      user: userId,
      title: 'Order Placed Successfully!',
      message: `Your order ${order[0].orderNumber} has been placed and is being processed.`,
      type: 'order_update',
      order: order[0]._id,
      metadata: {
        orderNumber: order[0].orderNumber,
        totalAmount: totalAmount,
        itemsCount: items.length
      }
    }], { session });
    console.log('📢 [ORDER] Order confirmation notification created');

    await session.commitTransaction();
    session.endSession();

    console.log('🎉 [ORDER] Transaction committed successfully');

    // Populate order data for response
    const populatedOrder = await Order.findById(order[0]._id)
      .populate('user', 'name email employeeId')
      .populate('items.item', 'name price unit');

    console.log('📤 [ORDER] Sending response...');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder,
      orderNumber: populatedOrder.orderNumber,
      totalAmount: populatedOrder.totalAmount,
      notification: notification[0]
    });

  } catch (error) {
    console.error('❌ [ORDER] Create order error:', error);
    console.error('📞 [ORDER] Error stack:', error.stack);
    
    await session.abortTransaction();
    session.endSession();
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        error: `Invalid ${error.path}: ${error.value}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    console.log(`📥 [ORDER] Fetching orders for user ${userId}`);

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

    console.log(`✅ [ORDER] Found ${orders.length} orders for user ${userId}`);

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
    console.error('❌ [ORDER] Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get order by ID - ✅ FIXED PERMISSION CHECK
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const reqUserId = req.user.userId;
    const userRole = req.user.role;
    
    console.log(`📥 [ORDER] Fetching order ${orderId} for user ${reqUserId} (role: ${userRole})`);

    const order = await Order.findById(orderId)
      .populate('user', 'name email employeeId department')
      .populate('items.item', 'name price image description')
      .populate('cancelledBy', 'name');

    if (!order) {
      console.log(`❌ [ORDER] Order ${orderId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // ✅ FIXED: CORRECT PERMISSION CHECK
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    
    // Convert both to strings for reliable comparison
    const orderUserId = order.user?._id?.toString();
    const stringReqUserId = reqUserId.toString();
    
    // Multiple ways to check ownership
    const isOwner = 
      // Direct string comparison (most reliable)
      orderUserId === stringReqUserId ||
      // Mongoose ObjectId comparison
      order.user?._id?.equals(reqUserId) ||
      // Handle if order.user is string (not populated)
      (typeof order.user === 'string' && order.user === stringReqUserId) ||
      // Extra safety checks
      order.user?.toString() === stringReqUserId;
    
    console.log(`🔐 [ORDER] Permission check:`, {
      isAdminOrManager,
      isOwner,
      orderUserId,
      reqUserId: stringReqUserId,
      allowed: isAdminOrManager || isOwner
    });
    
    if (!isAdminOrManager && !isOwner) {
      console.log(`❌ [ORDER] Access denied for user ${reqUserId} to order ${orderId}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own orders.'
      });
    }

    console.log(`✅ [ORDER] Order ${orderId} fetched successfully`);
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('❌ [ORDER] Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Get all orders (for admin/manager)
exports.getAllOrders = async (req, res) => {
  try {
    console.log('📥 [ORDER] Fetching all orders for admin/manager');
    
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      userId
    } = req.query;

    const query = {};

    if (status) query.orderStatus = status;
    if (userId) query.user = userId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('user', 'name email employeeId department')
      .populate('items.item', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalOrders = await Order.countDocuments(query);

    console.log(`✅ [ORDER] Found ${orders.length} orders`);

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
    console.error('❌ [ORDER] Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const { status, reason } = req.body;
    const orderId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`📥 [ORDER] Updating status for order ${orderId} to ${status} by ${userRole} ${userId}`);

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await session.abortTransaction();
      console.log(`❌ [ORDER] Invalid status: ${status}`);
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      console.log(`❌ [ORDER] Order ${orderId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.orderStatus;
    console.log(`📊 [ORDER] Status update: ${oldStatus} → ${status}`);

    // Handle cancellation
    if (status === 'cancelled' && order.orderStatus !== 'cancelled') {
      console.log('🔄 [ORDER] Processing order cancellation...');
      
      // Restore inventory
      for (const orderItem of order.items) {
        const updateResult = await Inventory.findOneAndUpdate(
          { item: orderItem.item },
          { 
            $inc: { quantity: orderItem.quantity },
            $set: { lastUpdated: new Date() }
          },
          { session, new: true }
        );
        console.log(`📦 [ORDER] Restored ${orderItem.quantity} units for item ${orderItem.item}`);
      }

      // Refund wallet payment
      if (order.paymentMethod === 'wallet' && order.paymentStatus === 'completed') {
        const user = await User.findById(order.user).session(session);
        user.walletBalance += order.totalAmount;
        await user.save({ session });

        console.log(`💰 [ORDER] Refunded ₹${order.totalAmount} to user ${order.user}`);

        // Create refund transaction
        await Transaction.create([{
          user: order.user,
          type: 'credit',
          amount: order.totalAmount,
          balanceAfter: user.walletBalance,
          reference: order._id,
          referenceModel: 'Order',
          description: `Order cancellation refund - ${order.orderNumber}`,
          paymentMethod: 'wallet',
          status: 'completed',
          initiatedBy: userId,
          metadata: {
            orderNumber: order.orderNumber,
            originalAmount: order.totalAmount
          }
        }], { session });
        console.log('✅ [ORDER] Refund transaction recorded');
      }

      order.cancelledAt = new Date();
      order.cancelledBy = userId;
      order.cancellationReason = reason || 'Cancelled by user';
      console.log('📝 [ORDER] Cancellation details recorded');
    }

    // Handle completion
    if (status === 'completed') {
      order.completedAt = new Date();
      order.paymentStatus = 'completed';
      console.log('✅ [ORDER] Order marked as completed');
    }

    order.orderStatus = status;
    await order.save({ session });

    // Create notification for user
    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
      case 'processing':
        notificationTitle = 'Order is Being Processed!';
        notificationMessage = `Your order ${order.orderNumber} is now being processed.`;
        break;
      case 'completed':
        notificationTitle = 'Order Approved & Completed!';
        notificationMessage = `Your order ${order.orderNumber} has been approved and is now completed.`;
        break;
      case 'cancelled':
        notificationTitle = 'Order Cancelled';
        notificationMessage = `Your order ${order.orderNumber} has been cancelled.`;
        if (order.paymentMethod === 'wallet') {
          notificationMessage += ` ₹${order.totalAmount} has been refunded to your wallet.`;
        }
        break;
      default:
        notificationTitle = 'Order Status Updated';
        notificationMessage = `Your order ${order.orderNumber} status has been updated to ${status}.`;
    }

    // Create notification in database
    const notification = await Notification.create([{
      user: order.user,
      title: notificationTitle,
      message: notificationMessage,
      type: 'order_update',
      order: order._id,
      metadata: {
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus: status,
        updatedBy: userId,
        totalAmount: order.totalAmount
      }
    }], { session });

    console.log(`📢 [ORDER] Notification created for user ${order.user}`);

    await session.commitTransaction();
    session.endSession();

    console.log(`🎉 [ORDER] Order ${orderId} status updated to ${status}`);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
      notification: notification[0]
    });

  } catch (error) {
    console.error('❌ [ORDER] Update order status error:', error);
    
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Cancel order - ✅ FIXED PERMISSION CHECK
exports.cancelOrder = async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;
    const orderId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`📥 [ORDER] Cancelling order ${orderId}`);

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      console.log(`❌ [ORDER] Order ${orderId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log(`📊 [ORDER] Current order status: ${order.orderStatus}`);
    
    // ✅ FIXED: BETTER PERMISSION CHECK FOR CANCELLATION
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    const orderUserId = order.user?.toString();
    const stringUserId = userId.toString();
    const isOwner = orderUserId === stringUserId || order.user?.equals(userId);
    
    console.log(`🔐 [ORDER] Cancellation permission check:`, {
      isAdminOrManager,
      isOwner,
      orderUserId,
      reqUserId: stringUserId,
      userRole,
      allowed: isAdminOrManager || isOwner
    });

    // Check if user can cancel this order
    if (!isAdminOrManager && !isOwner) {
      await session.abortTransaction();
      console.log(`❌ [ORDER] Access denied for user ${userId} to cancel order ${orderId}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled') {
      await session.abortTransaction();
      console.log(`❌ [ORDER] Order ${orderId} is already ${order.orderStatus}`);
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.orderStatus}`
      });
    }

    console.log('🔄 [ORDER] Processing cancellation...');

    // Restore inventory
    for (const orderItem of order.items) {
      await Inventory.findOneAndUpdate(
        { item: orderItem.item },
        { 
          $inc: { quantity: orderItem.quantity },
          $set: { lastUpdated: new Date() }
        },
        { session }
      );
      console.log(`📦 [ORDER] Restored ${orderItem.quantity} units for item ${orderItem.item}`);
    }

    // Refund wallet payment
    if (order.paymentMethod === 'wallet' && order.paymentStatus === 'completed') {
      const user = await User.findById(order.user).session(session);
      user.walletBalance += order.totalAmount;
      await user.save({ session });

      console.log(`💰 [ORDER] Refunded ₹${order.totalAmount} to user ${order.user}`);

      // Create refund transaction
      await Transaction.create([{
        user: order.user,
        type: 'credit',
        amount: order.totalAmount,
        balanceAfter: user.walletBalance,
        reference: order._id,
        referenceModel: 'Order',
        description: `Order cancellation refund - ${order.orderNumber}`,
        paymentMethod: 'wallet',
        status: 'completed',
        initiatedBy: userId
      }], { session });
      console.log('✅ [ORDER] Refund transaction recorded');
    }

    order.orderStatus = 'cancelled';
    order.paymentStatus = order.paymentMethod === 'wallet' ? 'refunded' : 'failed';
    order.cancelledAt = new Date();
    order.cancelledBy = userId;
    order.cancellationReason = reason || 'Cancelled by user';

    await order.save({ session });

    // Create cancellation notification
    const notification = await Notification.create([{
      user: order.user,
      title: 'Order Cancelled',
      message: `Your order ${order.orderNumber} has been cancelled${order.paymentMethod === 'wallet' ? ` and ₹${order.totalAmount} has been refunded to your wallet` : ''}.`,
      type: 'order_update',
      order: order._id,
      metadata: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        cancellationReason: order.cancellationReason,
        cancelledBy: userId
      }
    }], { session });
    console.log('📢 [ORDER] Cancellation notification created');

    await session.commitTransaction();
    session.endSession();

    console.log(`🎉 [ORDER] Order ${orderId} cancelled successfully`);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
      notification: notification[0]
    });

  } catch (error) {
    console.error('❌ [ORDER] Cancel order error:', error);
    
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};