// src/pages/dashboard/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Card, 
  CardContent,
  LinearProgress,
  Button,
  Chip,
  Avatar,
  Stack
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Inventory as ItemIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as SalesIcon,
  TrendingDown as DownIcon,
  Warning as AlertIcon,
  CheckCircle as StockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Person as UserIcon,
  People as UsersIcon,
  AccessTime as ClockIcon,
  AddCircle as PlusIcon,
  Assessment as ReportIcon,
  LocalCafe as CoffeeIcon,
  LocalDrink as DrinkIcon,
  ChevronRight,
  ArrowUpward as TrendingUpIcon,
  ArrowDownward as TrendingDownIcon
} from '@mui/icons-material';
import { getAllDashboardData } from '../../services/dashboardService';

// Static data defined here
const STATIC_DASHBOARD_DATA = {
  stats: {
    totalOrders: 24,
    availableItems: 156,
    walletBalance: 0,
    monthlySales: 12450,
    totalUsers: 45,
    pendingOrders: 3
  },
  recentOrders: [
    { _id: '1', orderId: 'ORD-240123-4567', items: [{name: 'Coffee', quantity: 2}], totalAmount: 40, status: 'completed' },
    { _id: '2', orderId: 'ORD-240123-4568', items: [{name: 'Sandwich', quantity: 1}], totalAmount: 50, status: 'processing' },
    { _id: '3', orderId: 'ORD-240123-4569', items: [{name: 'Chips', quantity: 3}], totalAmount: 90, status: 'pending' },
    { _id: '4', orderId: 'ORD-240123-4570', items: [{name: 'Tea', quantity: 1}], totalAmount: 15, status: 'completed' }
  ],
  alerts: [
    { _id: '1', message: 'Coffee running low (5 units left)', type: 'warning', item: 'Coffee', currentStock: 5 },
    { _id: '2', message: '3 new orders pending', type: 'info' },
    { _id: '3', message: 'Milk stock expired', type: 'error', item: 'Milk' },
    { _id: '4', message: 'Monthly report ready', type: 'success' }
  ],
  stockStatus: {
    inStock: 65,
    lowStock: 20,
    outOfStock: 15
  }
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(STATIC_DASHBOARD_DATA);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      // Always use static data
      const data = await getAllDashboardData();
      setDashboardData(data);
    } catch (err) {
      // Fallback to static data if there's an error
      setDashboardData(STATIC_DASHBOARD_DATA);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Set static data immediately
    setDashboardData(STATIC_DASHBOARD_DATA);
    
    // Optional: Try to fetch (though it will use static data)
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'pending': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'warning': return { bgcolor: 'warning.light', borderColor: 'warning.main' };
      case 'error': return { bgcolor: 'error.light', borderColor: 'error.main' };
      case 'success': return { bgcolor: 'success.light', borderColor: 'success.main' };
      case 'info': return { bgcolor: 'info.light', borderColor: 'info.main' };
      default: return { bgcolor: 'grey.100', borderColor: 'grey.400' };
    }
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertIcon sx={{ color: 'warning.main' }} />;
      case 'error': return <AlertIcon sx={{ color: 'error.main' }} />;
      case 'success': return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'info': return <ClockIcon sx={{ color: 'info.main' }} />;
      default: return <AlertIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const quickActions = [
    { label: 'Place New Order', icon: <PlusIcon />, path: '/orders/create', color: 'primary' },
    { label: 'View Inventory', icon: <ItemIcon />, path: '/inventory', color: 'success' },
    { label: 'Add New Item', icon: <PlusIcon />, path: '/items/add', color: 'secondary' },
    { label: 'View Reports', icon: <ReportIcon />, path: '/reports', color: 'warning' }
  ];

  const data = dashboardData;

  const stats = [
    {
      title: 'Total Orders',
      value: data.stats.totalOrders,
      icon: <OrderIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      change: '+12%',
      color: 'primary.main',
      bgColor: 'primary.50',
      borderColor: 'primary.200'
    },
    {
      title: 'Available Items',
      value: data.stats.availableItems,
      icon: <ItemIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      change: '+5%',
      color: 'success.main',
      bgColor: 'success.50',
      borderColor: 'success.200'
    },
    {
      title: 'Wallet Balance',
      value: formatCurrency(user?.walletBalance || data.stats.walletBalance),
      icon: <WalletIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      change: '+8%',
      color: 'secondary.main',
      bgColor: 'secondary.50',
      borderColor: 'secondary.200'
    },
    {
      title: 'Monthly Sales',
      value: formatCurrency(data.stats.monthlySales),
      icon: <SalesIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      change: '+18%',
      color: 'warning.main',
      bgColor: 'warning.50',
      borderColor: 'warning.200'
    }
  ];

  // Admin specific stats
  if (user?.role === 'admin' || user?.role === 'manager') {
    stats.push(
      {
        title: 'Total Users',
        value: data.stats.totalUsers,
        icon: <UsersIcon sx={{ fontSize: 40, color: 'info.main' }} />,
        change: '+3%',
        color: 'info.main',
        bgColor: 'info.50',
        borderColor: 'info.200'
      },
      {
        title: 'Pending Orders',
        value: data.stats.pendingOrders,
        icon: <ClockIcon sx={{ fontSize: 40, color: 'error.main' }} />,
        change: '-2%',
        color: 'error.main',
        bgColor: 'error.50',
        borderColor: 'error.200'
      }
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      p: { xs: 2, md: 3 }
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
          gap: 2 
        }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ color: 'text.primary' }}>
              Welcome back, <Box component="span" sx={{ color: 'error.main' }}>{user?.name || 'User'}!</Box>
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              Here's what's happening with your pantry today.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              Refresh
            </Button>
            <Chip
              icon={<UserIcon />}
              label={user?.role?.toUpperCase() || 'USER'}
              variant="outlined"
              sx={{ fontWeight: 'medium' }}
            />
          </Box>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card sx={{ 
              height: '100%',
              backgroundColor: stat.bgColor,
              border: `1px solid`,
              borderColor: stat.borderColor,
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: stat.color, mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {stat.change.startsWith('+') ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      )}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 'medium',
                          color: stat.change.startsWith('+') ? 'success.main' : 'error.main'
                        }}
                      >
                        {stat.change} from last month
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    backgroundColor: 'background.paper',
                    boxShadow: 1
                  }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - 2/3 width */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Recent Alerts */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AlertIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Recent Alerts
                  </Typography>
                </Box>
                <Chip 
                  label={`${data.alerts.length} alerts`} 
                  color="error" 
                  size="small" 
                />
              </Box>
              
              <Stack spacing={2}>
                {data.alerts.map((alert) => {
                  const colors = getAlertColor(alert.type);
                  return (
                    <Box
                      key={alert._id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderLeft: `4px solid`,
                        borderColor: colors.borderColor,
                        backgroundColor: colors.bgcolor,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2
                      }}
                    >
                      {getAlertIcon(alert.type)}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.message}
                        </Typography>
                        {alert.item && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            {alert.item.toLowerCase().includes('coffee') ? 
                              <CoffeeIcon /> : 
                              <ItemIcon />
                            }
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {alert.item}
                            </Typography>
                            {alert.currentStock && (
                              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                                • {alert.currentStock} units left
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        Just now
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>

            {/* Recent Orders */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Orders
                </Typography>
                <Button 
                  endIcon={<ChevronRight />}
                  onClick={() => navigate('/orders')}
                  sx={{ color: 'error.main' }}
                >
                  View All
                </Button>
              </Box>
              
              <Stack spacing={2}>
                {data.recentOrders.map((order) => (
                  <Card 
                    key={order._id}
                    variant="outlined"
                    sx={{ 
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <OrderIcon sx={{ color: 'action.active' }} />
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {order.orderId}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                        <Chip 
                          label={order.status} 
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column - 1/3 width */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Stock Status */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <StockIcon sx={{ color: 'success.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Stock Status
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                {[
                  { label: 'In Stock', value: data.stockStatus.inStock, color: 'success' },
                  { label: 'Low Stock', value: data.stockStatus.lowStock, color: 'warning' },
                  { label: 'Out of Stock', value: data.stockStatus.outOfStock, color: 'error' }
                ].map((item, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: `${item.color}.main` }}>
                        {item.value}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.value} 
                      sx={{ 
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: `${item.color}.light`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: `${item.color}.main`,
                          borderRadius: 4
                        }
                      }} 
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Quick Actions */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Quick Actions
              </Typography>
              
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={6} key={index}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      color={action.color}
                      sx={{ 
                        py: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        '& .MuiButton-startIcon': {
                          mr: 0,
                          mb: 1
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
                        {action.label}
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* User Info Card */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #ffeaea 0%, #fff0f0 100%)',
              border: '1px solid',
              borderColor: 'error.100'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                  <UserIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {user?.name || 'User'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user?.email || 'No email'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'error.main', fontWeight: 'medium' }}>
                    {user?.role?.toUpperCase() || 'USER'}
                  </Typography>
                </Box>
              </Box>
              
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Wallet Balance
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(user?.walletBalance || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Last Login
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    Today
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;