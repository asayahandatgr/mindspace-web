import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDisplayName } from '../utils/profileUtils.js'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

function Home() {
  const { user } = useAuth()
  const [latestArticles, setLatestArticles] = useState([])
  const [loadingArticles, setLoadingArticles] = useState(false)

  useEffect(() => {
    if (user) {
      // Fetch 3 latest articles
      setLoadingArticles(true)
      api.get('/articles?limit=3')
        .then(res => {
          // Support both { articles: [...] } and [...] response
          const articles = Array.isArray(res.data)
            ? res.data
            : res.data.articles || []
          setLatestArticles(articles)
        })
        .catch(() => setLatestArticles([]))
        .finally(() => setLoadingArticles(false))
    }
  }, [user])

  // Home page for non-logged-in users
  if (!user) {
    return (
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="text-center py-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Your Journey to Better Mental Health Starts Here
            </h1>
            <p className="text-xl text-indigo-100 mb-8">
              Track your mood, journal your thoughts, and access resources to support your mental well-being.
            </p>
            <div className="space-x-4">
              <Link
                to="/register"
                className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-indigo-50 transition duration-300"
              >
                Get Started
              </Link>
              <Link
                to="/articles"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition duration-300"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How We Can Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Artikel</h3>
              <p className="text-gray-600 text-justify">Temukan berbagai artikel informatif dan edukatif tentang kesehatan mental, mulai dari cara mengelola stres, mengenali gangguan kecemasan, hingga tips menjaga keseimbangan emosional.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Forum</h3>
              <p className="text-gray-600 text-justify">Bergabunglah dengan komunitas yang peduli terhadap kesehatan mental. Di forum ini, Anda dapat berbagi pengalaman, bertanya, atau memberikan dukungan kepada sesama anggota. Tempat aman untuk saling mendengarkan dan bertumbuh bersama.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Konsultasi</h3>
              <p className="text-gray-600 text-justify">Dapatkan akses ke layanan konsultasi. Anda bisa membahas masalah pribadi, mendapatkan panduan, dan menemukan solusi yang tepat untuk kondisi mental Anda.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-indigo-50 rounded-3xl py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-gray-600 mb-8">
              Join thousands of others who are taking control of their mental health.
            </p>
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition duration-300"
            >
              Create Your Account
            </Link>
          </div>
        </section>
      </div>
    )
  }

  // Home page for logged-in users
  return (
    <div className="space-y-16">
      {/* Welcome Section */}
      <section className="text-center py-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Welcome back, {getDisplayName(user)}! 👋
          </h1>
          <p className="text-xl text-indigo-100 mb-8 text-center">
          Bagaimana perasaan Anda hari ini? Luangkan waktu sejenak untuk memeriksa diri Anda sendiri.
          </p>
          <div className="flex flex-col gap-4 items-center justify-center md:flex-row md:gap-4 md:items-center md:justify-center">
            <Link
              to="/articles"
              className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-indigo-50 transition duration-300 w-full md:w-auto"
            >
              Jelajahi Artikel
            </Link>
            <Link
              to="/forum"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition duration-300 w-full md:w-auto"
            >
              Forum Diskusi
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Artikel</h3>
            <p className="text-gray-600 text-justify">Jelajahi sumber daya dan kiat kesehatan mental untuk mendukung perjalanan kesejahteraan.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Forum Diskusi</h3>
            <p className="text-gray-600 text-justify">Terhubunglah dengan orang lain di komunitas dan bagikan pengalaman Anda.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Konsultasi</h3>
            <p className="text-gray-600 text-justify">Ajukan pertanyaan kepada profesional kesehatan mental dan dapatkan panduan ahli.</p>
          </div>
        </div>
      </section>

      {/* Article Cards Section (dynamic) */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-2">Mindspace Artikel</h2>
          <p className="text-center text-gray-600 mb-8 text-center">
          Jelajahi Koleksi Artikel dan Sumber Daya Kami untuk Mendukung Perjalanan Kesehatan Mental Anda
          </p>
          {loadingArticles ? (
            <div className="text-center py-8 text-gray-500">Loading articles...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              {latestArticles.length === 0 && (
                <div className="col-span-3 text-center text-gray-400">No articles found.</div>
              )}
              {latestArticles.map(article => (
                <div key={article._id} className="bg-white rounded-xl shadow-md overflow-hidden border flex flex-col hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={
                        article.imageUrl
                          ? (article.imageUrl.startsWith('http') ? article.imageUrl : `http://localhost:5000${article.imageUrl}`)
                          : 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
                      }
                      alt={article.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback jika gambar gagal load
                        e.target.src = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-2 left-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 hover:text-indigo-600 transition-colors duration-300">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm flex-1 line-clamp-3 mb-3">
                      {article.content?.slice(0, 120) || 'No description.'}
                      {article.content && article.content.length > 120 ? '...' : ''}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-indigo-600">
                            {article.author?.fullName?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {article.author?.fullName || 'Anonymous'}
                        </span>
                      </div>
                      <Link 
                        to={`/articles/${article._id}`} 
                        className="text-indigo-600 text-sm font-medium hover:text-indigo-700 hover:underline transition-colors duration-300"
                      >
                        Baca Selengkapnya →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center">
            <Link 
              to="/articles" 
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition duration-300 shadow-md hover:shadow-lg"
            >
              View All Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Daily Wellness Tips Section */}
      <section className="bg-indigo-50 rounded-3xl py-8">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Tips Kesehatan Harian</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Berlatih Pernapasan</h3>
              <p className="text-gray-600 mb-6 text-justify text-lg">
              Tarik napas dalam-dalam sebanyak 5 kali sekarang. Tarik napas selama 4 hitungan, tahan selama 4 hitungan, hembuskan napas selama 4 hitungan.
              Teknik sederhana ini dapat membantu mengurangi stres dan membawa Anda kembali ke masa kini.
              </p>
              <Link
                to="/articles"
                className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition duration-300"
              >
                Pelajari Lebih Banyak Teknik
              </Link>
            </div>
            {/* Card 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Jalan-jalan sebentar</h3>
              <p className="text-gray-600 mb-6 text-justify text-lg">
              Berdirilah perlahan dan berjalan selama lima menit. Gerakan ringan seperti ini mampu membantu melepaskan ketegangan, menyegarkan pikiran, dan mengembalikan fokus Anda pada momen yang sedang terjadi.
              </p>
              <Link
                to="/articles"
                className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition duration-300"
              >
                Tips Kesehatan Lainnya
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Highlights Section */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Sorotan Komunitas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Diskusi Forum Terbaru</h3>
            <p className="text-gray-600 mb-4 text-justify">
            Bergabunglah dalam percakapan di forum komunitas kami. Bagikan pengalaman Anda, ajukan pertanyaan, dan terhubung dengan orang lain yang memiliki pengalaman serupa.
            </p>
            <Link
              to="/forum"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Telusuri Diskusi →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Dukungan Profesional</h3>
            <p className="text-gray-600 mb-4 text-justify">
            Punya pertanyaan tentang kesehatan mental? Tim profesional kami siap membantu.
            Kirimkan pertanyaan Anda secara anonim atau dengan akun Anda.
            </p>
            <Link
              to="/consultations"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ajukan pertanyaan →
            </Link>
          </div>
        </div>
      </section>

      {/* Admin Dashboard Section (for admin users) */}
      {user.role === 'admin' && (
        <section className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h2>
            <p className="text-red-100 mb-8 text-lg">
            Kelola artikel, postingan forum, dan konsultasi pengguna dari Dashboard admin.
            </p>
            <Link
              to="/dashboard"
              className="bg-white text-red-600 px-8 py-3 rounded-full font-semibold hover:bg-red-50 transition duration-300"
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home 