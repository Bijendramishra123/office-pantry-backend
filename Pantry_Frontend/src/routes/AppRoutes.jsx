import { Routes, Route } from 'react-router-dom'
// ✅ REMOVED unused useSelector import since we're not using auth state here
// import { useSelector } from 'react-redux'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'

// Layouts
import MainLayout from '../layout/MainLayout'
import AuthLayout from '../layout/AuthLayout'

// Auth Pages
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'

// Dashboard Pages
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/dashboard/Profile'

// Item Pages
import ItemList from '../pages/items/ItemList'
import ItemDetail from '../pages/items/ItemDetail'
import AddItem from '../pages/items/AddItem'
import EditItem from '../pages/items/EditItem'

// Order Pages
import OrderList from '../pages/orders/OrderList'
import OrderDetail from '../pages/orders/OrderDetail'
import CreateOrder from '../pages/orders/CreateOrder'

// Inventory Pages
import InventoryList from '../pages/inventory/InventoryList'
import InventoryUpdate from '../pages/inventory/InventoryUpdate'

// User Pages
import UserList from '../pages/users/UserList'
import UserDetail from '../pages/users/UserDetail'

// Other Pages
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'

// ✅ ADD Settings page import
import Settings from '../pages/Settings'

function AppRoutes() {
  // ✅ REMOVED unused variables that were causing ESLint warnings
  // const { isAuthenticated, user } = useSelector((state) => state.auth)

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* ✅ ADDED Settings Route */}
          <Route path="/settings" element={<Settings />} />

          {/* Items */}
          <Route path="/items" element={<ItemList />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          
          {/* Admin/Manager only routes */}
          <Route element={<AdminRoute allowedRoles={['admin', 'manager']} />}>
            <Route path="/items/add" element={<AddItem />} />
            <Route path="/items/edit/:id" element={<EditItem />} />
          </Route>

          {/* Orders */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/create" element={<CreateOrder />} />

          {/* Inventory - Admin/Manager only */}
          <Route element={<AdminRoute allowedRoles={['admin', 'manager']} />}>
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/inventory/update" element={<InventoryUpdate />} />
          </Route>

          {/* Users - Admin only */}
          <Route element={<AdminRoute allowedRoles={['admin']} />}>
            <Route path="/users" element={<UserList />} />
            <Route path="/users/:id" element={<UserDetail />} />
          </Route>
        </Route>
      </Route>

      {/* Public Home Page */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes