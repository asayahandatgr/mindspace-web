import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationDropdown from './NotificationDropdown'
import { useState, useEffect } from 'react'
import { getProfilePictureData } from "../utils/profileUtils.js";

function Navbar() {
  const { user, logout, refreshUserData } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const ensureCompleteUserData = async () => {
      if (user && (!user.profilePicture || !user.createdAt)) {
        try {
          await refreshUserData()
        } catch (error) {
          console.error('Error refreshing user data in Navbar:', error)
        }
      }
    }

    ensureCompleteUserData()
  }, [user, refreshUserData])

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    const userType = user.role === 'admin' ? 'Admin' : 'Student'
    const confirmMessage = user.role === 'admin'
      ? 'Are you sure you want to logout? This will end your admin session.'
      : 'Are you sure you want to logout? You will need to login again to access your account.'

    if (window.confirm(confirmMessage)) {
      logout()
      navigate('/')
      alert(`${userType} logged out successfully!`)
    }
  }

  const profileData = getProfilePictureData(user)

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">MindSpace</span>
            </Link>
          </div>

          {/* Mobile Left Section: Notification + Hamburger */}
          <div className="md:hidden flex items-center space-x-4">
            {user && <NotificationDropdown />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="md:flex md:space-x-8">
              <Link to="/" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/') ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'}`}>
                Home
              </Link>
              <Link to="/articles" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/articles') ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'}`}>
                Articles
              </Link>
              <Link to="/forum" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/forum') ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'}`}>
                Forum
              </Link>
            </div>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/dashboard" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/dashboard') ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'}`}>
                    Dashboard
                  </Link>
                )}

                <NotificationDropdown />

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                      {profileData.hasImage ? (
                        <img
                          src={profileData.url}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : (
                        <div className="bg-gray-300 text-gray-700 flex items-center justify-center rounded-full w-8 h-8">
                          {profileData.initials}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {user.fullName || user.username || 'User'}
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className={`block px-4 py-2 text-sm ${isActive('/profile') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          handleLogout()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/login') ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'}`}>
                  Login
                </Link>
                <Link to="/register" className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${isActive('/register') ? 'bg-indigo-700 text-white shadow-lg' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'}`}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col space-y-3 px-4 pb-4 bg-white shadow-md animate-slide-down">
            <Link to="/" className="text-sm text-gray-700 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/articles" className="text-sm text-gray-700 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>Articles</Link>
            <Link to="/forum" className="text-sm text-gray-700 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>Forum</Link>
            {user?.role === 'admin' && (
              <Link to="/dashboard" className="text-sm text-gray-700 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
            )}
            {user ? (
              <>
                <Link to="/profile" className="text-sm text-gray-700 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>Profile Settings</Link>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false) }} className="text-sm text-red-600 hover:text-red-800 text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-700 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                <Link to="/register" className="text-sm text-gray-700 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
