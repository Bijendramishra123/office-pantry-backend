const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'WalletRecharge']
  },
  description: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  notes: {
    type: String
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
