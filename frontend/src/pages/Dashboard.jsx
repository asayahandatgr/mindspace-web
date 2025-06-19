import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('articles')
  const [articles, setArticles] = useState([])
  const [forumPosts, setForumPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [isEditingForum, setIsEditingForum] = useState(false)
  const [editingForum, setEditingForum] = useState(null)
  const [lastFetchTime, setLastFetchTime] = useState(Date.now())
  const POLLING_INTERVAL = 10000 // 10 seconds

  // Form states
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'stress',
    tags: [],
    imageUrl: '',
    status: 'published'
  })

  const [forumForm, setForumForm] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [],
    isAnonymous: false
  })

  // Add new state for image file
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  // Tambahkan state untuk validasi
  const [formErrors, setFormErrors] = useState({})

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSuccess('') // Clear success message when switching tabs
    setError('') // Clear error message when switching tabs
  }

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }

    fetchData()

    // Set up polling for new data
    const pollingInterval = setInterval(() => {
      fetchData()
    }, POLLING_INTERVAL)

    return () => clearInterval(pollingInterval)
  }, [user, navigate])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Fetch articles
      const articlesRes = await api.get('/articles')
      const articlesData = Array.isArray(articlesRes.data) ? articlesRes.data : 
                          articlesRes.data.articles || articlesRes.data.data || []
      setArticles(articlesData)

      // Fetch forum posts with latest first
      const forumRes = await api.get('/forum', {
        params: {
          sort: 'createdAt',
          order: 'desc'
        }
      })
      const forumData = Array.isArray(forumRes.data) ? forumRes.data : 
                       forumRes.data.threads || forumRes.data.data || []
      
      // Update forum posts and check for new posts
      setForumPosts(prevPosts => {
        const newPosts = forumData.filter(newPost => 
          !prevPosts.some(prevPost => prevPost._id === newPost._id)
        )
        
        if (newPosts.length > 0 && activeTab === 'forum') {
          // Only show success message if we're on the forum tab
          setSuccess(`New ${newPosts.length} forum post${newPosts.length > 1 ? 's' : ''} added`)
        }
        
        return forumData
      })

      setLastFetchTime(Date.now())

    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error.response?.data?.message || 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi validasi untuk artikel
  const validateArticleForm = () => {
    const errors = {}
    
    if (!articleForm.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!articleForm.content.trim()) {
      errors.content = 'Content is required'
    }
    
    if (!articleForm.category) {
      errors.category = 'Category is required'
    }
    
    // Optional: validasi panjang konten
    if (articleForm.content.trim().length < 50) {
      errors.content = 'Content must be at least 50 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Fungsi validasi untuk forum
  const validateForumForm = () => {
    const errors = {}
    
    if (!forumForm.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!forumForm.content.trim()) {
      errors.content = 'Content is required'
    }
    
    if (!forumForm.category) {
      errors.category = 'Category is required'
    }
    
    // Optional: validasi panjang konten
    if (forumForm.content.trim().length < 20) {
      errors.content = 'Content must be at least 20 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleArticleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      const response = await api.post('/articles', articleForm)
      const newArticle = response.data.article || response.data.data || response.data
      setArticles(prev => [...prev, newArticle])
      setArticleForm({ title: '', content: '', category: 'stress', tags: [], imageUrl: '', status: 'published' })
    } catch (error) {
      console.error('Error creating article:', error)
      setError(error.response?.data?.message || 'Failed to create article')
    }
  }

  const handleForumSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setFormErrors({})

    // Validasi form
    if (!validateForumForm()) {
      setError('Please fill in all required fields correctly')
      return
    }

    try {
      const response = await api.post('/forum', forumForm)
      
      if (response.data) {
        setForumPosts(prev => [response.data, ...prev])
        setForumForm({
          title: '',
          content: '',
          category: 'general',
          tags: [],
          isAnonymous: false
        })
        setSuccess('Forum post created successfully')
      }
    } catch (error) {
      console.error('Error creating forum post:', error)
      setError(error.response?.data?.message || 'Failed to create forum post')
    }
  }

  const handleDelete = async (type, id) => {
    try {
      setError('')
      await api.delete(`/${type}/${id}`)
      if (type === 'articles') {
        setArticles(prev => prev.filter(article => article._id !== id))
      } else {
        setForumPosts(prev => prev.filter(post => post._id !== id))
      }
    } catch (error) {
      console.error(`Error deleting ${type.slice(0, -1)}:`, error)
      setError(error.response?.data?.message || `Failed to delete ${type.slice(0, -1)}`)
    }
  }

  const handleCreateArticle = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setFormErrors({})

    // Validasi form
    if (!validateArticleForm()) {
      setError('Please fill in all required fields correctly')
      return
    }

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('title', articleForm.title.trim())
      formData.append('content', articleForm.content.trim())
      formData.append('category', articleForm.category)
      formData.append('tags', JSON.stringify(articleForm.tags || []))
      formData.append('status', 'published')
      
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      const response = await api.post('/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data) {
        setArticles(prev => [response.data, ...prev])
        setArticleForm({
          title: '',
          content: '',
          category: 'stress',
          tags: [],
          imageUrl: '',
          status: 'published'
        })
        setSelectedImage(null)
        setImagePreview('')
        setSuccess('Article created successfully')
      }
    } catch (error) {
      console.error('Error creating article:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error creating article'
      setError(errorMessage)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditArticle = (article) => {
    setIsEditing(true)
    setEditingArticle(article)
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      imageUrl: article.imageUrl || '',
      status: article.status || 'published'
    })
  }

  const handleUpdateArticle = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await api.put(`/articles/${editingArticle._id}`, articleForm)
      
      if (response.data) {
        setArticles(prev => prev.map(article => 
          article._id === editingArticle._id ? response.data : article
        ))
        setSuccess('Article updated successfully')
        setIsEditing(false)
        setEditingArticle(null)
        setArticleForm({
          title: '',
          content: '',
          category: 'stress',
          tags: [],
          imageUrl: '',
          status: 'published'
        })
      }
    } catch (error) {
      console.error('Error updating article:', error)
      setError(error.response?.data?.message || 'Failed to update article')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingArticle(null)
    setArticleForm({
      title: '',
      content: '',
      category: 'stress',
      tags: [],
      imageUrl: '',
      status: 'published'
    })
  }

  const handleEditForum = (forum) => {
    setIsEditingForum(true)
    setEditingForum(forum)
    setForumForm({
      title: forum.title,
      content: forum.content,
      category: forum.category,
      tags: forum.tags || [],
      isAnonymous: forum.isAnonymous || false
    })
  }

  const handleUpdateForum = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const response = await api.put(`/forum/${editingForum._id}`, forumForm)
      
      if (response.data) {
        setForumPosts(prev => prev.map(post => 
          post._id === editingForum._id ? response.data : post
        ))
        setSuccess('Forum post updated successfully')
        setIsEditingForum(false)
        setEditingForum(null)
        setForumForm({
          title: '',
          content: '',
          category: 'general',
          tags: [],
          isAnonymous: false
        })
      }
    } catch (error) {
      console.error('Error updating forum post:', error)
      setError(error.response?.data?.message || 'Failed to update forum post')
    }
  }

  const handleCancelEditForum = () => {
    setIsEditingForum(false)
    setEditingForum(null)
    setForumForm({
      title: '',
      content: '',
      category: 'general',
      tags: [],
      isAnonymous: false
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Last Updated Time */}
      <div className="text-xs sm:text-sm text-gray-500 mb-4">
        Last updated: {new Date(lastFetchTime).toLocaleTimeString()}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8">
          <button
            onClick={() => handleTabChange('articles')}
            className={`${
              activeTab === 'articles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm`}
          >
            Articles
          </button>
          <button
            onClick={() => handleTabChange('forum')}
            className={`${
              activeTab === 'forum'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm`}
          >
            Forum Posts
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Create/Edit Form */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-lg sm:text-xl font-semibold mb-6">
            {activeTab === 'articles' 
              ? (isEditing ? 'Edit Article' : 'Create New Article')
              : (isEditingForum ? 'Edit Forum Post' : 'Create New Forum Post')}
          </h2>
          <form onSubmit={activeTab === 'articles' 
            ? (isEditing ? handleUpdateArticle : handleCreateArticle) 
            : (isEditingForum ? handleUpdateForum : handleForumSubmit)} 
            className="space-y-4">
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={activeTab === 'articles' ? articleForm.title : forumForm.title}
                onChange={(e) => {
                  if (activeTab === 'articles') {
                    setArticleForm({ ...articleForm, title: e.target.value })
                  } else {
                    setForumForm({ ...forumForm, title: e.target.value })
                  }
                  // Clear error when user starts typing
                  if (formErrors.title) {
                    setFormErrors(prev => ({ ...prev, title: '' }))
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base ${
                  formErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                required
              />
              {formErrors.title && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={activeTab === 'articles' ? articleForm.category : forumForm.category}
                onChange={(e) => {
                  if (activeTab === 'articles') {
                    setArticleForm({ ...articleForm, category: e.target.value })
                  } else {
                    setForumForm({ ...forumForm, category: e.target.value })
                  }
                  // Clear error when user selects
                  if (formErrors.category) {
                    setFormErrors(prev => ({ ...prev, category: '' }))
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base ${
                  formErrors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                required
              >
                <option value="">Select a category</option>
                {activeTab === 'articles' ? (
                  <>
                    <option value="stress">Stress</option>
                    <option value="anxiety">Anxiety</option>
                    <option value="depression">Depression</option>
                    <option value="self-care">Self Care</option>
                    <option value="academic">Academic</option>
                    <option value="relationships">Relationships</option>
                    <option value="other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="relationships">Relationships</option>
                    <option value="stress">Stress</option>
                    <option value="anxiety">Anxiety</option>
                    <option value="depression">Depression</option>
                    <option value="self-care">Self Care</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
              {formErrors.category && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.category}</p>
              )}
            </div>

            {activeTab === 'articles' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Article Image <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-base"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'forum' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={forumForm.isAnonymous}
                  onChange={(e) => setForumForm({ ...forumForm, isAnonymous: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isAnonymous" className="ml-2 block text-xs sm:text-sm text-gray-900">
                  Post anonymously
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={activeTab === 'articles' ? articleForm.content : forumForm.content}
                onChange={(e) => {
                  if (activeTab === 'articles') {
                    setArticleForm({ ...articleForm, content: e.target.value })
                  } else {
                    setForumForm({ ...forumForm, content: e.target.value })
                  }
                  // Clear error when user starts typing
                  if (formErrors.content) {
                    setFormErrors(prev => ({ ...prev, content: '' }))
                  }
                }}
                rows="6"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-base ${
                  formErrors.content ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                required
                placeholder={activeTab === 'articles' ? 'Write your article content here (minimum 50 characters)...' : 'Write your forum post content here (minimum 20 characters)...'}
              />
              {formErrors.content && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.content}</p>
              )}
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {activeTab === 'articles' ? 'Minimum 50 characters' : 'Minimum 20 characters'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : (activeTab === 'articles'
                  ? (isEditing ? 'Update Article' : 'Create Article')
                  : (isEditingForum ? 'Update Forum Post' : 'Create Forum Post'))}
              </button>
              {(isEditing || isEditingForum) && (
                <button
                  type="button"
                  onClick={activeTab === 'articles' ? handleCancelEdit : handleCancelEditForum}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-300 text-xs sm:text-base"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-lg sm:text-xl font-semibold mb-6">
            {activeTab === 'articles' ? 'Articles' : 'Forum Posts'}
          </h2>
          <div className="space-y-4">
            {(activeTab === 'articles' ? articles : forumPosts).map((item) => (
              <div key={item._id} className="border rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Category: {item.category}
                      {activeTab === 'forum' && item.isAnonymous && (
                        <span className="ml-2 text-indigo-600">(Anonymous)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(item.createdAt).toLocaleString()}
                      {item.author && (
                        <span className="ml-2">
                          by {item.author.fullName || item.author.username}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => activeTab === 'articles' 
                        ? handleEditArticle(item) 
                        : handleEditForum(item)}
                      className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-base"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(activeTab, item._id)}
                      className="text-red-600 hover:text-red-700 text-xs sm:text-base"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-gray-600 line-clamp-2 text-xs sm:text-base">{item.content}</p>
              </div>
            ))}
            {(activeTab === 'articles' ? articles : forumPosts).length === 0 && (
              <p className="text-gray-500 text-center py-4 text-xs sm:text-base">
                No {activeTab === 'articles' ? 'articles' : 'forum posts'} found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 