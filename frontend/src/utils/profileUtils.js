// Helper function to get profile picture URL
export const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null
  
  // If it's already a full URL, return as is
  if (profilePicture.startsWith('http')) {
    return profilePicture
  }
  
  // If it's a relative path, construct the full URL
  if (profilePicture.startsWith('/uploads/')) {
    return `http://localhost:5000${profilePicture}`
  }
  
  return profilePicture
}

// Helper function to get user initials
export const getUserInitials = (user) => {
  if (!user) return 'U'
  
  const fullName = user.fullName || ''
  const username = user.username || ''
  
  if (fullName) {
    return fullName.charAt(0).toUpperCase()
  }
  
  if (username) {
    return username.charAt(0).toUpperCase()
  }
  
  return 'U'
}

// Helper function to get display name
export const getDisplayName = (user) => {
  if (!user) return 'User'
  
  return user.fullName || user.username || 'User'
}

// Helper function to check if user data is complete
export const isUserDataComplete = (user) => {
  if (!user) return false
  
  return !!(user._id && user.username && user.email && user.fullName && user.createdAt)
}

// Helper function to get profile picture data (without JSX)
export const getProfilePictureData = (user) => {
  const url = getProfilePictureUrl(user?.profilePicture);
  const initials = getUserInitials(user);
  
  return {
    url,
    initials,
    hasImage: !!url
  }
} 