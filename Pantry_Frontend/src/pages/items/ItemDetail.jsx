import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  LinearProgress
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  ShoppingCart as CartIcon,
  Category as CategoryIcon,
  AttachMoney as PriceIcon,
  Inventory as StockIcon,
  LocalOffer as TagIcon,
  Restaurant as UnitIcon
} from '@mui/icons-material'
import { fetchItemById } from '../../store/slice/itemSlice'
import Loading from '../../components/common/Loading'
import Error from '../../components/common/Error'

const ItemDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentItem, loading, error } = useSelector((state) => state.items)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (id) {
      dispatch(fetchItemById(id))
    }
  }, [id, dispatch])

  if (loading) return <Loading />
  if (error) return <Error message={error} />

  if (!currentItem) {
    return (
      <Alert severity="info">
        Item not found. It may have been deleted or doesn't exist.
      </Alert>
    )
  }

  const handleOrder = () => {
    navigate('/orders/create', { state: { selectedItem: currentItem } })
  }

  const handleEdit = () => {
    navigate(`/items/edit/${id}`)
  }

  const getStockPercentage = () => {
    const { currentStock = 0, maxStockLevel = 100 } = currentItem // ✅ FIX: Removed unused minStockLevel
    if (currentStock === 0) return 0
    return Math.min((currentStock / maxStockLevel) * 100, 100)
  }

  const getStockColor = () => {
    const stockStatus = currentItem.stockStatus
    switch (stockStatus) {
      case 'in-stock': return 'success'
      case 'low-stock': return 'warning'
      case 'out-of-stock': return 'error'
      case 'expired': return 'error'
      default: return 'info'
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/items')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {currentItem.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<CartIcon />}
            onClick={handleOrder}
            disabled={currentItem.stockStatus === 'out-of-stock'}
          >
            Order Now
          </Button>
          
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit Item
            </Button>
          )}
        </Box>
      </Box>

      {/* ✅ FIXED: MUI Grid v6 syntax */}
      <Grid container spacing={3}>
        {/* Left Column - Main Details */}
        <Grid item size={{ xs: 12, md: 8 }}> {/* ✅ Changed to size prop */}
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Item Image */}
            <Box
              sx={{
                width: '100%',
                height: 300,
                borderRadius: 2,
                backgroundColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                overflow: 'hidden'
              }}
            >
              {currentItem.image ? (
                <img 
                  src={currentItem.image} 
                  alt={currentItem.name}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                />
              ) : (
                <Typography variant="h1" color="text.secondary">
                  {currentItem.name.charAt(0)}
                </Typography>
              )}
            </Box>

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {currentItem.description || 'No description available.'}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Nutritional Info */}
            {currentItem.nutritionalInfo && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Nutritional Information (per serving)
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(currentItem.nutritionalInfo).map(([key, value]) => (
                    <Grid item size={{ xs: 6, sm: 3 }} key={key}> {/* ✅ Changed to size prop */}
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                            {key}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {value}g
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Tags */}
            {currentItem.tags && currentItem.tags.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentItem.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      icon={<TagIcon />}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Side Info */}
        <Grid item size={{ xs: 12, md: 4 }}> {/* ✅ Changed to size prop */}
          {/* Basic Info Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Item Details
            </Typography>
            
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1 }}>
                <CategoryIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Category"
                  secondary={currentItem.category?.name || 'Uncategorized'}
                />
              </ListItem>
              
              <ListItem disablePadding sx={{ py: 1 }}>
                <PriceIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Price"
                  secondary={
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      ₹{currentItem.price} per {currentItem.unit}
                    </Typography>
                  }
                />
              </ListItem>
              
              <ListItem disablePadding sx={{ py: 1 }}>
                <UnitIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Unit"
                  secondary={currentItem.unit}
                />
              </ListItem>
              
              <ListItem disablePadding sx={{ py: 1 }}>
                <StockIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Cost Price"
                  secondary={`₹${currentItem.costPrice || 'N/A'}`}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Stock Status Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Stock Status
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Stock
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {currentItem.currentStock || 0} {currentItem.unit}s
                </Typography>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={getStockPercentage()} 
                color={getStockColor()}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Min: {currentItem.minStockLevel || 10}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Max: {currentItem.maxStockLevel || 100}
                </Typography>
              </Box>
            </Box>
            
            <Chip
              label={currentItem.stockStatus?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
              color={getStockColor()}
              size="medium"
              sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
            />
          </Paper>

          {/* Vendor Info */}
          {currentItem.vendor && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Vendor Information
              </Typography>
              
              <List disablePadding>
                {currentItem.vendor.name && (
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="Name"
                      secondary={currentItem.vendor.name}
                    />
                  </ListItem>
                )}
                
                {currentItem.vendor.contact && (
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="Contact"
                      secondary={currentItem.vendor.contact}
                    />
                  </ListItem>
                )}
                
                {currentItem.vendor.email && (
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="Email"
                      secondary={currentItem.vendor.email}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Profit Margin Info (Admin/Manager only) */}
      {(user?.role === 'admin' || user?.role === 'manager') && currentItem.costPrice && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Business Information
          </Typography>
          
          {/* ✅ FIXED: MUI Grid v6 syntax */}
          <Grid container spacing={3}>
            <Grid item size={{ xs: 12, md: 4 }}> {/* ✅ Changed to size prop */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Cost Price
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹{currentItem.costPrice}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item size={{ xs: 12, md: 4 }}> {/* ✅ Changed to size prop */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Selling Price
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    ₹{currentItem.price}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item size={{ xs: 12, md: 4 }}> {/* ✅ Changed to size prop */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Profit Margin
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold" 
                    color={currentItem.price > currentItem.costPrice ? 'success.main' : 'error.main'}
                  >
                    {((currentItem.price - currentItem.costPrice) / currentItem.costPrice * 100).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  )
}

export default ItemDetail