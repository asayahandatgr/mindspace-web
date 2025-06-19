import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getArticles } from '../services/articleService'

function Article() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    page: 1
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalArticles: 0
  })

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'stress', label: 'Stress Management' },
    { value: 'anxiety', label: 'Anxiety Relief' },
    { value: 'depression', label: 'Depression Support' },
    { value: 'self-care', label: 'Self Care' },
    { value: 'academic', label: 'Academic Success' },
    { value: 'relationships', label: 'Healthy Relationships' },
    { value: 'other', label: 'Other Topics' }
  ]

  useEffect(() => {
    fetchArticles()
  }, [filters])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const data = await getArticles(filters)
      setArticles(data.articles)
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalArticles: data.totalArticles
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">Mindspace Artikel</h1>
        <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
        Jelajahi Koleksi Artikel dan Sumber Daya Kami untuk Mendukung Perjalanan Kesehatan Mental Anda
        </p>
      </div>

      {/* Filters */}
      <div className="mb-12 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search artikel..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {articles.map(article => (
          <Link
            key={article._id}
            to={`/articles/${article._id}`}
            className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="relative h-40 sm:h-48 overflow-hidden">
              <img
                src={
                  article.imageUrl
                    ? (article.imageUrl.startsWith('http') ? article.imageUrl : `http://localhost:5000${article.imageUrl}`)
                    : 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
                }
                alt={article.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4">
                <span className="inline-block px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-full">
                  {categories.find(c => c.value === article.category)?.label || article.category}
                </span>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-500">
                  {new Date(article.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {article.views} views
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {article.likes.length} likes
                  </span>
                </div>
              </div>
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                {article.title}
              </h2>
              <p className="text-gray-600 line-clamp-3 mb-4 text-xs text-justify sm:text-base">
                {article.content}
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-medium text-indigo-600">
                      {article.author.fullName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {article.author.fullName}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-0">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs sm:text-sm text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {articles.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">No articles found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Article 