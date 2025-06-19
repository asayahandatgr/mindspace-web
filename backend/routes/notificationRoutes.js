const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getAllNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

// Get all notifications for the current user
router.get('/all', auth, getAllNotifications);

// Mark a specific notification as read
router.patch('/:notificationId/read', auth, markAsRead);

// Mark all notifications as read for the current user
router.patch('/read-all', auth, markAllAsRead);

module.exports = router; 