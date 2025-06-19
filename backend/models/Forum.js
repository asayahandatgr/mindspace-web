const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'academic', 'relationships', 'stress', 'anxiety', 'depression', 'self-care', 'other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'hidden'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isSolution: {
      type: Boolean,
      default: false
    }
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add text index for search functionality
forumSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Forum = mongoose.model('Forum', forumSchema);

module.exports = Forum; 