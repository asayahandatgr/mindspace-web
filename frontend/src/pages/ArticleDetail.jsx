import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getArticleById, addComment, editComment, deleteComment, addReply, toggleLike, editReply, deleteReply } from '../services/articleService'
import { getCurrentUser } from '../services/authService'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { getProfilePictureUrl, getUserInitials, getDisplayName } from '../utils/profileUtils.js'

function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [reply, setReply] = useState('')
  const [editingComment, setEditingComment] = useState(null)
  const [editingReply, setEditingReply] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    console.log('Current User from getCurrentUser:', user)
    if (user) {
      setIsAdmin(user.role === 'admin')
    }
    fetchArticle()
  }, [id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getArticleById(id)
      console.log('Article Data:', data)
      console.log('imageUrl:', data.imageUrl)
      setArticle(data)
    } catch (err) {
      console.error('Error fetching article:', err)
      setError(err.message || 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    const user = getCurrentUser()
    if (!user) {
      console.log('No current user found, redirecting to login')
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      const updatedArticle = await toggleLike(id)
      if (updatedArticle) {
        setArticle(prevArticle => ({
          ...prevArticle,
          likes: updatedArticle.likes || []
        }))
      } else {
        throw new Error('Failed to update like status')
      }
    } catch (err) {
      console.error('Error toggling like:', err)
      setError(err.message || 'Failed to update like')
    } finally {
      setLoading(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!currentUser) {
      navigate('/login')
      return
    }
    try {
      const updatedArticle = await addComment(id, comment)
      if (updatedArticle) {
        // Fetch the latest article data to ensure we have the complete comment with user info
        const latestArticle = await getArticleById(id)
        setArticle(latestArticle)
        setComment('')
      } else {
        throw new Error('Failed to add comment')
      }
    } catch (err) {
      console.error('Error adding comment:', err)
      setError(err.message || 'Failed to add comment')
    }
  }

  const handleEditComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const comment = article.comments?.find(c => c._id === editingComment.id);
    
    if (!comment) {
      setError('Komentar tidak ditemukan');
      return;
    }

    // Check if user is the comment author
    if (comment.user._id.toString() !== (currentUser.id || currentUser._id).toString()) {
      setError('Anda tidak memiliki akses untuk mengedit komentar ini');
      return
    }

    try {
      const updatedArticle = await editComment(
        id,
        editingComment.id,
        editingComment.content
      );

      if (updatedArticle) {
        setArticle(prevArticle => ({
          ...prevArticle,
          comments: prevArticle.comments.map(comment => 
            comment._id === editingComment.id 
              ? { ...comment, content: editingComment.content }
              : comment
          )
        }));
        setEditingComment(null);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengedit komentar');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const comment = article.comments?.find(c => c._id === commentId);
    
    if (!comment) {
      setError('Komentar tidak ditemukan');
      return;
    }

    // Check if user is the comment author or admin
    if (!isAdmin && comment.user._id.toString() !== (currentUser.id || currentUser._id).toString()) {
      setError('Anda tidak memiliki akses untuk menghapus komentar ini');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus komentar ini?')) {
      return;
    }

    try {
      const updatedArticle = await deleteComment(id, commentId);

      if (updatedArticle) {
        setArticle(prevArticle => ({
          ...prevArticle,
          comments: prevArticle.comments.filter(comment => comment._id !== commentId)
        }));
      }
    } catch (err) {
      setError(err.message || 'Gagal menghapus komentar');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!reply.trim()) {
      setError('Balasan tidak boleh kosong');
      return;
    }
    try {
      setLoading(true);
      const updatedArticle = await addReply(id, replyingTo, reply);
      if (updatedArticle) {
        // Fetch the latest article data to ensure we have the complete data
        const latestArticle = await getArticleById(id);
        setArticle(latestArticle);
        setReply('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Error adding reply:', err);
      setError(err.message || 'Gagal menambahkan balasan');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReply = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const comment = article.comments?.find(c => c.replies?.some(r => r._id === editingReply.id));
    const reply = comment?.replies?.find(r => r._id === editingReply.id);

    if (!reply) {
      setError('Balasan tidak ditemukan');
      return;
    }

    // Check if user is the reply author
    if (reply.user._id.toString() !== (currentUser.id || currentUser._id).toString()) {
      setError('Anda tidak memiliki akses untuk mengedit balasan ini');
      return;
    }

    try {
      const updatedArticle = await editReply(
        id, // articleId
        comment._id, // commentId
        editingReply.id, // replyId
        editingReply.content // content
      );

      if (updatedArticle) {
        setArticle(prevArticle => ({
          ...prevArticle,
          comments: prevArticle.comments.map(comment => ({
            ...comment,
            replies: comment.replies.map(reply => 
              reply._id === editingReply.id 
                ? { ...reply, content: editingReply.content }
                : reply
            )
          }))
        }));
        setEditingReply(null);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengedit balasan');
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const comment = article.comments?.find(c => c._id === commentId);
    const reply = comment?.replies?.find(r => r._id === replyId);

    if (!reply) {
      setError('Balasan tidak ditemukan');
      return;
    }

    // Check if user is the reply author or admin
    if (!isAdmin && reply.user._id.toString() !== (currentUser.id || currentUser._id).toString()) {
      setError('Anda tidak memiliki akses untuk menghapus balasan ini');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus balasan ini?')) {
      return;
    }

    try {
      const updatedArticle = await deleteReply(id, commentId, replyId);

      if (updatedArticle) {
        setArticle(prevArticle => ({
          ...prevArticle,
          comments: prevArticle.comments.map(comment => ({
            ...comment,
            replies: comment.replies.filter(reply => reply._id !== replyId)
          }))
        }));
      }
    } catch (err) {
      setError(err.message || 'Gagal menghapus balasan');
    }
  };

  const getDefaultImage = (category) => {
    const images = {
      'anxiety': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'depression': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'stress': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'mindfulness': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      'therapy': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop'
    }
    return images[category] || images['mindfulness']
  }

  // Function to render profile picture with fallback
  const renderProfilePicture = (user, size = 'w-8 h-8') => {
    if (!user) {
      return (
        <div className={`${size} rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200`}>
          <span className="text-gray-500 text-sm font-medium">?</span>
        </div>
      )
    }

    const profilePictureUrl = getProfilePictureUrl(user.profilePicture)
    
    return (
      <div className={`${size} rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-gray-200`}>
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt={getDisplayName(user)}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <span 
          className={`text-indigo-600 text-sm font-medium ${profilePictureUrl ? 'hidden' : 'flex'} items-center justify-center`}
        >
          {getUserInitials(user)}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Article not found</h2>
          <p className="mt-2 text-gray-600">The article you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Article Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <img
          src={
            article.imageUrl
              ? (article.imageUrl.startsWith('http') ? article.imageUrl : `http://localhost:5000${article.imageUrl}`)
              : 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?...'
          }
          alt={article.title}
          className="w-full h-40 sm:h-64 object-cover rounded-lg mb-4"
        />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-0">
            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
              {article.category}
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4 sm:text-left">{article.title}</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base text-justify sm:text-left">{article.content}</p>
          
          {/* Article Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 gap-2 sm:gap-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                  article.likes.includes(currentUser?._id)
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>{article.likes.length} likes</span>
              </button>
              <span className="text-xs sm:text-base text-gray-500">{article.views || 0} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-6">Comments ({article.comments?.length || 0})</h2>

        {/* Comment Form */}
        {currentUser && (
          <form onSubmit={handleComment} className="mb-8">
            <div className="flex items-start space-x-2 sm:space-x-3">
              {renderProfilePicture(currentUser, 'w-8 h-8 sm:w-10 sm:h-10')}
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base"
                  rows="3"
                  disabled={loading}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="px-4 sm:px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
                    disabled={loading || !comment.trim()}
                  >
                    {loading ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {article.comments?.map((comment) => (
            <div key={comment._id} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2 sm:gap-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {renderProfilePicture(comment.user, 'w-7 h-7 sm:w-8 sm:h-8')}
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className="font-semibold text-xs sm:text-base">{comment.user?.fullName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {currentUser && comment.user && (
                  (isAdmin || currentUser.id === comment.user._id.toString() || currentUser._id === comment.user._id.toString()) && (
                    <div className="flex space-x-2">
                      {!isAdmin && (
                        <button
                          onClick={() => setEditingComment({ id: comment._id, content: comment.content })}
                          className="text-gray-500 hover:text-blue-600 transition-colors duration-200"
                          title="Edit comment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-gray-500 hover:text-red-600 transition-colors duration-200"
                        title={isAdmin ? "Delete as admin" : "Delete comment"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )
                )}
              </div>
              {editingComment && editingComment.id === comment._id ? (
                <form onSubmit={handleEditComment} className="space-y-4">
                  <textarea
                    value={editingComment.content}
                    onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base"
                    rows="3"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingComment(null)}
                      className="px-3 sm:px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-xs sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 sm:px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-xs sm:text-base"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="mt-2 text-gray-700 text-xs sm:text-base">{comment.content}</p>
                  <div className="mt-4">
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Reply
                    </button>
                  </div>
                  {replyingTo === comment._id && (
                    <form onSubmit={handleReply} className="mt-4 space-y-4">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        {renderProfilePicture(currentUser, 'w-6 h-6')}
                        <div className="flex-1">
                          <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base"
                            rows="2"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReply('');
                          }}
                          className="px-3 sm:px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-xs sm:text-base"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 sm:px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
                          disabled={loading}
                        >
                          {loading ? 'Posting...' : 'Post Reply'}
                        </button>
                      </div>
                    </form>
                  )}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 sm:pl-8">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                          {/* User info section */}
                          <div className="flex items-center mb-2">
                            <div className="flex-shrink-0">
                              {renderProfilePicture(reply.user, 'w-5 h-5 sm:w-6 sm:h-6')}
                            </div>
                            <div className="ml-2">
                              <p className="text-xs sm:text-sm font-medium text-gray-900">{reply.user?.fullName || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          {/* Reply content and actions */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                            <p className="mt-2 text-xs sm:text-sm text-gray-700">{reply.content}</p>
                            {currentUser && reply.user && (
                              (isAdmin || currentUser.id === reply.user._id.toString() || currentUser._id === reply.user._id.toString()) && (
                                <div className="flex space-x-2">
                                  {!isAdmin && (
                                    <button
                                      onClick={() => setEditingReply({ id: reply._id, commentId: comment._id, content: reply.content })}
                                      className="text-gray-500 hover:text-blue-600 transition-colors duration-200"
                                      title="Edit reply"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteReply(comment._id, reply._id)}
                                    className="text-gray-500 hover:text-red-600 transition-colors duration-200"
                                    title={isAdmin ? "Delete as admin" : "Delete reply"}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              )
                            )}
                          </div>

                          {/* Edit form */}
                          {editingReply && editingReply.id === reply._id && (
                            <form onSubmit={handleEditReply} className="mt-4 space-y-4">
                              <textarea
                                value={editingReply.content}
                                onChange={(e) => setEditingReply({ ...editingReply, content: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base"
                                rows="2"
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingReply(null)}
                                  className="px-3 sm:px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-xs sm:text-base"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-3 sm:px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-xs sm:text-base"
                                >
                                  Save
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ArticleDetail 