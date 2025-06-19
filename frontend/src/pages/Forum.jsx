import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { forumService } from '../services/forumService';

function Forum() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newThread, setNewThread] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    isAnonymous: false
  });
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    'all',
    'general',
    'academic',
    'relationships',
    'stress',
    'anxiety',
    'depression',
    'self-care',
    'other'
  ];

  useEffect(() => {
    fetchThreads();
  }, [selectedCategory, searchQuery, currentPage]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await forumService.getAllThreads({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery,
        page: currentPage
      });
      setThreads(response.threads);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch threads. Please try again later.');
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tags = newThread.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await forumService.createThread({
        ...newThread,
        tags
      });
      setNewThread({
        title: '',
        content: '',
        category: '',
        tags: '',
        isAnonymous: false
      });
      setShowNewThreadModal(false);
      fetchThreads();
    } catch (err) {
      setError('Failed to create thread. Please try again.');
      console.error('Error creating thread:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewThread(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      academic: 'bg-blue-100 text-blue-800',
      relationships: 'bg-pink-100 text-pink-800',
      stress: 'bg-orange-100 text-orange-800',
      anxiety: 'bg-yellow-100 text-yellow-800',
      depression: 'bg-purple-100 text-purple-800',
      'self-care': 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Forum Diskusi</h1>
        {user && (
          <button
            onClick={() => setShowNewThreadModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300 w-full sm:w-auto"
          >
            New Thread
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search diskusi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-full"
        />
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Thread</h2>
                <button
                  onClick={() => setShowNewThreadModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newThread.title}
                    onChange={handleChange}
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
                    name="category"
                    value={newThread.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.filter(cat => cat !== 'all').map(category => (
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
                    name="content"
                    value={newThread.content}
                    onChange={handleChange}
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
                    name="tags"
                    value={newThread.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    placeholder="e.g., mental health, stress, anxiety"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    name="isAnonymous"
                    checked={newThread.isAnonymous}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
                    Post anonymously
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewThreadModal(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                  >
                    Create Thread
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Threads List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-8">{error}</div>
      ) : (
        <div className="space-y-4">
          {threads.map(thread => (
            <Link
              key={thread._id}
              to={`/forum/${thread._id}`}
              className="block bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition duration-300"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{thread.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${getCategoryColor(thread.category)}`}>
                      {thread.category}
                    </span>
                    {thread.tags.map((tag, index) => (
                      <span key={index} className="text-sm text-gray-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-left sm:text-right mt-2 sm:mt-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {thread.isAnonymous ? 'Anonymous' : thread.author.fullName}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">{formatDate(thread.createdAt)}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4 line-clamp-2">{thread.content}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{thread.views} views</span>
                  <span>{thread.replies.length} replies</span>
                </div>
                {thread.status !== 'active' && (
                  <span className={`px-2 py-1 rounded-full ${
                    thread.status === 'closed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {thread.status}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center mt-8 space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 w-full sm:w-auto"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 w-full sm:w-auto"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Forum; 