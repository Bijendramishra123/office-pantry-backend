import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (requestError) => { // ✅ Changed 'error' to 'requestError'
    return Promise.reject(requestError)
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error
    
    if (response) {
      switch (response.status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
          toast.error('Session expired. Please login again.')
          break
        case 403:
          toast.error('Access denied. Insufficient permissions.')
          break
        case 404:
          toast.error('Resource not found.')
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          if (response.data?.message) {
            toast.error(response.data.message)
          } else {
            toast.error('An error occurred. Please try again.')
          }
      }
    } else {
      toast.error('Network error. Please check your connection.')
    }
    
    return Promise.reject(error)
  }
)

export default api