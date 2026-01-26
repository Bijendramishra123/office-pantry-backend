import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import itemService from '../../services/itemService'
import toast from 'react-hot-toast'

// Async thunks
export const fetchItems = createAsyncThunk(
  'items/fetchItems',
  async (params, { rejectWithValue }) => {
    try {
      const response = await itemService.getAllItems(params)
      
      // ✅ DEBUG: Log the response
      console.log('📦 fetchItems API Response:', response)
      console.log('📊 Response structure:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        hasSuccess: response.success !== undefined,
        hasPagination: !!response.pagination,
        fullResponse: response
      })
      
      // ✅ Return the entire response
      return response
    } catch (error) {
      console.error('❌ fetchItems Error:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch items')
    }
  }
)

export const fetchItemById = createAsyncThunk(
  'items/fetchItemById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await itemService.getItemById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch item')
    }
  }
)

export const createItem = createAsyncThunk(
  'items/createItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await itemService.createItem(itemData)
      toast.success('Item created successfully')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create item')
    }
  }
)

export const updateItem = createAsyncThunk(
  'items/updateItem',
  async ({ id, itemData }, { rejectWithValue }) => {
    try {
      const response = await itemService.updateItem(id, itemData)
      toast.success('Item updated successfully')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update item')
    }
  }
)

export const deleteItem = createAsyncThunk(
  'items/deleteItem',
  async (id, { rejectWithValue }) => {
    try {
      await itemService.deleteItem(id)
      toast.success('Item deleted successfully')
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete item')
    }
  }
)

const initialState = {
  items: [],
  currentItem: null,
  loading: false,
  error: null,
  totalItems: 0,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1
  }
}

const itemSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    clearCurrentItem: (state) => {
      state.currentItem = null
    },
    clearError: (state) => {
      state.error = null
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    resetItems: (state) => {
      state.items = []
      state.currentItem = null
      state.loading = false
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch items - ✅ COMPLETELY FIXED
      .addCase(fetchItems.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        
        console.log('✅ fetchItems.fulfilled - Payload received:', action.payload)
        
        // ✅ HANDLE ALL POSSIBLE RESPONSE FORMATS
        let itemsArray = []
        let totalItemsCount = 0
        let paginationData = {}
        
        // Check different response formats
        if (action.payload?.success === true && Array.isArray(action.payload.data)) {
          // Format: { success: true, data: [...], pagination: {...} }
          itemsArray = action.payload.data
          totalItemsCount = action.payload.pagination?.total || action.payload.data.length
          paginationData = action.payload.pagination || {}
          console.log('📥 Using format: {success: true, data: [...]}')
        } 
        else if (Array.isArray(action.payload?.data)) {
          // Format: { data: [...], pagination: {...} }
          itemsArray = action.payload.data
          totalItemsCount = action.payload.pagination?.total || action.payload.data.length
          paginationData = action.payload.pagination || {}
          console.log('📥 Using format: {data: [...]}')
        }
        else if (Array.isArray(action.payload)) {
          // Format: [...]
          itemsArray = action.payload
          totalItemsCount = action.payload.length
          console.log('📥 Using format: Array directly')
        }
        else if (action.payload?.items && Array.isArray(action.payload.items)) {
          // Format: { items: [...], total: X }
          itemsArray = action.payload.items
          totalItemsCount = action.payload.total || action.payload.items.length
          console.log('📥 Using format: {items: [...]}')
        }
        else {
          // Fallback: Try to find array in any property
          console.log('⚠️ Unknown format, searching for array...', action.payload)
          
          // Search for any array in the payload
          for (const key in action.payload) {
            if (Array.isArray(action.payload[key])) {
              itemsArray = action.payload[key]
              console.log(`📥 Found array in property: ${key}`)
              break
            }
          }
          
          totalItemsCount = itemsArray.length
        }
        
        console.log(`✅ Setting items: ${itemsArray.length} items found`)
        console.log('📊 Sample item:', itemsArray[0])
        
        state.items = itemsArray
        state.totalItems = totalItemsCount
        
        if (paginationData.page) {
          state.pagination = {
            ...state.pagination,
            ...paginationData
          }
        }
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        console.error('❌ fetchItems.rejected:', action.payload)
      })
      
      // Fetch item by ID
      .addCase(fetchItemById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.loading = false
        
        // Handle different formats
        if (action.payload?.success === true && action.payload.data) {
          state.currentItem = action.payload.data
        } else if (action.payload?.data) {
          state.currentItem = action.payload.data
        } else {
          state.currentItem = action.payload
        }
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Create item
      .addCase(createItem.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.loading = false
        
        // Get the new item from response
        let newItem = null
        
        if (action.payload?.success === true && action.payload.data) {
          newItem = action.payload.data
        } else if (action.payload?.data) {
          newItem = action.payload.data
        } else {
          newItem = action.payload
        }
        
        // Add to items list
        if (newItem) {
          if (!Array.isArray(state.items)) {
            state.items = []
          }
          state.items.unshift(newItem)
          state.totalItems += 1
        }
        
        state.error = null
      })
      .addCase(createItem.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update item
      .addCase(updateItem.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.loading = false
        
        // Get updated item from response
        let updatedItem = null
        
        if (action.payload?.success === true && action.payload.data) {
          updatedItem = action.payload.data
        } else if (action.payload?.data) {
          updatedItem = action.payload.data
        } else {
          updatedItem = action.payload
        }
        
        // Update in items list
        if (updatedItem && updatedItem._id && Array.isArray(state.items)) {
          const index = state.items.findIndex(item => item._id === updatedItem._id)
          if (index !== -1) {
            state.items[index] = updatedItem
          }
        }
        
        // Update current item if it's the same
        if (state.currentItem?._id === updatedItem?._id) {
          state.currentItem = updatedItem
        }
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Delete item
      .addCase(deleteItem.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.loading = false
        
        if (Array.isArray(state.items)) {
          state.items = state.items.filter(item => item._id !== action.payload)
          state.totalItems = Math.max(0, state.totalItems - 1)
        }
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearCurrentItem, clearError, setPagination, resetItems } = itemSlice.actions
export default itemSlice.reducer