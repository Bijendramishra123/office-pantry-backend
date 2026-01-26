const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    enum: ['piece', 'pack', 'bottle', 'can', 'cup', 'bowl'],
    default: 'piece'
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    default: 100,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  vendor: {
    name: String,
    contact: String,
    email: String
  }
}, {
  timestamps: true
});

// Virtual for profit margin
itemSchema.virtual('profitMargin').get(function() {
  if (!this.costPrice) return 0;
  return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Index for search
itemSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Item', itemSchema);
