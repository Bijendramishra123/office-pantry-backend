import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AppRoutes from './routes/AppRoutes'
import Loading from './components/common/Loading'

function App() {
  const { loading, isAuthenticated } = useSelector((state) => state.auth)

  // Show loading only during initial auth check
  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="App">
      <Routes>
        {/* Root path - redirect based on auth status */}
        <Route 
          path="/" 
          element={
            isAuthenticated 
              ? <Navigate to="/dashboard" replace /> 
              : <Navigate to="/login" replace />
          } 
        />
        
        {/* All other routes */}
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </div>
  )
}

export default App