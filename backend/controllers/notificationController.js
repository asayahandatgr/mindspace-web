const { getAllNotifications, markAsRead, markAllAsRead } = require('../services/notificationService');

// Get all notifications for the current user
const getAllNotificationsHandler = async (req, res) => {
  try {
    console.log('Getting all notifications for user:', req.user._id);
    const notifications = await getAllNotifications(req.user._id);
    console.log('Found notifications:', notifications);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Mark a specific notification as read
const markAsReadHandler = async (req, res) => {
  try {
    console.log('Marking notification as read:', req.params.notificationId);
    const notification = await markAsRead(req.params.notificationId);
    if (!notification) {
      console.log('Notification not found:', req.params.notificationId);
      return res.status(404).json({ message: 'Notification not found' });
    }
    console.log('Notification marked as read:', notification);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

// Mark all notifications as read for the current user
const markAllAsReadHandler = async (req, res) => {
  try {
    console.log('Marking all notifications as read for user:', req.user._id);
    await markAllAsRead(req.user._id);
    console.log('All notifications marked as read for user:', req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
  }
};

module.exports = {
  getAllNotifications: getAllNotificationsHandler,
  markAsRead: markAsReadHandler,
  markAllAsRead: markAllAsReadHandler
}; 