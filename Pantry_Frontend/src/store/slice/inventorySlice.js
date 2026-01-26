import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import inventoryService from '../../services/inventoryService'
import toast from 'react-hot-toast'

// ✅ ALL ASYNC THUNKS DEFINED
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (params) => {  // ✅ Removed unused rejectWithValue parameter
    try {
      const response = await inventoryService.getAllInventory(params)
      
      // Handle different response structures
      console.log('📦 [InventorySlice] Fetch response structure:', {
        response,
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        isObject: typeof response.data === 'object',
        keys: response.data ? Object.keys(response.data) : []
      })
      
      let inventoryData = []
      let statsData = {}
      
      // Handle different API response structures
      if (Array.isArray(response)) {
        // Case 1: Direct array response
        inventoryData = response
        statsData = {
          totalItems: response.length,
          lowStock: response.filter(item => item.status === 'low-stock').length,
          outOfStock: response.filter(item => item.status === 'out-of-stock').length,
          expired: response.filter(item => item.status === 'expired').length
        }
      } else if (Array.isArray(response.data)) {
        // Case 2: { data: [...] }
        inventoryData = response.data
        statsData = {
          totalItems: response.data.length,
          lowStock: response.data.filter(item => item.status === 'low-stock').length,
          outOfStock: response.data.filter(item => item.status === 'out-of-stock').length,
          expired: response.data.filter(item => item.status === 'expired').length
        }
      } else if (response.data && response.data.inventory) {
        // Case 3: { data: { inventory: [...], stats: {...} } }
        inventoryData = response.data.inventory || []
        statsData = response.data.stats || {
          totalItems: inventoryData.length,
          lowStock: 0,
          outOfStock: 0,
          expired: 0
        }
      } else if (response.inventory) {
        // Case 4: { inventory: [...], stats: {...} }
        inventoryData = response.inventory || []
        statsData = response.stats || {
          totalItems: inventoryData.length,
          lowStock: 0,
          outOfStock: 0,
          expired: 0
        }
      } else {
        // Default case
        inventoryData = []
        statsData = {
          totalItems: 0,
          lowStock: 0,
          outOfStock: 0,
          expired: 0
        }
      }
      
      console.log('✅ [InventorySlice] Processed data:', {
        inventoryCount: inventoryData.length,
        stats: statsData
      })
      
      return {
        inventory: inventoryData,
        stats: statsData
      }
    } catch (error) {
      console.error('❌ [InventorySlice] Fetch error:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch inventory')
      throw error  // ✅ Throw error instead of rejectWithValue
    }
  }
)

export const fetchAlerts = createAsyncThunk(
  'inventory/fetchAlerts',
  async () => {  // ✅ Removed unused rejectWithValue parameter
    try {
      const response = await inventoryService.getAlerts()
      console.log('⚠️ [InventorySlice] Alerts response:', response)
      
      // Handle different alert response structures
      let alertsData = {
        lowStock: [],
        expired: [],
        outOfStock: []
      }
      
      if (response.data) {
        // Case 1: { data: { lowStock: [...], expired: [...], outOfStock: [...] } }
        if (response.data.lowStock) alertsData.lowStock = response.data.lowStock
        if (response.data.expired) alertsData.expired = response.data.expired
        if (response.data.outOfStock) alertsData.outOfStock = response.data.outOfStock
      } else if (response.lowStock || response.expired || response.outOfStock) {
        // Case 2: Direct object { lowStock: [...], expired: [...], outOfStock: [...] }
        alertsData = response
      }
      
      console.log('✅ [InventorySlice] Processed alerts:', {
        lowStock: alertsData.lowStock.length,
        expired: alertsData.expired.length,
        outOfStock: alertsData.outOfStock.length
      })
      
      return alertsData
    } catch (error) {
      console.error('❌ [InventorySlice] Alerts error:', error)
      // Don't show toast for alerts failure (optional feature)
      // Return empty alerts
      return {
        lowStock: [],
        expired: [],
        outOfStock: []
      }
    }
  }
)

export const updateStock = createAsyncThunk(
  'inventory/updateStock',
  async (stockData) => {  // ✅ Removed unused rejectWithValue parameter
    try {
      const response = await inventoryService.updateStock(stockData)
      toast.success('Stock updated successfully')
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update stock'
      toast.error(errorMsg)
      throw error  // ✅ Throw error instead of rejectWithValue
    }
  }
)

