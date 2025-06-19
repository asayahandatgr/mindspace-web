import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    // Bisa tampilkan spinner atau null
    return <div>Loading...</div>
  }

  if (!user) {
    // Redirect ke Home (bukan Login) agar user bisa melihat konten untuk non-login user
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute 