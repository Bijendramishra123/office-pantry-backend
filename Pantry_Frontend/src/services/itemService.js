import api from './api'

const itemService = {
  // Get all items
  getAllItems: async (params = {}) => {
    console.log('📥 Fetching items with params:', params)
    const response = await api.get('/items', { params })
    
    // ✅ DEBUG: Log the full response
    console.log('📦 getAllItems Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      hasDataProp: !!response.data?.data,
      hasSuccessProp: response.data?.success !== undefined,
      keys: response.data ? Object.keys(response.data) : []
    })
    
    return response.data
  },

  // Get item by ID
  getItemById: async (id) => {
    console.log('📥 Fetching item by ID:', id)
    const response = await api.get(`/items/${id}`)
    console.log('📦 getItemById Response:', response.data)
    return response.data
  },

  // Create item
  createItem: async (itemData) => {
    console.log('📤 Creating item:', itemData)
    const response = await api.post('/items', itemData)
    console.log('✅ createItem Response:', response.data)
    return response.data
  },

  // Update item
  updateItem: async (id, itemData) => {
    console.log('🔄 Updating item:', id, itemData)
    const response = await api.put(`/items/${id}`, itemData)
    console.log('✅ updateItem Response:', response.data)
    return response.data
  },

  // Delete item
  deleteItem: async (id) => {
    console.log('🗑️ Deleting item:', id)
    const response = await api.delete(`/items/${id}`)
    console.log('✅ deleteItem Response:', response.data)
    return response.data
  },

  // Get items by category
  getItemsByCategory: async (categoryId) => {
    console.log('📥 Fetching items by category:', categoryId)
    const response = await api.get(`/items/category/${categoryId}`)
    console.log('📦 getItemsByCategory Response:', response.data)
    return response.data
  },

  // Get all categories
  getCategories: async () => {
    console.log('📥 Fetching categories...')
    try {
      const response = await api.get('/categories')
      console.log('📦 getCategories Response:', response.data)
      return response.data
    } catch (error) {
      console.log('⚠️ Categories endpoint not available:', error.message)
      // Return empty array as fallback
      return { data: [] }
    }
  }
}

export default itemService