import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import Loading from '../../components/common/Loading';
import ErrorComponent from '../../components/common/Error';
import userService from '../../services/userService';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    department: '',
  });

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUserById(id);
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'user',
        department: userData.department || '',
      });
      
      // Fetch additional data
      try {
        const [transactionsData, ordersData] = await Promise.all([
          userService.getUserTransactions(id),
          userService.getUserOrders(id)
        ]);
        setTransactions(transactionsData || []);
        setOrders(ordersData || []);
      } catch (fetchError) {
        console.log('Could not fetch additional data:', fetchError);
        // We don't need to show toast for optional data
      }
      
      setError(null);
    } catch (fetchError) {
      const errorMessage = fetchError.response?.data?.message || 'Failed to fetch user details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await userService.updateUser(id, formData);
      await fetchUserDetails();
      setIsEditing(false);
      toast.success('User updated successfully');
    } catch (updateError) {
      const errorMessage = updateError.response?.data?.message || 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletUpdate = async () => {
    if (!walletAmount || isNaN(walletAmount)) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setWalletLoading(true);
      await userService.updateWallet(id, {
        amount: parseFloat(walletAmount),
        type: 'credit',
        description: 'Manual adjustment by admin'
      });
      toast.success('Wallet updated successfully');
      setWalletAmount('');
      fetchUserDetails();
    } catch (walletError) {
      const errorMessage = walletError.response?.data?.message || 'Failed to update wallet';
      toast.error(errorMessage);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      default: return 'primary';
    }
  };

  if (loading && !user) return <Loading />;
  if (error && !user) return <ErrorComponent message={error} onRetry={fetchUserDetails} />;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
          sx={{ mb: 2 }}
        >
          Back to Users
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            User Details
          </Typography>
          
          {user && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel Edit' : 'Edit User'}
            </Button>
          )}
        </Box>
      </Box>

      {user ? (
        <>
          {/* User Info Card */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}
                  >
                    {user.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{user.name}</Typography>
                    <Typography color="textSecondary">{user.email}</Typography>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {isEditing ? (
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          select
                          label="Role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          SelectProps={{ native: true }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <Button type="submit" variant="contained" sx={{ mr: 2 }}>
                          Update User
                        </Button>
                        <Button onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Name
                          </Typography>
                          <Typography>{user.name}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Email
                          </Typography>
                          <Typography>{user.email}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Phone
                          </Typography>
                          <Typography>{user.phone || 'Not provided'}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Department
                        </Typography>
                        <Typography>{user.department || 'Not assigned'}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Joined Date
                        </Typography>
                        <Typography>
                          {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </Paper>

              {/* Tabs for Transactions and Orders */}
              <Paper sx={{ p: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                  <Tab label="Transactions" />
                  <Tab label="Orders" />
                </Tabs>
                
                {activeTab === 0 && (
                  <Box sx={{ mt: 2 }}>
                    {transactions.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Description</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {transactions.map((txn, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {new Date(txn.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={txn.type}
                                    color={txn.type === 'credit' ? 'success' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>₹{txn.amount}</TableCell>
                                <TableCell>{txn.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No transactions found
                      </Alert>
                    )}
                  </Box>
                )}
                
                {activeTab === 1 && (
                  <Box sx={{ mt: 2 }}>
                    {orders.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Order ID</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {orders.map((order, index) => (
                              <TableRow key={index}>
                                <TableCell>{order.orderId || `ORD${index + 1000}`}</TableCell>
                                <TableCell>
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>₹{order.totalAmount || 0}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={order.status || 'completed'}
                                    color={
                                      (order.status === 'pending' && 'warning') ||
                                      (order.status === 'cancelled' && 'error') ||
                                      'success'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No orders found
                      </Alert>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Right Column - Stats and Wallet */}
            <Grid item xs={12} md={4}>
              {/* Wallet Card */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Wallet Balance</Typography>
                  </Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    ₹{user.walletBalance || 0}
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Add/Subtract from Wallet
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={8}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          placeholder="Enter amount"
                          value={walletAmount}
                          onChange={(e) => setWalletAmount(e.target.value)}
                          disabled={walletLoading}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={handleWalletUpdate}
                          disabled={walletLoading}
                        >
                          {walletLoading ? (
                            <CircularProgress size={20} />
                          ) : (
                            'Update'
                          )}
                        </Button>
                      </Grid>
                    </Grid>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      Positive amount adds, negative subtracts
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">User Statistics</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Total Orders
                    </Typography>
                    <Typography variant="h5">{orders.length}</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Total Spent
                    </Typography>
                    <Typography variant="h5">
                      ₹{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Average Order Value
                    </Typography>
                    <Typography variant="h5">
                      ₹{orders.length > 0 ? 
                        Math.round(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length) : 
                        0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Status
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'error'}
                    />
                    <Typography variant="body2" color="textSecondary">
                      Last Active: {new Date(user.lastLogin || Date.now()).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <Alert severity="error">User not found</Alert>
      )}
    </Container>
  );
};

export default UserDetail;