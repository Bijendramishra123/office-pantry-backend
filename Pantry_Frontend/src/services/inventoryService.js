import api from './api'

const inventoryService = {
  // Get all inventory items
  getAllInventory: async (params = {}) => {
    const response = await api.get('/inventory', { params })
    return response.data
  },

  // Get inventory alerts
  getAlerts: async () => {
    const response = await api.get('/inventory/alerts')
    return response.data
  },

  // Update stock
  updateStock: async (stockData) => {
    const response = await api.post('/inventory/update', stockData)
    return response.data
  },

  // Bulk update inventory
  bulkUpdateStock: async (updates) => {
    const response = await api.post('/inventory/bulk-update', { updates })
    return response.data
  },

  // Get item history
  getItemHistory: async (itemId) => {
    const response = await api.get(`/inventory/history/${itemId}`)
    return response.data
  }
}

export default inventoryService
