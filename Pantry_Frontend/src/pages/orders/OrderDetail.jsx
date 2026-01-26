import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  Cancel as CancelIcon,
  CheckCircle as CompleteIcon,
  LocalShipping as ProcessingIcon,
  AccessTime as PendingIcon,
  ThumbUp as ApproveIcon
} from '@mui/icons-material'
import { fetchOrderById, updateOrderStatus, cancelOrder } from '../../store/slice/orderSlice'
import Loading from '../../components/common/Loading'
import Error from '../../components/common/Error'
import { useState } from 'react'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentOrder, loading, error } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id))
    }
  }, [id, dispatch])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon />
      case 'processing': return <ProcessingIcon />
      case 'completed': return <CompleteIcon />
      case 'cancelled': return <CancelIcon />
      default: return <PendingIcon />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'processing': return 'info'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const handleStatusUpdate = async () => {
    if (newStatus) {
      await dispatch(updateOrderStatus({ id, status: newStatus }))
      setStatusDialogOpen(false)
      setNewStatus('')
      dispatch(fetchOrderById(id))
    }
  }

  const handleQuickApprove = async () => {
    await dispatch(updateOrderStatus({ id, status: 'completed' }))
    dispatch(fetchOrderById(id))
  }

  const handleCancelOrder = async () => {
    if (cancelReason.trim()) {
      await dispatch(cancelOrder({ id, reason: cancelReason }))
      setCancelDialogOpen(false)
      setCancelReason('')
      dispatch(fetchOrderById(id))
    } else {
      alert('Please enter a cancellation reason')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  if (loading && !currentOrder) return <Loading />
  if (error) {
    console.error('Order detail error:', error)
    return <Error message={error} />
  }

  if (!currentOrder) {
    return (
      <Alert severity="info">
        Order not found. It may have been deleted or doesn't exist.
      </Alert>
    )
  }

  // FIXED: Better permission check
  const isOwner = currentOrder.user?._id === user?.id || currentOrder.user === user?.id
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'
  
  if (!isOwner && !isAdminOrManager) {
    return (
      <Alert severity="error">
        You don't have permission to view this order.
        <Button 
          sx={{ ml: 2 }} 
          size="small" 
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/orders')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Order Details: {currentOrder.orderNumber}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ReceiptIcon />}
            disabled={currentOrder.orderStatus !== 'completed'}
          >
            Download Invoice
          </Button>
          
          {currentOrder.orderStatus === 'pending' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancel Order
            </Button>
          )}
          
          {isAdminOrManager && currentOrder.orderStatus === 'pending' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={handleQuickApprove}
            >
              Approve Order
            </Button>
          )}
          
          {isAdminOrManager && currentOrder.orderStatus !== 'cancelled' && currentOrder.orderStatus !== 'completed' && (
            <Button
              variant="contained"
              onClick={() => setStatusDialogOpen(true)}
            >
              Update Status
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Order Details */}
        <Grid item xs={12} md={8}>
          {/* Order Summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Order Information
                </Typography>
                <List disablePadding>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Order Number"
                      secondary={currentOrder.orderNumber}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Order Date"
                      secondary={formatDate(currentOrder.createdAt)}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Status"
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(currentOrder.orderStatus)}
                          <Chip
                            label={currentOrder.orderStatus.toUpperCase()}
                            color={getStatusColor(currentOrder.orderStatus)}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {currentOrder.completedAt && (
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText 
                        primary="Completed At"
                        secondary={formatDate(currentOrder.completedAt)}
                      />
                    </ListItem>
                  )}
                  {currentOrder.cancelledAt && (
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText 
                        primary="Cancelled At"
                        secondary={formatDate(currentOrder.cancelledAt)}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Payment Information
                </Typography>
                <List disablePadding>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Payment Method"
                      secondary={currentOrder.paymentMethod?.toUpperCase() || 'N/A'}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Payment Status"
                      secondary={
                        <Chip
                          label={currentOrder.paymentStatus?.toUpperCase() || 'N/A'}
                          color={currentOrder.paymentStatus === 'completed' ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Subtotal"
                      secondary={`₹${currentOrder.subtotal?.toFixed(2) || '0.00'}`}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Tax"
                      secondary={`₹${currentOrder.tax?.toFixed(2) || '0.00'}`}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="Total Amount"
                      secondary={
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          ₹{currentOrder.totalAmount?.toFixed(2) || '0.00'}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            {currentOrder.notes && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Notes:</strong> {currentOrder.notes}
                </Typography>
              </Box>
            )}

            {currentOrder.cancellationReason && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Cancellation Reason:</strong> {currentOrder.cancellationReason}
              </Alert>
            )}
          </Paper>

          {/* Order Items */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Order Items
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentOrder.items?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {item.item?.name || 'Item'}
                        </Typography>
                        {item.item?.description && (
                          <Typography variant="caption" color="text.secondary">
                            {item.item.description.substring(0, 50)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1">
                          ₹{item.price || '0'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1">
                          {item.quantity || '0'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          ₹{item.total || '0'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right Column - Customer & Actions */}
        <Grid item xs={12} md={4}>
          {/* Customer Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Customer Information
            </Typography>
            
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText 
                  primary="Name"
                  secondary={currentOrder.user?.name || 'N/A'}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText 
                  primary="Email"
                  secondary={currentOrder.user?.email || 'N/A'}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText 
                  primary="Employee ID"
                  secondary={currentOrder.user?.employeeId || 'N/A'}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText 
                  primary="Department"
                  secondary={currentOrder.user?.department || 'N/A'}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Quick Actions Card */}
          {isAdminOrManager && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {currentOrder.orderStatus === 'pending' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={handleQuickApprove}
                    fullWidth
                  >
                    Approve & Complete Order
                  </Button>
                )}
                
                {currentOrder.orderStatus === 'pending' && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ProcessingIcon />}
                    onClick={() => {
                      setNewStatus('processing')
                      handleStatusUpdate()
                    }}
                    fullWidth
                  >
                    Mark as Processing
                  </Button>
                )}
                
                {currentOrder.orderStatus === 'processing' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CompleteIcon />}
                    onClick={() => {
                      setNewStatus('completed')
                      handleStatusUpdate()
                    }}
                    fullWidth
                  >
                    Mark as Completed
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  onClick={() => setStatusDialogOpen(true)}
                  fullWidth
                >
                  Other Status Options
                </Button>
              </Box>
            </Paper>
          )}

          {/* Order Timeline */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Order Timeline
            </Typography>
            
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Order Placed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(currentOrder.createdAt)}
                  </Typography>
                </Box>
              </ListItem>
              
              {currentOrder.orderStatus === 'processing' && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium" color="info.main">
                      Order Processing
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In progress
                    </Typography>
                  </Box>
                </ListItem>
              )}
              
              {currentOrder.completedAt && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium" color="success.main">
                      Order Completed
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(currentOrder.completedAt)}
                    </Typography>
                  </Box>
                </ListItem>
              )}
              
              {currentOrder.cancelledAt && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium" color="error.main">
                      Order Cancelled
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(currentOrder.cancelledAt)}
                    </Typography>
                  </Box>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 300 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Status: {currentOrder.orderStatus}
            </Typography>
            <TextField
              select
              fullWidth
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              sx={{ mt: 2 }}
            >
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained" disabled={!newStatus}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 300 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Are you sure you want to cancel order {currentOrder.orderNumber}?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Cancellation Reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              sx={{ mt: 2 }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep Order</Button>
          <Button 
            onClick={handleCancelOrder} 
            variant="contained" 
            color="error"
            disabled={!cancelReason.trim()}
          >
            Yes, Cancel Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OrderDetail