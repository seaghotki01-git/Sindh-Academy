const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a payment gateway or bank name'],
    trim: true
  },
  accountHolderName: {
    type: String,
    required: [true, 'Please add account holder name'],
    trim: true
  },
  accountNumber: {
    type: String,
    required: [true, 'Please add account or wallet number'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add standard enrollment fee amount'],
    default: 5000
  },
  extraDetails: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);
