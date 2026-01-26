import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Container,
  Paper
} from '@mui/material'
import {
  RestaurantMenu as PantryIcon,
  ShoppingCart as OrderIcon,
  Inventory as ItemIcon,
  Speed as DashboardIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material'

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)

  const features = [
    {
      icon: <OrderIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Easy Ordering',
      description: 'Order snacks and beverages with just a few clicks'
    },
    {
      icon: <ItemIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Inventory Management',
      description: 'Track stock levels and receive alerts'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Analytics & Reports',
      description: 'Get insights into consumption patterns'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: 'Role-based Access',
      description: 'Different permissions for employees, managers, and admins'
    }
  ]

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 10,
          mb: 8
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PantryIcon sx={{ fontSize: 60, mr: 2 }} />
                <Typography variant="h2" component="h1" fontWeight="bold">
                  Office Pantry
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Streamline your office pantry management with our all-in-one solution.
                Order snacks, track inventory, and manage everything efficiently.
              </Typography>
              
              {isAuthenticated ? (
                <Button
                  component={Link}
                  to="/dashboard"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'grey.100'
                    }
                  }}
                  startIcon={<DashboardIcon />}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'grey.100'
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Demo Accounts
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Admin:</strong> admin@office.com / admin123
                  </Typography>
                  <Typography variant="body2">
                    <strong>Manager:</strong> manager@office.com / manager123
                  </Typography>
                  <Typography variant="body2">
                    <strong>Employee:</strong> john@office.com / employee123
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Try different roles to see different permissions
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Typography variant="h3" component="h2" align="center" fontWeight="bold" gutterBottom>
          Features
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}>
          Everything you need to manage your office pantry efficiently
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.light',
          py: 8
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="h3" fontWeight="bold" gutterBottom>
            Ready to streamline your office pantry?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Join hundreds of offices that use our system to manage their pantry efficiently.
          </Typography>
          
          {!isAuthenticated && (
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{ px: 6, py: 1.5 }}
            >
              Get Started Free
            </Button>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default Home
