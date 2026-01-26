import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Chip,
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
import { fetchItems } from '../../store/slice/itemSlice'
import { createOrder } from '../../store/slice/orderSlice'
import Loading from '../../components/common/Loading'

// ✅ Create AlertComponent separately
const AlertComponent = React.forwardRef(function Alert(props, ref) {
  return <Alert elevation={6} ref={ref} variant="filled" {...props} />
})

const CreateOrder = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { items, loading: itemsLoading } = useSelector((state) => state.items)
  const { loading: orderLoading, error } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('wallet')
  const [notes, setNotes] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })

  const addToCart = (item) => {
    console.log('🛒 Adding to cart:', item)
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id)
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...prevCart, { ...item, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== itemId))
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId)
      return
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.05 // 5% tax
    const total = subtotal + tax
    
    return { subtotal, tax, total }
  }

  const handleSubmitOrder = async () => {
    console.log('🚀 Submitting order...')
    console.log('🛒 Cart items:', cart)
    console.log('👤 User:', user)
    
    if (cart.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please add items to cart',
        severity: 'warning'
      })
      return
    }

    // ✅ Format items correctly for backend
    const orderItems = cart.map(item => ({
      itemId: item._id,
      quantity: item.quantity,
      price: item.price,
      name: item.name
    }))

    const orderData = {
      items: orderItems,
      paymentMethod,
      notes: notes || undefined
    }

    console.log('📤 Order data being sent:', orderData)

    try {
      // ✅ Use dispatch and check the result properly
      const resultAction = await dispatch(createOrder(orderData))
      
      // ✅ Check if the action was fulfilled
      if (createOrder.fulfilled.match(resultAction)) {
        const result = resultAction.payload
        console.log('✅ Order creation result:', result)
        
        // ✅ Check backend response structure
        if (result && result.success) {
          setSnackbar({
            open: true,
            message: `Order #${result.orderNumber || result.data?.orderNumber} created successfully! Total: ₹${result.totalAmount || result.data?.totalAmount}`,
            severity: 'success'
          })
          
          // Clear cart
          setCart([])
          setNotes('')
          
          // Navigate after delay
          setTimeout(() => {
            navigate('/orders')
          }, 2000)
        } else {
          // Backend returned success: false
          setSnackbar({
            open: true,
            message: result?.message || 'Order creation failed',
            severity: 'error'
          })
        }
      } else if (createOrder.rejected.match(resultAction)) {
        // Action was rejected
        setSnackbar({
          open: true,
          message: resultAction.payload || 'Order creation failed',
          severity: 'error'
        })
      }
      
    } catch (error) {
      console.error('❌ Order creation failed:', error)
      
      const errorMessage = error.message || 
                       error.response?.data?.message || 
                       'Failed to create order. Please try again.'
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
    }
  }

  useEffect(() => {
    dispatch(fetchItems({ availableOnly: true }))
    
    // ✅ Fix: Use setTimeout to avoid synchronous state update
    if (location.state?.selectedItem) {
      setTimeout(() => {
        addToCart(location.state.selectedItem)
      }, 0)
    }
  }, [dispatch, location])

  const { subtotal, tax, total } = calculateTotals()
  const walletBalance = user?.walletBalance || 0
  const insufficientBalance = paymentMethod === 'wallet' && total > walletBalance

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  if (itemsLoading) return <Loading />

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/items')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Create New Order
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Available Items */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Available Items
            </Typography>
            
            {items && items.length === 0 ? (
              <Alert severity="info">
                No items available at the moment.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {items
                  .filter(item => item.isAvailable && item.stockStatus !== 'out-of-stock')
                  .map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item._id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 3 }
                        }}
                        onClick={() => addToCart(item)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="body1" fontWeight="medium" gutterBottom>
                                {item.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {item.category?.name || 'Uncategorized'}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${item.currentStock || 0} left`}
                              size="small"
                              color={item.stockStatus === 'low-stock' ? 'warning' : 'success'}
                            />
                          </Box>
                          
                          <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
                            ₹{item.price}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              per {item.unit}
                            </Typography>
                          </Typography>
                          
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={(e) => {
                              e.stopPropagation()
                              addToCart(item)
                            }}
                            disabled={item.currentStock <= 0}
                          >
                            {item.currentStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                }
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Cart & Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CartIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Your Cart ({cart.length} items)
              </Typography>
            </Box>

            {cart.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Your cart is empty. Add items from the left.
              </Alert>
            ) : (
              <TableContainer sx={{ maxHeight: 300, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <Typography variant="body2">
                            {item.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              disabled={item.quantity >= (item.currentStock || 0)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ₹{item.price * item.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFromCart(item._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Order Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Order Summary
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">₹{subtotal.toFixed(2)}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Tax (5%)</Typography>
                <Typography variant="body2">₹{tax.toFixed(2)}</Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">Total</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  ₹{total.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Payment Method */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                label="Payment Method"
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="wallet">Wallet (Balance: ₹{walletBalance})</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
              </Select>
            </FormControl>

            {paymentMethod === 'wallet' && insufficientBalance && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Insufficient wallet balance. Please add ₹{(total - walletBalance).toFixed(2)} to your wallet or choose another payment method.
              </Alert>
            )}

            {/* Notes */}
            <TextField
              fullWidth
              label="Order Notes (Optional)"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 3 }}
            />

            {/* Action Buttons */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || orderLoading || insufficientBalance}
              sx={{ py: 1.5 }}
            >
              {orderLoading ? 'Processing...' : `Place Order - ₹${total.toFixed(2)}`}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate('/items')}
              sx={{ mt: 1, py: 1.5 }}
            >
              Continue Shopping
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <AlertComponent onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </AlertComponent>
      </Snackbar>
    </Box>
  )
}

export default CreateOrder