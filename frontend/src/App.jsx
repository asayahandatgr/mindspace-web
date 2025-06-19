import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Article from './pages/Article'
import ArticleDetail from './pages/ArticleDetail'
import Forum from './pages/Forum'
import ForumDetail from './pages/ForumDetail'
import Profile from './pages/Profile'
import Consultations from './pages/Consultations'
import AdminConsultations from './pages/AdminConsultations'
import AdminRoute from './components/AdminRoute'
import ConsultationChat from './components/ConsultationChat'

function App() {

  return (
    <AuthProvider>
      <ConsultationChat />
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="container mx-auto px-4 py-8 flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/articles" element={<Article />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/:id" element={<ForumDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/consultations" element={<Consultations />} />
              <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
