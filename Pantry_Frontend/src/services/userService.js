import api from './api'

const userService = {
  // Get all users
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // Update wallet balance
  updateWallet: async (id, walletData) => {
    const response = await api.post(`/users/${id}/wallet`, walletData)
    return response.data
  },

  // Get user transactions
  getUserTransactions: async (id, params = {}) => {
    const response = await api.get(`/users/${id}/transactions`, { params })
    return response.data
  },

  // Get user orders
  getUserOrders: async (id, params = {}) => {
    const response = await api.get(`/users/${id}/orders`, { params })
    return response.data
  }
}

export default userService
