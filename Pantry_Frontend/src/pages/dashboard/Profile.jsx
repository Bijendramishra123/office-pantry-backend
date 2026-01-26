import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Card,
  CardContent,
  Divider,
  Alert,
  Tab,
  Tabs,
  Snackbar
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  AccountBalanceWallet as WalletIcon,
  History as HistoryIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { getCurrentUser, updateUserProfile } from '../../store/slice/authSlice'
import Loading from '../../components/common/Loading'

const Profile = () => {
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector((state) => state.auth)
  const [tabValue, setTabValue] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    preferences: {
      notifications: true,
      emailUpdates: true
    }
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [hasFetched, setHasFetched] = useState(false)

  // ✅ FIXED: Fetch user only once when component mounts
  useEffect(() => {
    // Check if we already have user data
    if (user && !hasFetched) {
      console.log('✅ User already exists in store, skipping fetch')
      setHasFetched(true)
      return
    }
    
    // Fetch user only if not already fetched
    if (!hasFetched && !loading) {
      console.log('🔄 Fetching user data...')
      dispatch(getCurrentUser())
      setHasFetched(true)
    }
  }, [dispatch, user, hasFetched, loading])

  // ✅ FIXED: Safely update formData without synchronous warnings
  useEffect(() => {
    if (user && !loading) {
      // Use setTimeout to avoid synchronous update warning
      const timer = setTimeout(() => {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          employeeId: user.employeeId || '',
          department: user.department || '',
          preferences: {
            notifications: user.preferences?.notifications ?? true,
            emailUpdates: user.preferences?.emailUpdates ?? true
          }
        })
      }, 0)

      return () => clearTimeout(timer)
    }
  }, [user, loading])

  const handleSaveProfile = async () => {
    if (editMode) {
      const updateData = {
        name: formData.name,
        department: formData.department
      }
      
      try {
        await dispatch(updateUserProfile(updateData)).unwrap()
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success'
        })
        setEditMode(false)
      } catch (err) {
        setSnackbar({
          open: true,
          message: err || 'Failed to update profile',
          severity: 'error'
        })
      }
    } else {
      setEditMode(true)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // ✅ FIXED: Show loading only on initial load
  if (loading && !user) {
    return <Loading />
  }

  // Show error if exists
  if (error && !user) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  // Show message if no user after fetch
  if (!user && hasFetched && !loading) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Please login to view your profile
      </Alert>
    )
  }

  // If no user yet (still loading or not fetched)
  if (!user) {
    return <Loading />
  }

  const currentDate = new Date().toLocaleDateString()

  return (
    <>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          My Profile
        </Typography>

        <Grid container spacing={3}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto 16px',
                  bgcolor: 'primary.main',
                  fontSize: 48
                }}
              >
                {user.name?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                {user.name || 'User'}
              </Typography>
              <Typography variant="body1" color="primary" gutterBottom>
                {user.role?.toUpperCase() || 'USER'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.department || 'No department'}
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WalletIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      Wallet Balance
                    </Typography>
                  </Box>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    ₹{(user.walletBalance || 0).toFixed(2)}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 2 }}
                    disabled={user.role !== 'admin'}
                  >
                    Add Money
                  </Button>
                </CardContent>
              </Card>
            </Paper>
          </Grid>

          <Grid item size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 0 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab icon={<PersonIcon />} label="Personal Info" />
                <Tab icon={<SettingsIcon />} label="Preferences" />
                <Tab icon={<HistoryIcon />} label="Activity" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {tabValue === 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Personal Information
                      </Typography>
                      <Button
                        variant={editMode ? "contained" : "outlined"}
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {editMode ? "Save Changes" : "Edit Profile"}
                      </Button>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          disabled={!editMode || loading}
                          InputProps={{
                            startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                          }}
                        />
                      </Grid>
                      
                      <Grid item size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={formData.email}
                          disabled
                          InputProps={{
                            startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                          }}
                        />
                      </Grid>

                      <Grid item size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Employee ID"
                          value={formData.employeeId}
                          disabled
                          InputProps={{
                            startAdornment: <BadgeIcon sx={{ mr: 1, color: 'action.active' }} />
                          }}
                        />
                      </Grid>

                      <Grid item size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Department"
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          disabled={!editMode || loading}
                          InputProps={{
                            startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Notification Preferences
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Configure how you want to receive notifications
                    </Alert>

                    <Grid container spacing={3}>
                      <Grid item size={12}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="body1" gutterBottom fontWeight="medium">
                              Email Notifications
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Receive email updates about orders, inventory, and system announcements
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item size={12}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="body1" gutterBottom fontWeight="medium">
                              In-App Notifications
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Show notifications within the application
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Recent Activity
                    </Typography>
                    
                    <Alert severity="info">
                      Your recent activities will appear here
                    </Alert>
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Account Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : currentDate}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default Profile