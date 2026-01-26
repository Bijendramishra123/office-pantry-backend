import { Link } from 'react-router-dom'
import { Button, Box, Typography, Container } from '@mui/material'
import { Home as HomeIcon, ArrowBack as BackIcon } from '@mui/icons-material'

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center'
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '6rem', md: '8rem' },
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2
          }}
        >
          404
        </Typography>
        
        <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            component={Link}
            to="/"
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
          >
            Go to Home
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<BackIcon />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default NotFound
