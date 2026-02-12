// ✅ DNS fix for MongoDB Atlas SRV resolution (IMPORTANT)
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketio = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const itemRoutes = require('./routes/item.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');

// Initialize Express app
const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);

// ✅ Allow multiple frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  process.env.FRONTEND_URL
];

// Initialize Socket.io with CORS configuration
const io = socketio(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected users
const connectedUsers = {};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('authenticate', (userId) => {
    if (userId) {
      connectedUsers[userId] = socket.id;
      socket.join(`user_${userId}`);
      console.log(`✅ User ${userId} authenticated for real-time updates`);

      socket.emit('connected', {
        message: 'Connected to real-time notifications',
        userId
      });
    }
  });

  socket.on('order_status_update', (data) => {
    const { orderId, userId, status, orderNumber } = data;

    if (userId) {
      io.to(`user_${userId}`).emit('order_updated', {
        orderId,
        orderNumber,
        status,
        message: `Your order ${orderNumber} has been ${status}`,
        timestamp: new Date().toISOString()
      });
      console.log(`📢 Sent order update to user ${userId} for order ${orderNumber}`);
    }
  });

  socket.on('send_notification', (data) => {
    const { userId, title, message, type } = data;

    if (userId) {
      io.to(`user_${userId}`).emit('new_notification', {
        title,
        message,
        type,
        timestamp: new Date().toISOString()
      });
      console.log(`📢 Notification sent to user ${userId}: ${title}`);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of Object.entries(connectedUsers)) {
      if (socketId === socket.id) {
        delete connectedUsers[userId];
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('socketio', io);

// ✅ Updated CORS middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Office Pantry Management System API is running',
    timestamp: new Date().toISOString(),
    connectedUsers: Object.keys(connectedUsers).length,
    socketConnections: io.engine.clientsCount
  });
});

// Socket.io status endpoint
app.get('/api/socket-status', (req, res) => {
  res.status(200).json({
    status: 'OK',
    connectedUsers: Object.keys(connectedUsers),
    totalConnections: Object.keys(connectedUsers).length,
    socketConnections: io.engine.clientsCount
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Socket.io server initialized`);
  console.log(`🔌 Real-time notifications: Enabled`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Socket status: http://localhost:${PORT}/api/socket-status`);
  console.log(`🔗 CORS enabled for:`, allowedOrigins);
});

module.exports = { app, server, io };
