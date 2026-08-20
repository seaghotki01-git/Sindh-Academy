const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add email'],
    trim: true
  },
  whatsapp: {
    type: String,
    required: [true, 'Please add WhatsApp number'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please add subject'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please add message content'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
