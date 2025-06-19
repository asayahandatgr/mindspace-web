import { api } from './api';

export const consultationService = {
  // Create a new consultation
  createConsultation: async (data) => {
    const response = await api.post('/consultations', data);
    return response.data;
  },

  // Get user's consultations
  getMyConsultations: async () => {
    const response = await api.get('/consultations/my');
    return response.data;
  },

  // Get all consultations (admin only)
  getAllConsultations: async () => {
    const response = await api.get('/consultations');
    return response.data;
  },

  // Send a message in a consultation
  sendMessage: async (id, data) => {
    const response = await api.post(`/consultations/${id}/messages`, data);
    return response.data;
  },

  // Answer a consultation (admin only)
  answerConsultation: async (id, data) => {
    const response = await api.post(`/consultations/${id}/answer`, data);
    return response.data;
  },

  // Close a consultation
  closeConsultation: async (id) => {
    const response = await api.patch(`/consultations/${id}/close`);
    return response.data;
  },

  // Get all admin users
  getAdmins: async () => {
    const response = await api.get('/users/admins');
    return response.data;
  },

  // Get single consultation
  getConsultation: async (id) => {
    const response = await api.get(`/consultations/${id}`);
    return response.data;
  }
}; 