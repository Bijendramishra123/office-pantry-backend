import api from './api'

const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    console.log('📤 Creating order with data:', orderData)
    console.log('📋 Order items:', orderData.items)
    console.log('💰 Payment method:', orderData.paymentMethod)
    
    try {
      const response = await api.post('/orders', orderData)
      console.log('✅ Order created successfully:', response.data)
      return response
    } catch (error) {
      console.error('❌ Order creation failed:', error)
      console.error('📞 Error response:', error.response?.data)
      throw error
    }
  },

  // Get user's orders
  getUserOrders: async (params = {}) => {
    const response = await api.get('/orders/my-orders', { params })
    return response
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`)
    return response
  },

  // Get all orders (admin/manager)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders', { params })
    return response
  },

  // Update order status
  updateOrderStatus: async (id, statusData) => {
    const response = await api.put(`/orders/${id}/status`, statusData)
    return response
  },

  // Cancel order
  cancelOrder: async (id, reason) => {
    const response = await api.put(`/orders/${id}/cancel`, { reason })
    return response
  }
}

export default orderService