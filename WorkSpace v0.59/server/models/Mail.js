const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  isSpam: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  isTrashed: { type: Boolean, default: false },
  category: { type: String, enum: ['primary', 'social', 'promotions'], default: 'primary' }
});

const Mail = mongoose.model('Mail', emailSchema);

module.exports = Mail;
