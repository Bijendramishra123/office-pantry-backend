import api from './api'

// Helper function for consistent error handling
const handleApiError = (apiError, operation) => {
  console.error(`❌ ${operation} failed:`, {
    status: apiError.response?.status,
    statusText: apiError.response?.statusText,
    data: apiError.response?.data,
    message: apiError.message,
    url: apiError.config?.url,
    method: apiError.config?.method
  })
  // Note: Error is already thrown by the calling function, so we don't need to return it
}

// Store user data in localStorage
const storeUserData = (token, user) => {
  if (token) {
    localStorage.setItem('token', token)
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

// Extract token and user from different response structures - ✅ FIXED
const extractAuthData = (responseData) => {
  console.log('🔍 [AuthService] Extracting auth data from:', {
    responseData,
    keys: Object.keys(responseData || {})
  })
  
  let token = null
  let user = null
  
  if (!responseData) {
    console.log('⚠️ [AuthService] No response data to extract')
    return { token, user }
  }
  
  // Structure 1: { token: '...', user: {...} }
  if (responseData.token && responseData.user) {
    console.log('📦 [AuthService] Structure 1 detected: {token, user}')
    token = responseData.token || responseData.accessToken
    user = responseData.user
  }
  // Structure 2: { data: { token: '...', user: {...} } }
  else if (responseData.data) {
    console.log('📦 [AuthService] Structure 2 detected: {data: {token, user}}')
    token = responseData.data.token || responseData.data.accessToken
    user = responseData.data.user || responseData.data
  }
  // Structure 3: Direct user object with token property
  else if (responseData._id || responseData.email) {
    console.log('📦 [AuthService] Structure 3 detected: Direct user object')
    user = responseData
    token = responseData.token || responseData.accessToken
  }
  // Structure 4: Just token
  else if (responseData.token && !responseData.user) {
    console.log('📦 [AuthService] Structure 4 detected: Token only')
    token = responseData.token
    // Try to get user from localStorage
    const cachedUser = JSON.parse(localStorage.getItem('user') || 'null')
    if (cachedUser) {
      user = cachedUser
    }
  }
  
  console.log('✅ [AuthService] Extracted:', {
    token: token ? 'Token exists' : 'No token',
    user: user ? `User: ${user.email || user._id}` : 'No user'
  })
  
  return { token, user }
}

// ✅ NEW: Ensure user has both id and _id fields
const normalizeUser = (user) => {
  if (!user) return user
  
  const normalized = { ...user }
  
  // Ensure id field exists
  if (normalized._id && !normalized.id) {
    normalized.id = normalized._id
  }
  
  // Also ensure _id exists if only id is present
  if (normalized.id && !normalized._id) {
    normalized._id = normalized.id
  }
  
  return normalized
}

const authService = {
  // Register user
  register: async (userData) => {
    try {
      console.log('📝 [AuthService] Registration attempt for:', userData.email)
      
      const payload = {
        name: userData.name?.trim(),
        email: userData.email?.trim().toLowerCase(),
        password: userData.password,
        employeeId: userData.employeeId?.trim(),
        department: userData.department,
        role: userData.role || 'employee'
      }
      
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key]
        }
      })
      
      console.log('📦 [AuthService] Sending payload:', payload)
      
      const response = await api.post('/auth/register', payload)
      
      // Log full response for debugging
      console.log('📥 [AuthService] Register response:', {
        status: response.status,
        data: response.data
      })
      
      const { token, user } = extractAuthData(response.data)
      const normalizedUser = normalizeUser(user)
      
      if (token || normalizedUser) {
        storeUserData(token, normalizedUser)
        console.log('✅ [AuthService] Registration successful')
        console.log('   🔑 Token stored:', !!token)
        console.log('   👤 User data stored:', normalizedUser?.email || 'No user')
      }
      
      return { ...response.data, token, user: normalizedUser }
    } catch (registrationError) {
      if (registrationError.response?.status === 400) {
        console.error('❌ [AuthService] Bad Request - Validation error:', registrationError.response.data)
      } else if (registrationError.response?.status === 409) {
        console.error('❌ [AuthService] Conflict - User already exists')
      }
      
      handleApiError(registrationError, 'Registration')
      throw registrationError
    }
  },

  // Login user - ✅ IMPROVED
  login: async (credentials) => {
    try {
      console.log('🔐 [AuthService] Login attempt for:', credentials.email)
      
      const payload = {
        email: credentials.email?.trim().toLowerCase(),
        password: credentials.password
      }
      
      console.log('📤 [AuthService] Sending login request...')
      
      const response = await api.post('/auth/login', payload)
      
      // Log full response for debugging
      console.log('📥 [AuthService] Login response received:', {
        status: response.status,
        data: response.data,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user
      })
      
      const { token, user } = extractAuthData(response.data)
      const normalizedUser = normalizeUser(user)
      
      // Store in localStorage
      storeUserData(token, normalizedUser)
      
      console.log('✅ [AuthService] Login successful')
      console.log('   👤 User:', normalizedUser?.email || normalizedUser?._id || 'No user data')
      console.log('   🔑 Token:', token ? 'Stored successfully' : 'Not provided')
      console.log('   User ID check:', {
        id: normalizedUser?.id,
        _id: normalizedUser?._id,
        same: normalizedUser?.id === normalizedUser?._id
      })
      
      // Return BOTH token and user explicitly for Redux
      const loginResponse = {
        token: token,
        user: normalizedUser,
        // Also include original response for compatibility
        ...response.data
      }
      
      return loginResponse
    } catch (loginError) {
      if (loginError.response?.status === 401) {
        console.error('❌ [AuthService] Unauthorized - Invalid credentials')
      }
      
      handleApiError(loginError, 'Login')
      throw loginError
    }
  },

  // Get current user - ✅ FIXED
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('ℹ️ [AuthService] No token found, returning cached user if exists')
        const cachedUser = JSON.parse(localStorage.getItem('user') || 'null')
        if (cachedUser) {
          const normalizedUser = normalizeUser(cachedUser)
          console.log('📋 [AuthService] Retrieved cached user:', normalizedUser.email)
          console.log('   User ID:', normalizedUser.id)
          return { data: normalizedUser }
        }
        throw new Error('No authentication token found')
      }
      
      console.log('👤 [AuthService] Fetching current user from API...')
      
      const response = await api.get('/auth/me')
      
      if (response.data) {
        // Normalize user data
        const userData = normalizeUser(response.data)
        
        localStorage.setItem('user', JSON.stringify(userData))
        console.log('✅ [AuthService] User data updated from API:', userData.email)
        console.log('   User ID:', userData.id)
      }
      
      return response
    } catch (fetchError) {
      // Don't clear localStorage on API failure
      console.log('⚠️ [AuthService] API fetch failed, returning cached user')
      
      const cachedUser = JSON.parse(localStorage.getItem('user') || 'null')
      if (cachedUser) {
        const normalizedUser = normalizeUser(cachedUser)
        console.log('📋 [AuthService] Returning cached user:', normalizedUser.email)
        console.log('   User ID:', normalizedUser.id)
        return { data: normalizedUser }
      }
      
      handleApiError(fetchError, 'Get Current User')
      throw fetchError
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      console.log('📝 [AuthService] Updating profile:', profileData)
      
      const response = await api.put('/auth/profile', profileData)

      // Update user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = { ...currentUser, ...profileData }
      const normalizedUser = normalizeUser(updatedUser)
      
      localStorage.setItem('user', JSON.stringify(normalizedUser))

      console.log('✅ [AuthService] Profile updated and cached')
      return response
    } catch (error) {
      console.error('❌ [AuthService] Profile update error:', error)
      throw error
    }
  },

  // Logout user - ✅ IMPROVED
  logout: () => {
    const hadToken = !!localStorage.getItem('token')
    const hadUser = !!localStorage.getItem('user')
    
    // Clear ALL auth-related data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Also clear any order/cart data
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.includes('order') || key.includes('cart') || key.includes('persist:')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log('👋 [AuthService] Logout completed')
    console.log('   Token removed:', hadToken)
    console.log('   User data removed:', hadUser)
    console.log('   Additional data removed:', keysToRemove.length)
    
    return { success: true }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token')
    const isAuth = !!token
    console.log('🔍 [AuthService] Authentication check:', isAuth ? 'Authenticated' : 'Not authenticated')
    return isAuth
  },

  // Get stored user data - ✅ IMPROVED
  getUser: () => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      console.log('ℹ️ [AuthService] No user data in localStorage')
      return null
    }
    
    try {
      const user = JSON.parse(userStr)
      const normalizedUser = normalizeUser(user)
      
      console.log('📋 [AuthService] Retrieved user:', {
        id: normalizedUser.id,
        _id: normalizedUser._id,
        email: normalizedUser.email,
        role: normalizedUser.role
      })
      return normalizedUser
    } catch (parseError) {
      console.error('❌ [AuthService] Failed to parse user data:', parseError)
      return null
    }
  },

  // Get token
  getToken: () => {
    const token = localStorage.getItem('token')
    console.log('🔑 [AuthService] Token check:', token ? 'Exists' : 'Not found')
    return token
  },

  // Set user manually (for updates) - ✅ FIXED
  setUser: (user) => {
    if (user) {
      const normalizedUser = normalizeUser(user)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
      console.log('💾 [AuthService] User manually updated in localStorage:', normalizedUser.email)
      console.log('   User ID:', normalizedUser.id)
    }
  },

  // Set token manually
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
      console.log('💾 [AuthService] Token manually updated in localStorage')
    }
  },

  // DEBUG: Get all stored data (for troubleshooting) - ✅ FIXED
  debug: () => {
    console.log('🐛 [AuthService] Debug info:')
    console.log('   Token exists:', !!localStorage.getItem('token'))
    
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        const normalizedUser = normalizeUser(user)
        console.log('   User data:', {
          id: normalizedUser.id,
          _id: normalizedUser._id,
          email: normalizedUser.email,
          role: normalizedUser.role
        })
      } catch {
        console.log('   User data: Invalid JSON')
      }
    } else {
      console.log('   User data: None')
    }
  }
}

export default authService