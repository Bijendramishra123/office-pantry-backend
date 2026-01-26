import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../../services/authService'
import toast from 'react-hot-toast'

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔐 [AuthSlice] Login attempt for:', credentials.email);
      const response = await authService.login(credentials)
      toast.success('Login successful!')
      return response
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed'
      console.error('❌ [AuthSlice] Login error:', errorMsg)
      toast.error(errorMsg)
      return rejectWithValue(errorMsg)
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('📝 [AuthSlice] Registration attempt for:', userData.email);
      const response = await authService.register(userData)
      toast.success('Registration successful!')
      return response
    } catch (error) {
      const errorMsg = error.message || error.response?.data?.message || 'Registration failed'
      console.error('❌ [AuthSlice] Registration error:', errorMsg)
      toast.error(errorMsg)
      return rejectWithValue(errorMsg)
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState()
      const currentUser = state.auth.user
      
      // If user already exists in Redux store and we have token, return cached
      if (currentUser && authService.getToken()) {
        console.log('📊 [AuthSlice] User exists in store, returning cached')
        return currentUser
      }
      
      console.log('🔄 [AuthSlice] Fetching user...')
      const response = await authService.getCurrentUser()
      return response.data
    } catch (error) {
      console.error('❌ [AuthSlice] Failed to fetch user:', error.message)
      
      // Check localStorage for cached user
      const cachedUser = authService.getUser()
      if (cachedUser) {
        console.log('⚠️ [AuthSlice] API failed, returning cached user from localStorage')
        return cachedUser
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to get user data')
    }
  }
)

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      console.log('📝 [AuthSlice] Updating profile:', profileData)
      const response = await authService.updateProfile(profileData)
      toast.success('Profile updated successfully!')
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile'
      console.error('❌ [AuthSlice] Update profile error:', errorMsg)
      toast.error(errorMsg)
      return rejectWithValue(errorMsg)
    }
  }
)

const initialState = {
  user: authService.getUser(),
  token: authService.getToken(),
  loading: false,
  error: null,
  isAuthenticated: authService.isAuthenticated(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      console.log('🚪 [AuthSlice] Logging out...')
      authService.logout()
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      toast.success('Logged out successfully')
    },
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action) => {
      state.user = action.payload
      authService.setUser(action.payload)
    },
    setToken: (state, action) => {
      state.token = action.payload
      authService.setToken(action.payload)
      state.isAuthenticated = !!action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Login - ✅ FIXED THIS SECTION
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        
        if (action.payload) {
          // DEBUG: Check response structure
          console.log('📦 [AuthSlice] Login payload structure:', {
            payload: action.payload,
            hasData: !!action.payload.data,
            hasUser: !!action.payload.user,
            hasToken: !!action.payload.token
          })
          
          // Extract user and token properly
          let userData = null
          let tokenData = null
          
          // Check different API response structures
          if (action.payload.data) {
            // Structure: { data: { user: {...}, token: '...' } }
            userData = action.payload.data.user || action.payload.data
            tokenData = action.payload.data.token
          } else if (action.payload.user) {
            // Structure: { user: {...}, token: '...' }
            userData = action.payload.user
            tokenData = action.payload.token
          } else {
            // Structure: { _id: '...', email: '...', token: '...' }
            userData = action.payload
            tokenData = action.payload.token || action.payload.accessToken
          }
          
          // Ensure user has both id and _id for compatibility
          if (userData) {
            if (userData._id && !userData.id) {
              userData.id = userData._id // Add id field for frontend use
            }
            
            // Log extracted data
            console.log('✅ [AuthSlice] Extracted user:', {
              id: userData.id || userData._id,
              email: userData.email,
              role: userData.role
            })
            console.log('✅ [AuthSlice] Extracted token:', !!tokenData)
          }
          
          // Set state
          state.user = userData
          state.token = tokenData
          state.isAuthenticated = !!(userData && tokenData)
          
          // Also save to localStorage via authService
          if (userData && tokenData) {
            authService.setUser(userData)
            authService.setToken(tokenData)
          }
          
          console.log('✅ [AuthSlice] Login state updated:', {
            user: !!state.user,
            token: !!state.token,
            authenticated: state.isAuthenticated
          })
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Login failed'
      })
      
      // Register - ✅ FIXED
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        
        if (action.payload) {
          // Extract user and token properly
          let userData = null
          let tokenData = null
          
          if (action.payload.data) {
            userData = action.payload.data.user || action.payload.data
            tokenData = action.payload.data.token
          } else if (action.payload.user) {
            userData = action.payload.user
            tokenData = action.payload.token
          } else {
            userData = action.payload
            tokenData = action.payload.token || action.payload.accessToken
          }
          
          // Ensure id field exists
          if (userData && userData._id && !userData.id) {
            userData.id = userData._id
          }
          
          state.user = userData
          state.token = tokenData
          state.isAuthenticated = !!(userData && tokenData)
          
          // Save to localStorage
          if (userData && tokenData) {
            authService.setUser(userData)
            authService.setToken(tokenData)
          }
          
          console.log('✅ [AuthSlice] Registration successful, user:', userData?.email)
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Registration failed'
      })
      
      // Get current user - ✅ FIXED
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        
        if (action.payload) {
          // Ensure user has both id and _id
          const userData = { ...action.payload }
          if (userData._id && !userData.id) {
            userData.id = userData._id
          }
          
          // Only update if data is different
          if (JSON.stringify(state.user) !== JSON.stringify(userData)) {
            state.user = userData
            console.log('✅ [AuthSlice] User data updated in store:', {
              id: userData.id,
              email: userData.email
            })
          } else {
            console.log('⚠️ [AuthSlice] User data unchanged, skipping update')
          }
          
          state.isAuthenticated = true
        }
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        
        // Only mark as not authenticated if no cached user
        if (!state.user) {
          state.isAuthenticated = false
        }
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false
        
        if (action.payload) {
          // Ensure id field exists
          const updatedUser = { ...state.user, ...action.payload }
          if (updatedUser._id && !updatedUser.id) {
            updatedUser.id = updatedUser._id
          }
          
          state.user = updatedUser
          authService.setUser(updatedUser)
          console.log('✅ [AuthSlice] Profile updated in store')
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { logout, clearError, setUser, setToken } = authSlice.actions
export default authSlice.reducer