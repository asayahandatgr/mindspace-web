const Notification = require('../models/Notification');

// Create notification for article comment
const createArticleCommentNotification = async (recipientId, senderId, articleId, commentId, content) => {
  console.log('Creating article comment notification:', {
    recipientId,
    senderId,
    articleId,
    commentId,
    content
  });
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: 'comment',
    article: articleId,
    comment: commentId,
    content: content
  });
  console.log('Created notification:', notification);
  return notification;
};

// Create notification for article comment reply
const createArticleReplyNotification = async (recipientId, senderId, articleId, commentId, content) => {
  console.log('Creating article reply notification:', {
    recipientId,
    senderId,
    articleId,
    commentId,
    content
  });
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: 'reply',
    article: articleId,
    comment: commentId,
    content: content
  });
  console.log('Created notification:', notification);
  return notification;
};

// Create notification for forum comment
const createForumCommentNotification = async (recipientId, senderId, forumId, content) => {
  console.log('Creating forum comment notification:', {
    recipientId,
    senderId,
    forumId,
    content
  });
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: 'forum_comment',
    forum: forumId,
    content: content
  });
  console.log('Created notification:', notification);
  return notification;
};

// Create notification for forum reply
const createForumReplyNotification = async (recipientId, senderId, forumId, content) => {
  console.log('Creating forum reply notification:', {
    recipientId,
    senderId,
    forumId,
    content
  });
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: 'forum_reply',
    forum: forumId,
    content: content
  });
  console.log('Created notification:', notification);
  return notification;
};

// Create notification for consultation message
const createConsultationMessageNotification = async (recipientId, senderId, consultationId, content) => {
  console.log('Creating consultation message notification:', {
    recipientId,
    senderId,
    consultationId,
    content
  });
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: 'consultation_message',
    consultation: consultationId,
    content: content
  });
  console.log('Created notification:', notification);
  return notification;
};

// Create notification for article like
const createArticleLikeNotification = async (recipientId, senderId, articleId) => {
  console.log('Creating article like notification:', {
    recipientId,
    senderId,
    articleId
  });
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: 'like',
    article: articleId
  });
  console.log('Created notification:', notification);
  return notification;
};

// Get all notifications for a user
const getAllNotifications = async (userId) => {
  console.log('Getting all notifications for user:', userId);
  try {
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'username fullName')
      .populate('article', 'title')
      .populate('forum', 'title')
      .populate('consultation', 'title');
    console.log('Found notifications:', notifications);
    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  console.log('Marking notification as read:', notificationId);
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  )
  .populate('sender', 'username fullName')
  .populate('article', 'title')
  .populate('forum', 'title')
  .populate('consultation');
  console.log('Updated notification:', notification);
  return notification;
};

// Mark all notifications as read for a user
const markAllAsRead = async (userId) => {
  console.log('Marking all notifications as read for user:', userId);
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  console.log('Update result:', result);
  return result;
};

module.exports = {
  createArticleCommentNotification,
  createArticleReplyNotification,
  createForumCommentNotification,
  createForumReplyNotification,
  createConsultationMessageNotification,
  createArticleLikeNotification,
  getAllNotifications,
  markAsRead,
  markAllAsRead
}; 