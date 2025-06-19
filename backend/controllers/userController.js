const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
  try {
    // Log untuk debugging
    console.log('User ID:', req.user._id);
    console.log('Request body:', req.body);

    const allowedUpdates = ['fullName', 'bio', 'profilePicture'];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    // Gunakan findByIdAndUpdate untuk menghindari race condition
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Get all admin users
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('_id username fullName email')
      .sort({ fullName: 1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins', error: error.message });
  }
}; 