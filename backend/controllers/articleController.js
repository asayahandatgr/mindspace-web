const Article = require('../models/Article');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');

// Get all articles
exports.getAllArticles = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const query = { status: 'published' };
    
    if (category) query.category = category;
    
    // Perbaikan untuk fitur search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const articles = await Article.find(query)
      .populate('author', 'username fullName profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Article.countDocuments(query);
    res.json({ articles, currentPage: page, totalPages: Math.ceil(total / limit), totalArticles: total });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
};

// Get single article
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'username fullName profilePicture')
      .populate('comments.user', 'username fullName profilePicture')
      .populate('comments.replies.user', 'username fullName profilePicture');
    if (!article) return res.status(404).json({ message: 'Article not found' });
    article.views += 1;
    await article.save();
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
};

// Create article (admin only)
exports.createArticle = async (req, res) => {
  try {
    const { title, content, category, author } = req.body;
    let imageUrl = '';
    
    if (req.file) {
      imageUrl = `/uploads/articles/${req.file.filename}`;
    }
    
    const article = new Article({
      title,
      content,
      category,
      author: req.user._id, // Use authenticated user as author
      imageUrl
    });
    
    await article.save();
    
    // Populate author info
    await article.populate('author', 'username fullName profilePicture');
    
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update article (admin only)
exports.updateArticle = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle image upload if file is provided
    if (req.file) {
      updateData.imageUrl = `/uploads/articles/${req.file.filename}`;
    }
    
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('author', 'username fullName profilePicture');
    
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error updating article', error: error.message });
  }
};

// Delete article (admin only)
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article', error: error.message });
  }
};

// Add comment to article
exports.addComment = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    
    const comment = {
      user: req.user._id,
      content: req.body.content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    article.comments.push(comment);
    await article.save();

    // Populate user data including profilePicture
    await article.populate([
      { path: 'comments.user', select: 'username fullName profilePicture' },
      { path: 'comments.replies.user', select: 'username fullName profilePicture' }
    ]);

    // Create notification for article author if comment is not from the author
    if (article.author.toString() !== req.user._id.toString()) {
      await NotificationService.createArticleCommentNotification(
        article.author,
        req.user._id,
        article._id,
        article.comments[article.comments.length - 1]._id,
        req.body.content
      );
    }

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Edit comment
exports.editComment = async (req, res) => {
  try {
    const { id: articleId, commentId } = req.params;
    const { content } = req.body;

    if (!articleId || !commentId || !content) {
      return res.status(400).json({ 
        message: 'Parameter tidak lengkap'
      });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan' });
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk mengedit komentar ini' });
    }

    comment.content = content.trim();
    comment.updatedAt = Date.now();
    await article.save();

    await article.populate('comments.user', 'username fullName profilePicture');
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ 
      message: 'Gagal mengedit komentar', 
      error: error.message 
    });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { id: articleId, commentId } = req.params;

    if (!articleId || !commentId) {
      return res.status(400).json({ 
        message: 'Parameter tidak lengkap'
      });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan' });
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    // Check if user is the comment author or admin
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus komentar ini' });
    }

    article.comments.pull(commentId);
    await article.save();

    await article.populate('comments.user', 'username fullName profilePicture');
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ 
      message: 'Gagal menghapus komentar', 
      error: error.message 
    });
  }
};

// Add reply to comment
exports.addReply = async (req, res) => {
  try {
    const { id: articleId, commentId } = req.params;
    const { content } = req.body;

    if (!articleId || !commentId || !content) {
      return res.status(400).json({ 
        message: 'Parameter tidak lengkap'
      });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan' });
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    // Buat reply baru
    const reply = {
      user: req.user._id,
      content: content.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Tambahkan reply ke komentar
    comment.replies.push(reply);
    await article.save();

    // Populate data user untuk reply
    await article.populate([
      { path: 'comments.user', select: 'username fullName profilePicture' },
      { path: 'comments.replies.user', select: 'username fullName profilePicture' }
    ]);

    // Buat notifikasi
    if (comment.user.toString() !== req.user._id.toString()) {
      await NotificationService.createArticleReplyNotification(
        comment.user,
        req.user._id,
        article._id,
        comment._id,
        content
      );
    }

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ 
      message: 'Gagal menambahkan balasan', 
      error: error.message 
    });
  }
};

// Like/Unlike article
exports.toggleLike = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const likeIndex = article.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      article.likes.push(req.user._id);
      
      // Create notification for article author
      if (article.author.toString() !== req.user._id.toString()) {
        await NotificationService.createArticleLikeNotification(
          article.author,
          req.user._id,
          article._id
        );
      }
    } else {
      article.likes.splice(likeIndex, 1);
    }

    await article.save();
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error updating like', error: error.message });
  }
};

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username fullName')
      .populate('article', 'title')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};

// Edit reply
exports.editReply = async (req, res) => {
  try {
    const { id: articleId, commentId, replyId } = req.params;
    const { content } = req.body;

    if (!articleId || !commentId || !replyId || !content) {
      return res.status(400).json({ 
        message: 'Parameter tidak lengkap'
      });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan' });
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Balasan tidak ditemukan' });
    }

    // Check if user is the reply author
    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk mengedit balasan ini' });
    }

    reply.content = content.trim();
    reply.updatedAt = Date.now();
    await article.save();

    await article.populate([
      { path: 'comments.user', select: 'username fullName profilePicture' },
      { path: 'comments.replies.user', select: 'username fullName profilePicture' }
    ]);

    res.json(article);
  } catch (error) {
    res.status(500).json({ 
      message: 'Gagal mengedit balasan', 
      error: error.message 
    });
  }
};

// Delete reply
exports.deleteReply = async (req, res) => {
  try {
    const { id: articleId, commentId, replyId } = req.params;

    if (!articleId || !commentId || !replyId) {
      return res.status(400).json({ 
        message: 'Parameter tidak lengkap'
      });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Artikel tidak ditemukan' });
    }

    const comment = article.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Balasan tidak ditemukan' });
    }

    // Check if user is the reply author or admin
    if (reply.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus balasan ini' });
    }

    comment.replies.pull(replyId);
    await article.save();

    await article.populate([
      { path: 'comments.user', select: 'username fullName profilePicture' },
      { path: 'comments.replies.user', select: 'username fullName profilePicture' }
    ]);

    res.json(article);
  } catch (error) {
    res.status(500).json({ 
      message: 'Gagal menghapus balasan', 
      error: error.message 
    });
  }
}; 