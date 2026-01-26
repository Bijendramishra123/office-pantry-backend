const Notification = require('../models/Notification.model');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, page = 1, unreadOnly = false } = req.query;

    const query = { user: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { 
        read: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.updateMany(
      { user: userId, read: false },
      { 
        read: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications',
      error: error.message
    });
  }
};