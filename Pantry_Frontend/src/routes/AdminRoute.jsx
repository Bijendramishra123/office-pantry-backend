import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Loading from '../components/common/Loading'

const AdminRoute = ({ allowedRoles }) => {
  const { user, loading } = useSelector((state) => state.auth)

  if (loading) {
    return <Loading fullScreen />
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default AdminRoute
