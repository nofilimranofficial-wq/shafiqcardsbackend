const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date },
  time: { type: String },
  venue: { type: String },
});

const WebInvitationSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  whatsappNumber: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  brideName: {
    type: String,
    required: true,
    trim: true,
  },
  groomName: {
    type: String,
    required: true,
    trim: true,
  },
  weddingDate: {
    type: Date,
  },
  description: {
    type: String,
    trim: true,
  },
  events: [EventSchema],
  media: {
    type: [String],
    default: [],
  },
  template: {
    type: String,
    default: 'basic',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WebInvitation', WebInvitationSchema);
