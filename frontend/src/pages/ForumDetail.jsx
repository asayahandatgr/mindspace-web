import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { forumService } from '../services/forumService';

function ForumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editThreadData, setEditThreadData] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchThread();
    }
  }, [id, authLoading]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const data = await forumService.getThreadById(id);
      setThread(data);
      setEditThreadData({
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags.join(', ')
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch thread. Please try again later.');
      console.error('Error fetching thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditThread = async (e) => {
    e.preventDefault();
    try {
      const tags = editThreadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await forumService.updateThread(id, {
        ...editThreadData,
        tags
      });
      setShowEditModal(false);
      // Reload the page by navigating to the same URL
      window.location.href = `/forum/${id}`;
    } catch (err) {
      setError('Failed to update thread. Please try again.');
      console.error('Error updating thread:', err);
    }
  };

  const handleDeleteThread = async () => {
    if (!window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      return;
    }
    try {
      await forumService.deleteThread(id);
      navigate('/forum');
    } catch (err) {
      setError('Failed to delete thread. Please try again.');
      console.error('Error deleting thread:', err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    try {
      await forumService.replyToThread(id, {
        content: reply,
        isAnonymous
      });
      setReply('');
      setIsAnonymous(false);
      fetchThread();
    } catch (err) {
      setError('Failed to post reply. Please try again.');
      console.error('Error posting reply:', err);
    }
  };

  const handleLikeReply = async (replyId) => {
    try {
      await forumService.likeReply(id, replyId);
      fetchThread();
    } catch (err) {
      setError('Failed to like reply. Please try again.');
      console.error('Error liking reply:', err);
    }
  };

  const handleEditReply = async (replyId) => {
    try {
      await forumService.updateReply(id, replyId, editReplyContent);
      setEditingReply(null);
      setEditReplyContent('');
      fetchThread();
    } catch (err) {
      setError('Failed to edit reply. Please try again.');
      console.error('Error editing reply:', err);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return;
    }
    try {
      await forumService.deleteReply(id, replyId);
      fetchThread();
    } catch (err) {
      setError('Failed to delete reply. Please try again.');
      console.error('Error deleting reply:', err);
    }
  };

  const handleMarkAsSolution = async (replyId) => {
    try {
      await forumService.markAsSolution(id, replyId);
      fetchThread();
    } catch (err) {
      setError('Failed to mark reply as solution. Please try again.');
      console.error('Error marking solution:', err);
    }
  };

  const handleModerate = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} this thread?`)) return;
    try {
      await forumService.moderateThread(id, status);
      fetchThread();
    } catch (err) {
      setError('Failed to moderate thread. Please try again.');
      console.error('Error moderating thread:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || authLoading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;
  if (!thread) return <div className="text-center py-8">Thread not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-8">
      {/* Thread Header */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{thread.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                thread.category === 'general' ? 'bg-gray-100 text-gray-800' :
                thread.category === 'academic' ? 'bg-blue-100 text-blue-800' :
                thread.category === 'relationships' ? 'bg-pink-100 text-pink-800' :
                thread.category === 'stress' ? 'bg-orange-100 text-orange-800' :
                thread.category === 'anxiety' ? 'bg-yellow-100 text-yellow-800' :
                thread.category === 'depression' ? 'bg-purple-100 text-purple-800' :
                thread.category === 'self-care' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {thread.category}
              </span>
              {thread.tags.map((tag, index) => (
                <span key={index} className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-left sm:text-right sm:ml-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
              <span className="text-xs sm:text-sm text-gray-500">
                {thread.isAnonymous ? 'Anonymous' : thread.author.fullName}
              </span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span className="text-xs sm:text-sm text-gray-500">{formatDate(thread.createdAt)}</span>
            </div>
            {(user?._id === thread.author._id || user?.role === 'admin') && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3 mt-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Thread
                </button>
                <button
                  onClick={handleDeleteThread}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Thread
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{thread.content}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {thread.views} views
            </span>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {thread.replies.length} replies
            </span>
          </div>
          {user?.role === 'admin' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
              {thread.status === 'active' && (
                <>
                  <button
                    onClick={() => handleModerate('closed')}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close Thread
                  </button>
                  <button
                    onClick={() => handleModerate('hidden')}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    Hide Thread
                  </button>
                </>
              )}
              {thread.status === 'closed' && (
                <button
                  onClick={() => handleModerate('active')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reopen Thread
                </button>
              )}
              {thread.status === 'hidden' && (
                <button
                  onClick={() => handleModerate('active')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Unhide Thread
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Thread Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Thread</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEditThread} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={editThreadData.title}
                    onChange={(e) => setEditThreadData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={editThreadData.category}
                    onChange={(e) => setEditThreadData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    required
                  >
                    <option value="">Select a category</option>
                    {['general', 'academic', 'relationships', 'stress', 'anxiety', 'depression', 'self-care', 'other'].map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    id="content"
                    value={editThreadData.content}
                    onChange={(e) => setEditThreadData(prev => ({ ...prev, content: e.target.value }))}
                    rows="8"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={editThreadData.tags}
                    onChange={(e) => setEditThreadData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    placeholder="e.g., mental health, stress, anxiety"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Replies</h2>
        {thread.replies.map((reply) => (
          <div key={reply._id} className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {reply.isAnonymous ? 'Anonymous' : reply.user.fullName}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">{formatDate(reply.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:space-x-4">
                {user && (
                  <button
                    onClick={() => handleLikeReply(reply._id)}
                    className={`flex items-center space-x-1 ${
                      reply.likes.includes(user._id) ? 'text-red-600' : 'text-gray-500'
                    } hover:text-red-600 transition-colors duration-200`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{reply.likes.length}</span>
                  </button>
                )}
                {user && (user._id === thread.author._id || user.role === 'admin') && (
                  <button
                    onClick={() => handleMarkAsSolution(reply._id)}
                    className={`${
                      reply.isSolution ? 'text-green-600' : 'text-gray-500'
                    } hover:text-green-700 transition-colors duration-200`}
                    title={reply.isSolution ? "Unmark as solution" : "Mark as solution"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 4.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V4.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
                {(user?._id === reply.user._id || user?.role === 'admin') && (
                  <div className="flex items-center space-x-2">
                    {editingReply === reply._id ? (
                      <>
                        <button
                          onClick={() => handleEditReply(reply._id)}
                          className="text-green-600 hover:text-green-700 transition-colors duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEditingReply(null);
                            setEditReplyContent('');
                          }}
                          className="text-gray-600 hover:text-gray-700 transition-colors duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingReply(reply._id);
                            setEditReplyContent(reply.content);
                          }}
                          className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteReply(reply._id)}
                          className="text-red-600 hover:text-red-700 transition-colors duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            {editingReply === reply._id ? (
              <textarea
                value={editReplyContent}
                onChange={(e) => setEditReplyContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                rows="4"
              />
            ) : (
              <div className="relative">
                {reply.isSolution && (
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-green-500 rounded-full"></div>
                )}
                <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                {reply.isSolution && (
                  <div className="mt-2 flex items-center text-green-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Marked as solution</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {user && thread.status === 'active' && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Post a Reply</h2>
          <form onSubmit={handleReply} className="space-y-4">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows="4"
              placeholder="Write your reply..."
              required
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isAnonymous" className="ml-2 block text-xs sm:text-sm text-gray-700">
                Post anonymously
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
            >
              Post Reply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ForumDetail; 