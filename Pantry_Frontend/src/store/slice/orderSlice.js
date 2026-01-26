import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import orderService from '../../services/orderService'
import toast from 'react-hot-toast'

// Async thunks
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      console.log('🔄 [orderSlice] Creating order with data:', orderData)
      
      const response = await orderService.createOrder(orderData)
      console.log('✅ [orderSlice] Order API response:', response.data)
      
      // ✅ IMPORTANT: Check if response has success property
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Order created successfully')
        return response.data  // ✅ Return entire response data
      } else {
        // If backend returns success: false
        const errorMsg = response.data?.message || 'Order creation failed'
        toast.error(errorMsg)
        return rejectWithValue(errorMsg)
      }
      
    } catch (error) {
      console.error('❌ [orderSlice] Order creation error:', error)
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to create order'
      
      toast.error(errorMessage)
      return rejectWithValue(errorMessage)
    }
  }
)

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await orderService.getUserOrders(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders')
    }
  }
)

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order')
    }
  }
)

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await orderService.getAllOrders(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders')
    }
  }
)

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status, reason }, { rejectWithValue }) => {
    try {
      const response = await orderService.updateOrderStatus(id, { status, reason })
      toast.success(`Order status updated to ${status}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status')
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await orderService.cancelOrder(id, reason)
      toast.success('Order cancelled successfully')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order')
    }
  }
)

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  totalOrders: 0,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1
  }
}

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    clearError: (state) => {
      state.error = null
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    clearCart: () => {
      // This is just a placeholder action for cart clearing
      // Actual cart is managed in CreateOrder component
      console.log('🛒 Cart clear action dispatched')
    }
  },
  extraReducers: (builder) => {
    builder
      // Create order - FIXED
      .addCase(createOrder.pending, (state) => {
        console.log('⏳ [orderSlice] createOrder pending')
        state.loading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        console.log('✅ [orderSlice] createOrder fulfilled:', action.payload)
        state.loading = false
        
        // ✅ Check if payload exists and has data property
        if (action.payload && action.payload.success) {
          // Add the new order to orders array if data exists
          if (action.payload.data) {
            state.orders.unshift(action.payload.data)
          }
        } else {
          state.error = action.payload?.message || 'Order creation failed'
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        console.log('❌ [orderSlice] createOrder rejected:', action.payload)
        state.loading = false
        state.error = action.payload
      })
      // Fetch user orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.data || []
        state.totalOrders = action.payload.pagination?.total || 0
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination
        }
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload.data
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch all orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.data || []
        state.totalOrders = action.payload.pagination?.total || 0
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false
        const index = state.orders.findIndex(order => order._id === action.payload.data._id)
        if (index !== -1) {
          state.orders[index] = action.payload.data
        }
        if (state.currentOrder?._id === action.payload.data._id) {
          state.currentOrder = action.payload.data
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false
        const index = state.orders.findIndex(order => order._id === action.payload.data._id)
        if (index !== -1) {
          state.orders[index] = action.payload.data
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearCurrentOrder, clearError, setPagination, clearCart } = orderSlice.actions
export default orderSlice.reducer