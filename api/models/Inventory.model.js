const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    default: 'Main Pantry'
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'expired'],
    default: 'in-stock'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Update item's availability based on inventory - FIXED for Mongoose v7
inventorySchema.pre('save', async function() {
  if (this.quantity <= 0) {
    this.status = 'out-of-stock';
  } else if (this.quantity <= 10) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  
  // Check expiry
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'expired';
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);
