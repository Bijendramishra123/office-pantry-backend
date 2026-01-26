import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import Loading from '../../components/common/Loading';
import ErrorComponent from '../../components/common/Error';
import userService from '../../services/userService';

const UserList = () => {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsersData = async () => {  // ✅ Changed name to avoid conflict
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      
      // ✅ FIX: Check response structure
      console.log('👥 [UserList] API Response:', response);
      
      let usersData = [];
      
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && response.data.users) {
        usersData = response.data.users;
      } else if (response.users) {
        usersData = response.users;
      }
      
      console.log('✅ [UserList] Extracted users:', usersData.length);
      setUsers(usersData || []);
      setError(null);
      toast.success('Users loaded successfully');
    } catch (fetchError) {
      console.error('❌ [UserList] Fetch error:', fetchError);
      const errorMessage = fetchError.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // ✅ TEMPORARY: For testing, add dummy data
      setUsers([
        {
          _id: '1',
          name: 'Admin User',
          email: 'admin@office.com',
          role: 'admin',
          department: 'Management',
          walletBalance: 10000,
          isActive: true,
          employeeId: 'ADM001'
        },
        {
          _id: '2',
          name: 'Manager User',
          email: 'manager@office.com',
          role: 'manager',
          department: 'Operations',
          walletBalance: 5000,
          isActive: true,
          employeeId: 'MGR001'
        },
        {
          _id: '3',
          name: 'Employee User',
          email: 'employee@office.com',
          role: 'employee',
          department: 'IT',
          walletBalance: 2000,
          isActive: true,
          employeeId: 'EMP001'
        }
      ]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleFilterRole = (e) => {
    setFilterRole(e.target.value);
    setPage(0);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await userService.deleteUser(selectedUser._id);
      setUsers(users.filter(user => user._id !== selectedUser._id));
      toast.success('User deleted successfully');
    } catch (deleteError) {
      const errorMessage = deleteError.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.department?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      default: return 'primary';
    }
  };

  if (loading && users.length === 0) return <Loading />;
  if (error && users.length === 0) return <ErrorComponent message={error} onRetry={fetchUsersData} />;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Users Management
          </Typography>
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchUsersData}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/users/add')}
            >
              Add New User
            </Button>
          </Box>
        </Box>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search users by name, email or department..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Filter by Role"
                  onChange={handleFilterRole}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="textSecondary">
                  Total: {filteredUsers.length} users
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Showing: {Math.min(filteredUsers.length, rowsPerPage)} per page
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>Wallet Balance</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{ mr: 2, bgcolor: 'primary.main' }}
                          >
                            {user.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {user.name || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {user.employeeId || user._id?.slice(-6) || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email || 'No email'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role || 'user'}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.department || '—'}</TableCell>
                      <TableCell>
                        <Typography 
                          fontWeight="medium" 
                          color={user.walletBalance > 0 ? 'success.main' : 'text.primary'}
                        >
                          ₹{user.walletBalance || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/users/${user._id}`)}
                          title="View Details"
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/users/edit/${user._id}`)}
                          title="Edit User"
                          color="secondary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(user)}
                          title="Delete User"
                          color="error"
                          disabled={user.role === 'admin'}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchTerm || filterRole !== 'all' 
                        ? 'No users match your search criteria' 
                        : 'No users found. Add your first user!'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Users per page:"
          />
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>"{selectedUser?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This action cannot be undone. All user data including orders and transactions will be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={selectedUser?.role === 'admin'}
          >
            {selectedUser?.role === 'admin' ? 'Cannot Delete Admin' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserList;