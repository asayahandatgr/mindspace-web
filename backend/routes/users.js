const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { uploadProfile } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Get current user profile
router.get('/me', auth, userController.getProfile);

// Update current user profile
router.put('/me', auth, userController.updateProfile);

// Upload profile picture
router.post('/upload-profile-picture', auth, uploadProfile.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create the URL for the uploaded file
    const fileUrl = `/uploads/profile-pictures/${req.file.filename}`;
    
    // Update user's profile picture in database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: fileUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      // If user not found, delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: fileUrl,
      user
    });
  } catch (error) {
    // If there's an error, delete the uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
});

// Get all admin users
router.get('/admins', auth, userController.getAdmins);

module.exports = router; 