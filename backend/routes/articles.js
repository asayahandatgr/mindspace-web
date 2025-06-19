const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { auth, isAdmin } = require('../middleware/auth');
const { uploadArticle } = require('../middleware/upload');

// Get all articles
router.get('/', articleController.getAllArticles);

// Get single article
router.get('/:id', articleController.getArticleById);

// Create article (admin only) - with image upload
router.post('/', auth, isAdmin, uploadArticle.single('image'), articleController.createArticle);

// Update article (admin only) - with image upload
router.put('/:id', auth, isAdmin, uploadArticle.single('image'), articleController.updateArticle);

// Delete article (admin only)
router.delete('/:id', auth, isAdmin, articleController.deleteArticle);

// Comment routes
router.post('/:id/comments', auth, articleController.addComment);
router.put('/:id/comments/:commentId', auth, articleController.editComment);
router.delete('/:id/comments/:commentId', auth, articleController.deleteComment);

// Reply routes
router.post('/:id/comments/:commentId/replies', auth, articleController.addReply);
router.put('/:id/comments/:commentId/replies/:replyId', auth, articleController.editReply);
router.delete('/:id/comments/:commentId/replies/:replyId', auth, articleController.deleteReply);

// Like/Unlike article
router.post('/:id/like', auth, articleController.toggleLike);

module.exports = router; 