import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { getProfilePictureUrl, getUserInitials, getDisplayName } from '../utils/profileUtils.js'

function Profile() {
  const { user: authUser, updateProfile, refreshUserData } = useAuth()
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    bio: '',
    profilePicture: '',
    createdAt: ''
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState(user)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    const initializeUserData = async () => {
      if (authUser) {
        // Check if user data is complete
        if (!authUser.profilePicture || !authUser.createdAt) {
          // Refresh user data from server
          try {
            const refreshedUser = await refreshUserData()
            if (refreshedUser) {
              setUser(refreshedUser)
              setEditedUser(refreshedUser)
              setPreviewUrl(refreshedUser.profilePicture || '')
            }
          } catch (error) {
            console.error('Error refreshing user data:', error)
            // Use existing data if refresh fails
            setUser(authUser)
            setEditedUser(authUser)
            setPreviewUrl(authUser.profilePicture || '')
          }
        } else {
          setUser(authUser)
          setEditedUser(authUser)
          setPreviewUrl(authUser.profilePicture || '')
        }
      }
    }

    initializeUserData()
  }, [authUser, refreshUserData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL for the selected image
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Validasi data sebelum mengirim
      if (!editedUser.fullName.trim()) {
        throw new Error('Full name is required')
      }

      let profilePictureUrl = editedUser.profilePicture

      // If there's a new file selected, upload it first
      if (selectedFile) {
        try {
          const formData = new FormData()
          formData.append('profilePicture', selectedFile)
          
          const uploadResponse = await api.post('/users/upload-profile-picture', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          
          if (uploadResponse.data.profilePictureUrl) {
            profilePictureUrl = uploadResponse.data.profilePictureUrl
          } else {
            throw new Error('No profile picture URL received from server')
          }
        } catch (uploadError) {
          console.error('Error uploading profile picture:', uploadError)
          throw new Error(uploadError.response?.data?.message || 'Failed to upload profile picture')
        }
      }

      // Update profile using AuthContext
      const updatedUser = await updateProfile({
        fullName: editedUser.fullName.trim(),
        bio: editedUser.bio?.trim() || '',
        profilePicture: profilePictureUrl
      })

      setUser(updatedUser)
      setSuccess('Profile updated successfully')
      setIsEditing(false)
      setSelectedFile(null)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Profile Header */}
      <section className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-200 shadow-lg">
            {previewUrl ? (
              <img 
                src={getProfilePictureUrl(previewUrl)} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <span 
              className={`text-4xl text-indigo-600 ${previewUrl ? 'hidden' : 'flex'} items-center justify-center`}
            >
              {getUserInitials(user)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getDisplayName(user)}</h1>
            <p className="text-gray-600">
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </section>

      {/* Profile Information */}
      <section className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <button
            onClick={() => {
              setIsEditing(!isEditing)
              if (!isEditing) {
                setEditedUser(user)
                setPreviewUrl(user.profilePicture)
                setSelectedFile(null)
              }
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={editedUser.fullName}
              onChange={handleChange}
              disabled={!isEditing}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={editedUser.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={editedUser.bio}
              onChange={handleChange}
              disabled={!isEditing}
              rows="4"
              placeholder="Tell us about yourself..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              onChange={handleFileChange}
              disabled={!isEditing}
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Upload a new profile picture (JPG, PNG, GIF up to 5MB)
            </p>
          </div>

          {isEditing && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      </section>

      {/* Account Actions */}
      <section className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-6">Account Actions</h2>
        <div className="space-y-4">
          <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition duration-300">
            Delete Account
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition duration-300">
            Export Data
          </button>
        </div>
      </section>
    </div>
  )
}

export default Profile 