const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const forumController = require('../controllers/forumController');

// Get all forum threads
router.get('/', forumController.getAllThreads);

// Get single thread by ID
router.get('/:id', forumController.getThreadById);

// Create new thread
router.post('/', auth, forumController.createThread);

// Reply to a thread
router.post('/:id/replies', auth, forumController.replyToThread);

// Update thread (admin or author)
router.put('/:id', auth, forumController.updateThread);

// Delete thread (admin or author)
router.delete('/:id', auth, forumController.deleteThread);

// Moderate (hide/close) thread (admin only)
router.patch('/:id/moderate', auth, isAdmin, forumController.moderateThread);

// Reply routes
router.put('/:threadId/replies/:replyId', auth, forumController.updateReply);
router.delete('/:threadId/replies/:replyId', auth, forumController.deleteReply);
router.post('/:threadId/replies/:replyId/like', auth, forumController.likeReply);
router.post('/:threadId/replies/:replyId/solution', auth, forumController.markAsSolution);

module.exports = router; 