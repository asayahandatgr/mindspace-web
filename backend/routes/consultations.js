const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const consultationController = require('../controllers/consultationController');

// Buat pertanyaan konsultasi (user)
router.post('/', auth, consultationController.createConsultation);

// Lihat riwayat konsultasi user (user)
router.get('/my', auth, consultationController.getMyConsultations);

// Lihat semua konsultasi (admin)
router.get('/', auth, isAdmin, consultationController.getAllConsultations);

// Kirim pesan dalam konsultasi
router.post('/:id/messages', auth, consultationController.sendMessage);

// Tutup konsultasi (user atau admin)
router.patch('/:id/close', auth, consultationController.closeConsultation);

module.exports = router; 