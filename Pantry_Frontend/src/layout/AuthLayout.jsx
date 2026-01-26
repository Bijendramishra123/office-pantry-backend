import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  Box, 
  Container, 
  Paper, 
  Typography 
} from '@mui/material'
import { RestaurantMenu } from '@mui/icons-material'

const AuthLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              color: 'primary.main',
            }}
          >
            <RestaurantMenu sx={{ fontSize: 40, mr: 1 }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Office Pantry
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Manage your office pantry efficiently. Order snacks, track inventory, and more.
          </Typography>

          <Outlet />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            © {new Date().getFullYear()} Office Pantry System. All rights reserved.
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

export default AuthLayout
