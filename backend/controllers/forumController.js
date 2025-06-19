const Forum = require('../models/Forum');
const NotificationService = require('../services/notificationService');

// Get all threads
exports.getAllThreads = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const query = { status: { $ne: 'hidden' } };
    if (category) query.category = category;
    if (search) query.$text = { $search: search };
    const threads = await Forum.find(query)
      .populate('author', 'username fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Forum.countDocuments(query);
    res.json({ threads, currentPage: page, totalPages: Math.ceil(total / limit), totalThreads: total });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching threads', error: error.message });
  }
};

// Get thread by ID
exports.getThreadById = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.id)
      .populate('author', 'username fullName')
      .populate('replies.user', 'username fullName');
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    thread.views += 1;
    await thread.save();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching thread', error: error.message });
  }
};

// Create new thread
exports.createThread = async (req, res) => {
  try {
    const thread = new Forum({ ...req.body, author: req.user._id });
    await thread.save();
    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error creating thread', error: error.message });
  }
};

// Reply to thread
exports.replyToThread = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    
    const reply = {
      user: req.user._id,
      content: req.body.content,
      isAnonymous: req.body.isAnonymous
    };
    
    thread.replies.push(reply);
    await thread.save();

    // Create notification for thread author if the reply is not from the author
    if (thread.author.toString() !== req.user._id.toString()) {
      await NotificationService.createForumReplyNotification(
        thread.author,
        req.user._id,
        thread._id,
        req.body.content
      );
    }

    // Notify all previous repliers in the thread
    const uniqueRepliers = new Set();
    thread.replies.forEach(reply => {
      if (reply.user.toString() !== req.user._id.toString() && 
          reply.user.toString() !== thread.author.toString()) {
        uniqueRepliers.add(reply.user.toString());
      }
    });

    // Send notifications to all previous repliers
    for (const replierId of uniqueRepliers) {
      await NotificationService.createForumReplyNotification(
        replierId,
        req.user._id,
        thread._id,
        req.body.content
      );
    }

    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error replying to thread', error: error.message });
  }
};

// Update thread (author or admin)
exports.updateThread = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    Object.assign(thread, req.body);
    await thread.save();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error updating thread', error: error.message });
  }
};

// Delete thread (author or admin)
exports.deleteThread = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await thread.deleteOne();
    res.json({ message: 'Thread deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting thread', error: error.message });
  }
};

// Moderate thread (admin only)
exports.moderateThread = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    thread.status = req.body.status || thread.status;
    await thread.save();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error moderating thread', error: error.message });
  }
};

// Update reply
exports.updateReply = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const reply = thread.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    if (reply.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    reply.content = req.body.content;
    await thread.save();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error updating reply', error: error.message });
  }
};

// Delete reply
exports.deleteReply = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const reply = thread.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    if (reply.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Use pull to remove the reply
    thread.replies.pull(req.params.replyId);
    await thread.save();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reply', error: error.message });
  }
};

// Like/Unlike reply
exports.likeReply = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const reply = thread.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const likeIndex = reply.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      reply.likes.push(req.user._id);
    } else {
      reply.likes.splice(likeIndex, 1);
    }

    await thread.save();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error liking reply', error: error.message });
  }
};

// Mark reply as solution
exports.markAsSolution = async (req, res) => {
  try {
    const thread = await Forum.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const reply = thread.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    // Toggle solution status
    if (reply.isSolution) {
      // If already marked as solution, unmark it
      reply.isSolution = false;
    } else {
      // If not marked as solution, unmark any existing solution and mark this one
      thread.replies.forEach(r => r.isSolution = false);
      reply.isSolution = true;
    }

    await thread.save();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error marking reply as solution', error: error.message });
  }
}; 