import { api } from './api';

export const getArticles = async (params = {}) => {
  try {
    const response = await api.get('/articles', { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch articles');
    }
    throw new Error('Network error occurred');
  }
};

export const getArticleById = async (id) => {
  try {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch article');
    }
    throw new Error('Network error occurred');
  }
};

export const createArticle = async (articleData) => {
  try {
    const response = await api.post('/articles', articleData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create article');
    }
    throw new Error('Network error occurred');
  }
};

export const updateArticle = async (id, articleData) => {
  try {
    const response = await api.put(`/articles/${id}`, articleData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update article');
    }
    throw new Error('Network error occurred');
  }
};

export const deleteArticle = async (id) => {
  try {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete article');
    }
    throw new Error('Network error occurred');
  }
};

export const addComment = async (articleId, content) => {
  try {
    const response = await api.post(`/articles/${articleId}/comments`, { content });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to add comment');
    }
    throw new Error('Network error occurred');
  }
};

export const editComment = async (articleId, commentId, content) => {
  try {
    // Validasi parameter
    if (!articleId || !commentId) {
      throw new Error('ID artikel dan ID komentar diperlukan');
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      throw new Error('Konten komentar harus berupa teks dan tidak boleh kosong');
    }

    // Log untuk debugging
    console.log('Mengirim request edit komentar:', {
      url: `/articles/${articleId}/comments/${commentId}`,
      data: { content: content.trim() }
    });

    // Kirim request ke backend
    const response = await api.put(`/articles/${articleId}/comments/${commentId}`, {
      content: content.trim()
    });

    // Log response
    console.log('Response edit komentar:', response.data);

    return response.data;
  } catch (error) {
    // Log error detail
    console.error('Error saat mengedit komentar:', {
      error: error,
      response: error.response?.data,
      status: error.response?.status,
      requestData: {
        articleId,
        commentId,
        content
      }
    });
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Gagal mengedit komentar');
  }
};

export const deleteComment = async (articleId, commentId) => {
  try {
    console.log('Mencoba menghapus komentar:', {
      articleId,
      commentId
    });

    if (!articleId || !commentId) {
      throw new Error('Parameter tidak lengkap');
    }

    const response = await api.delete(`/articles/${articleId}/comments/${commentId}`);
    console.log('Response hapus komentar:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saat menghapus komentar:', {
      error: error,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response) {
      throw new Error(error.response.data.message || 'Gagal menghapus komentar');
    }
    throw error;
  }
};

export const addReply = async (articleId, commentId, content) => {
  try {
    if (!articleId || !commentId || !content) {
      throw new Error('Parameter tidak lengkap');
    }

    const response = await api.post(`/articles/${articleId}/comments/${commentId}/replies`, {
      content: content.trim()
    });

    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Gagal menambahkan balasan');
  }
};

export const toggleLike = async (articleId) => {
  try {
    const response = await api.post(`/articles/${articleId}/like`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to toggle like');
    }
    throw new Error('Network error occurred');
  }
};

export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications/all');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch notifications');
    }
    throw new Error('Network error occurred');
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/articles/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to mark notification as read');
    }
    throw new Error('Network error occurred');
  }
};

export const editReply = async (articleId, commentId, replyId, content) => {
  try {
    if (!articleId || !commentId || !replyId || !content) {
      throw new Error('Parameter tidak lengkap');
    }

    const response = await api.put(
      `/articles/${articleId}/comments/${commentId}/replies/${replyId}`,
      { content: content.trim() }
    );

    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Gagal mengedit balasan');
  }
};

export const deleteReply = async (articleId, commentId, replyId) => {
  try {
    if (!articleId || !commentId || !replyId) {
      throw new Error('Parameter tidak lengkap');
    }

    const response = await api.delete(
      `/articles/${articleId}/comments/${commentId}/replies/${replyId}`
    );

    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Gagal menghapus balasan');
  }
}; 