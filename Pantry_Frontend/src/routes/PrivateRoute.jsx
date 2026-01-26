import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Loading from '../components/common/Loading'

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

  if (loading) {
    return <Loading fullScreen />
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
