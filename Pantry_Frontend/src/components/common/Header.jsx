import { AppBar, Toolbar, Typography, IconButton, Box, Badge } from '@mui/material'
import { 
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle
} from '@mui/icons-material'
import { useSelector } from 'react-redux'

const Header = ({ onMenuClick }) => {
  const { user } = useSelector((state) => state.auth)

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Office Pantry Management
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton color="inherit" sx={{ ml: 1 }}>
            <AccountCircle />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {user?.name || 'User'}
            </Typography>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
