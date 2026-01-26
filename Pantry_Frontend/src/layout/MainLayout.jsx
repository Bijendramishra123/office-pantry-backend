import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItemButton,  // ✅ Changed from ListItem to ListItemButton
  ListItemIcon, 
  ListItemText,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrderIcon,
  Inventory as ItemIcon,
  People as UserIcon,
  Storage as InventoryIcon,
  AccountCircle as ProfileIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { logout } from '../store/slice/authSlice'
import toast from 'react-hot-toast'

const drawerWidth = 240

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  // ✅ Logout handler function
  const handleLogout = () => {
    console.log('🚪 MainLayout: Logout initiated')
    
    // Close the menu first
    handleMenuClose()
    
    // Dispatch logout action
    dispatch(logout())
    
    // Show logout success message
    toast.success('Logged out successfully!')
    
    // Redirect to login page
    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 500)
  }

  // ✅ Handle menu item clicks
  const handleMenuItemClick = (item) => {
    handleMenuClose()
    
    if (item.action === 'logout') {
      handleLogout()
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Orders', icon: <OrderIcon />, path: '/orders' },
    { text: 'Items', icon: <ItemIcon />, path: '/items' },
    ...(user?.role === 'admin' || user?.role === 'manager' ? [
      { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    ] : []),
    ...(user?.role === 'admin' ? [
      { text: 'Users', icon: <UserIcon />, path: '/users' },
    ] : []),
  ]

  const userMenuItems = [
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Logout', icon: <LogoutIcon />, action: 'logout' },
  ]

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Office Pantry Management
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <NotificationIcon />
          </IconButton>

          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
              }
            }}
          >
            <MenuItem disabled sx={{ opacity: 1, cursor: 'default' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" fontWeight="bold">
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email || 'No email'}
                </Typography>
                <Typography variant="caption" color="primary">
                  {user?.role ? user.role.toUpperCase() : 'USER'}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            {userMenuItems.map((item) => (
              <MenuItem 
                key={item.text} 
                onClick={() => handleMenuItemClick(item)}
                sx={{
                  color: item.action === 'logout' ? 'error.main' : 'inherit',
                  '&:hover': {
                    backgroundColor: item.action === 'logout' ? 'error.light' : 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: item.action === 'logout' ? 'error.main' : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                />
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Office Pantry
            </Typography>
            <Divider />
          </Box>
          <List>
            {menuItems.map((item) => (
              <ListItemButton  // ✅ Changed from ListItem button to ListItemButton
                key={item.text}
                onClick={() => {
                  navigate(item.path)
                  handleDrawerToggle()
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText'
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>  // ✅ Closing tag changed
            ))}
          </List>
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
          open
        >
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Office Pantry
            </Typography>
            <Divider />
          </Box>
          <List>
            {menuItems.map((item) => (
              <ListItemButton  // ✅ Changed from ListItem button to ListItemButton
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText'
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>  // ✅ Closing tag changed
            ))}
          </List>
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          backgroundColor: '#f9fafb',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default MainLayout