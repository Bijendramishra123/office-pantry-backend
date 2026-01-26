// OrderList.js - FINAL VERSION (NO SOCKET, ONLY POLLING)
import { useEffect, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material'
import { fetchUserOrders, cancelOrder } from '../../store/slice/orderSlice'
import Loading from '../../components/common/Loading'
import Error from '../../components/common/Error'

const OrderList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { orders, loading, error, pagination } = useSelector((state) => state.orders)
  
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [lastUpdate, setLastUpdate] = useState(0)
  
  const initialMount = useRef(true)

  const fetchOrdersData = useCallback(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter || undefined
    }
    
    dispatch(fetchUserOrders(params))
  }, [dispatch, page, rowsPerPage, statusFilter])

  // Initial fetch
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      fetchOrdersData()
      // Set initial timestamp AFTER render
      const timer = setTimeout(() => {
        setLastUpdate(Date.now())
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [fetchOrdersData])

  // Polling setup - NO synchronous state updates
  useEffect(() => {
    const interval = setInterval(() => {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined
      }
      dispatch(fetchUserOrders(params))
    }, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [page, rowsPerPage, statusFilter, dispatch])

  // Update timestamp separately to avoid cascade
  useEffect(() => {
    if (!initialMount.current) {
      const timer = setTimeout(() => {
        setLastUpdate(Date.now())
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [orders]) // Update timestamp when orders change

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearch = () => {
    setPage(0)
    fetchOrdersData()
  }

  const handleViewOrder = (id) => {
    navigate(`/orders/${id}`)
  }

  const handleCancelOrder = async (id) => {
    const reason = prompt('Please enter cancellation reason:')
    if (reason) {
      await dispatch(cancelOrder({ id, reason }))
      fetchOrdersData()
    }
  }

  const handleManualRefresh = () => {
    fetchOrdersData()
  }

  const getStatusChip = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', color: 'warning' },
      'processing': { label: 'Processing', color: 'info' },
      'completed': { label: 'Completed', color: 'success' },
      'cancelled': { label: 'Cancelled', color: 'error' }
    }

    const config = statusConfig[status] || { label: 'Unknown', color: 'default' }
    return (
      <Chip
        label={config.label}
        size="small"
        color={config.color}
      />
    )
  }

  const getPaymentStatusChip = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', color: 'warning' },
      'completed': { label: 'Paid', color: 'success' },
      'failed': { label: 'Failed', color: 'error' },
      'refunded': { label: 'Refunded', color: 'info' }
    }

    const config = statusConfig[status] || { label: 'Unknown', color: 'default' }
    return (
      <Chip
        label={config.label}
        size="small"
        variant="outlined"
      />
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'Never'
    try {
      return new Date(timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Time'
    }
  }

  if (loading && (!orders || orders.length === 0)) return <Loading />
  if (error) return <Error message={error} onRetry={fetchOrdersData} />

  const totalSpent = orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0
  const pendingOrders = orders?.filter(order => order.orderStatus === 'pending').length || 0
  const completedOrders = orders?.filter(order => order.orderStatus === 'completed').length || 0

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Orders
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleManualRefresh}
          >
            Refresh Orders
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/orders/create')}
          >
            New Order
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {orders?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Spent
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                ₹{totalSpent.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {pendingOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {completedOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search by order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setPage(0)
                handleManualRefresh()
              }}
              startIcon={<RefreshIcon />}
            >
              Reset
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<FilterIcon />}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
        
        {lastUpdate > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Last updated: {formatTime(lastUpdate)}
            <span style={{ marginLeft: '10px', fontSize: '0.8em' }}>
              (Auto-refresh every 30 seconds)
            </span>
          </Typography>
        )}
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!orders || orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No orders found. Create your first order!
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/orders/create')}
                    sx={{ mt: 2 }}
                  >
                    Place New Order
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {order.orderNumber || `ORD-${order._id?.slice(-6)}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.items?.[0]?.item?.name || 'Item'} {order.items?.length > 1 ? `+${order.items.length - 1} more` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      ₹{(order.totalAmount || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(order.orderStatus)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusChip(order.paymentStatus)}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {order.paymentMethod || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewOrder(order._id)}
                        title="View Details"
                      >
                        <ViewIcon />
                      </IconButton>
                      
                      {order.orderStatus === 'pending' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelOrder(order._id)}
                          title="Cancel Order"
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                      
                      <IconButton
                        size="small"
                        color="secondary"
                        title="Invoice"
                        disabled={order.orderStatus !== 'completed'}
                      >
                        <ReceiptIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  )
}

export default OrderList