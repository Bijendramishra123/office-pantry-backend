import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slice/authSlice'
import itemReducer from './slice/itemSlice'
import orderReducer from './slice/orderSlice'
import userReducer from './slice/userSlice'
import inventoryReducer from './slice/inventorySlice'  // ✅ ADDED

export const store = configureStore({
  reducer: {
    auth: authReducer,
    items: itemReducer,
    orders: orderReducer,
    users: userReducer,
    inventory: inventoryReducer,  // ✅ ADDED
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})