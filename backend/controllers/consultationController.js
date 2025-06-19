const Consultation = require('../models/Consultation');
const NotificationService = require('../services/notificationService');

// Buat pertanyaan konsultasi (user)
exports.createConsultation = async (req, res) => {
  try {
    const { question, isAnonymous } = req.body;
    const consultation = new Consultation({
      user: req.user._id,
      question,
      isAnonymous: !!isAnonymous,
      messages: [{
        content: question,
        isFromUser: true
      }]
    });
    await consultation.save();
    res.status(201).json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating consultation', error: error.message });
  }
};

// Lihat riwayat konsultasi user (user)
exports.getMyConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ user: req.user._id })
      .populate('user', 'username fullName')
      .populate('admin', 'username fullName')
      .sort({ updatedAt: -1 });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultations', error: error.message });
  }
};

// Lihat semua konsultasi (admin)
exports.getAllConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find()
      .populate('user', 'username fullName')
      .populate('admin', 'username fullName')
      .sort({ updatedAt: -1 });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultations', error: error.message });
  }
};

// Kirim pesan dalam konsultasi
exports.sendMessage = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Cek apakah user memiliki akses ke konsultasi ini
    if (
      consultation.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { content, isFromUser } = req.body;
    
    // Jika admin mengirim pesan pertama kali, set admin field
    if (!isFromUser && !consultation.admin) {
      consultation.admin = req.user._id;
    }

    consultation.messages.push({
      content,
      isFromUser
    });

    // Update status jika admin menjawab
    if (!isFromUser && consultation.status === 'open') {
      consultation.status = 'answered';
    }

    await consultation.save();

    // Create notification for the other party
    if (isFromUser) {
      // If message is from user, notify admin
      if (consultation.admin) {
        await NotificationService.createConsultationMessageNotification(
          consultation.admin,
          consultation.user,
          consultation._id,
          content
        );
      }
    } else {
      // If message is from admin, notify user
      await NotificationService.createConsultationMessageNotification(
        consultation.user,
        consultation.admin,
        consultation._id,
        content
      );
    }

    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Tutup konsultasi (user atau admin)
exports.closeConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    if (
      consultation.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    consultation.status = 'closed';
    await consultation.save();
    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Error closing consultation', error: error.message });
  }
}; 
 