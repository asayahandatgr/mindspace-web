import axios from 'axios';
import { API_URL } from '../config';

// Add auth token to requests
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const forumService = {
  // Get all threads with optional filters
  getAllThreads: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/forum`, { 
        params,
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single thread by ID
  getThreadById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/forum/${id}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new thread
  createThread: async (threadData) => {
    try {
      const response = await axios.post(`${API_URL}/forum`, threadData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reply to thread
  replyToThread: async (threadId, replyData) => {
    try {
      const response = await axios.post(`${API_URL}/forum/${threadId}/replies`, replyData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update thread
  updateThread: async (threadId, threadData) => {
    try {
      const response = await axios.put(`${API_URL}/forum/${threadId}`, threadData, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete thread
  deleteThread: async (threadId) => {
    try {
      const response = await axios.delete(`${API_URL}/forum/${threadId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update reply
  updateReply: async (threadId, replyId, content) => {
    try {
      const response = await axios.put(`${API_URL}/forum/${threadId}/replies/${replyId}`, 
        { content },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete reply
  deleteReply: async (threadId, replyId) => {
    try {
      const response = await axios.delete(`${API_URL}/forum/${threadId}/replies/${replyId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Like/Unlike reply
  likeReply: async (threadId, replyId) => {
    try {
      const response = await axios.post(`${API_URL}/forum/${threadId}/replies/${replyId}/like`, {}, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark reply as solution
  markAsSolution: async (threadId, replyId) => {
    try {
      const response = await axios.post(`${API_URL}/forum/${threadId}/replies/${replyId}/solution`, {}, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Moderate thread (admin only)
  moderateThread: async (threadId, status) => {
    try {
      const response = await axios.patch(`${API_URL}/forum/${threadId}/moderate`, 
        { status },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export { forumService }; 