export const bulkUpdateStock = createAsyncThunk(
  'inventory/bulkUpdateStock',
  async (updates) => {  // ✅ Removed unused rejectWithValue parameter
    try {
      const response = await inventoryService.bulkUpdateStock(updates)
      toast.success('Bulk update completed')
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to bulk update'
      toast.error(errorMsg)
      throw error  // ✅ Throw error instead of rejectWithValue
    }
  }
)

// ✅ ADDED: Temporary function for testing if API fails
export const fetchMockInventory = createAsyncThunk(
  'inventory/fetchMockInventory',
  async () => {
    // Return mock data for testing
    const mockInventory = [
      {
        _id: '1',
        item: { _id: 'item1', name: 'Coffee', category: { name: 'Beverages' }, unit: 'packet', minStockLevel: 10, maxStockLevel: 100 },
        quantity: 45,
        status: 'in-stock',
        location: 'Main Pantry',
        lastUpdated: new Date().toISOString()
      },
      {
        _id: '2',
        item: { _id: 'item2', name: 'Milk', category: { name: 'Dairy' }, unit: 'liter', minStockLevel: 20, maxStockLevel: 200 },
        quantity: 8,
        status: 'low-stock',
        location: 'Refrigerator',
        lastUpdated: new Date().toISOString()
      },
      {
        _id: '3',
        item: { _id: 'item3', name: 'Cookies', category: { name: 'Snacks' }, unit: 'packet', minStockLevel: 15, maxStockLevel: 150 },
        quantity: 0,
        status: 'out-of-stock',
        location: 'Snack Shelf',
        lastUpdated: new Date().toISOString()
      }
    ]
    
    return {
      inventory: mockInventory,
      stats: {
        totalItems: 3,
        lowStock: 1,
        outOfStock: 1,
        expired: 0
      }
    }
  }
)

const initialState = {
  inventory: [],
  alerts: {
    lowStock: [],
    expired: [],
    outOfStock: []
  },
  loading: false,
  error: null,
  stats: {
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    expired: 0
  }
}

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // ✅ ADDED: Manual reset for testing
    setMockData: (state) => {
      state.inventory = [
        {
          _id: '1',
          item: { _id: 'item1', name: 'Coffee', category: { name: 'Beverages' }, unit: 'packet' },
          quantity: 45,
          status: 'in-stock',
          location: 'Main Pantry'
        },
        {
          _id: '2',
          item: { _id: 'item2', name: 'Milk', category: { name: 'Dairy' }, unit: 'liter' },
          quantity: 8,
          status: 'low-stock',
          location: 'Refrigerator'
        }
      ]
      state.stats = {
        totalItems: 2,
        lowStock: 1,
        outOfStock: 0,
        expired: 0
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false
        state.inventory = action.payload.inventory || []
        state.stats = action.payload.stats || initialState.stats
        console.log('✅ [InventorySlice] State updated:', {
          inventoryCount: state.inventory.length,
          stats: state.stats
        })
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
        
        // Auto-fallback to mock data on error
        if (state.inventory.length === 0) {
          console.log('⚠️ [InventorySlice] Using mock data as fallback')
          state.inventory = [
            {
              _id: 'temp1',
              item: { _id: 'temp1', name: 'Sample Item', category: { name: 'General' }, unit: 'unit' },
              quantity: 50,
              status: 'in-stock',
              location: 'Main Pantry'
            }
          ]
          state.stats = {
            totalItems: 1,
            lowStock: 0,
            outOfStock: 0,
            expired: 0
          }
        }
      })
      
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        // Don't set loading for alerts (optional feature)
        state.error = null
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.error = action.error.message
      })
      
      // Update stock
      .addCase(updateStock.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.loading = false
        const updatedItem = action.payload.data
        const index = state.inventory.findIndex(item => 
          item._id === updatedItem._id || 
          item.item?._id === updatedItem.item?._id
        )
        if (index !== -1) {
          state.inventory[index] = updatedItem
        } else {
          state.inventory.push(updatedItem)
        }
      })
      .addCase(updateStock.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      
      // Bulk update
      .addCase(bulkUpdateStock.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(bulkUpdateStock.fulfilled, (state) => {
        state.loading = false
        // Refresh inventory after bulk update
        // In real app, update specific items
      })
      .addCase(bulkUpdateStock.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      
      // Fetch mock inventory
      .addCase(fetchMockInventory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMockInventory.fulfilled, (state, action) => {
        state.loading = false
        state.inventory = action.payload.inventory
        state.stats = action.payload.stats
      })
      .addCase(fetchMockInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
})

export const { clearError, setMockData } = inventorySlice.actions
export default inventorySlice.reducer