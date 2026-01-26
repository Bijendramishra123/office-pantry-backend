// AdminLayout.jsx
import { Outlet } from 'react-router-dom'
import { Box, Container, Typography } from '@mui/material'

const AdminLayout = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ p: 3, backgroundColor: 'primary.main', color: 'white' }}>
        Admin Dashboard
      </Typography>
      <Container sx={{ mt: 3 }}>
        <Outlet />
      </Container>
    </Box>
  )
}

export default AdminLayout