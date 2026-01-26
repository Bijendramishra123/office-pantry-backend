import { useEffect, useState, useCallback } from 'react'
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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material'
import { fetchItems, deleteItem } from '../../store/slice/itemSlice'
import Loading from '../../components/common/Loading'
import Error from '../../components/common/Error'

const ItemList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, loading, error, pagination } = useSelector((state) => state.items)
  const { user: currentUser } = useSelector((state) => state.auth)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchItemsData = useCallback(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm || undefined,
      category: categoryFilter || undefined,
      availableOnly: statusFilter === 'available' ? true : undefined
    }
    dispatch(fetchItems(params))
  }, [dispatch, page, rowsPerPage, searchTerm, categoryFilter, statusFilter])

  useEffect(() => {
    fetchItemsData()
  }, [fetchItemsData])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearch = () => {
    setPage(0)
    fetchItemsData()
  }

  const handleView = (id) => {
    navigate(`/items/${id}`)
  }

  const handleEdit = (id) => {
    navigate(`/items/edit/${id}`)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await dispatch(deleteItem(id))
      fetchItemsData()
    }
  }

  const handleOrder = (item) => {
    navigate('/orders/create', { state: { selectedItem: item } })
  }

  const getStockStatusChip = (stockStatus) => {
    const statusConfig = {
      'in-stock': { label: 'In Stock', color: 'success' },
      'low-stock': { label: 'Low Stock', color: 'warning' },
      'out-of-stock': { label: 'Out of Stock', color: 'error' },
      'expired': { label: 'Expired', color: 'error' }
    }

    const config = statusConfig[stockStatus] || { label: 'Unknown', color: 'default' }
    return (
      <Chip
        label={config.label}
        size="small"
        color={config.color}
        variant="outlined"
      />
    )
  }

  // ✅ Check if user is employee (should see Place Order button)
  const isEmployee = currentUser?.role === 'employee'
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  if (loading && (!items || items.length === 0)) return <Loading />
  if (error) return <Error message={error} onRetry={fetchItemsData} />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Items
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/items/add')}
            >
              Add Item
            </Button>
          )}
          
          {/* ✅ FIXED: Only show "Place Order" button for employees */}
          {isEmployee && (
            <Button
              variant="outlined"
              startIcon={<CartIcon />}
              onClick={() => navigate('/orders/create')}
            >
              Place Order
            </Button>
          )}
        </Box>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search items..."
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
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Beverages">Beverages</MenuItem>
                <MenuItem value="Snacks">Snacks</MenuItem>
                <MenuItem value="Breakfast">Breakfast</MenuItem>
                <MenuItem value="Lunch">Lunch</MenuItem>
                <MenuItem value="Dairy">Dairy</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="out-of-stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<FilterIcon />}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Items Grid/Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!items || items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No items found. {isAdminOrManager ? 'Add your first item!' : ''}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 1,
                          backgroundColor: 'grey.100',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          <Typography variant="h6" color="text.secondary">
                            {item.name?.charAt(0) || 'I'}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {item.name || 'Unnamed Item'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.description?.substring(0, 50) || 'No description'}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.category?.name || 'Uncategorized'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      ₹{item.price || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per {item.unit || 'unit'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {item.currentStock || 0} {item.unit || 'unit'}s
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStockStatusChip(item.stockStatus)}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleView(item._id)}
                        title="View"
                      >
                        <ViewIcon />
                      </IconButton>
                      
                      {/* ✅ FIXED: Only show "Order" button for employees */}
                      {isEmployee && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOrder(item)}
                          title="Order"
                          disabled={item.stockStatus === 'out-of-stock'}
                        >
                          <CartIcon />
                        </IconButton>
                      )}

                      {isAdminOrManager && (
                        <>
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleEdit(item._id)}
                            title="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(item._id)}
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
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

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {pagination?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Stock
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {items?.filter(item => item.stockStatus === 'in-stock').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Low Stock
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {items?.filter(item => item.stockStatus === 'low-stock').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Out of Stock
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {items?.filter(item => item.stockStatus === 'out-of-stock').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ItemList