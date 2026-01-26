import { useEffect, useState } from 'react'
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
  CardContent,
  Alert,
  LinearProgress
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Inventory as InventoryIcon,
  Update as UpdateIcon
} from '@mui/icons-material'
import { fetchInventory, fetchAlerts } from '../../store/slice/inventorySlice'
import Loading from '../../components/common/Loading'
import Error from '../../components/common/Error'

const InventoryList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { inventory, alerts, loading, error, stats } = useSelector((state) => state.inventory)
  const { user } = useSelector((state) => state.auth)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewAlerts, setViewAlerts] = useState(false)

  useEffect(() => {
    fetchInventoryData()
    if (user?.role === 'admin' || user?.role === 'manager') {
      dispatch(fetchAlerts())
    }
  }, [])

  useEffect(() => {
    if (!viewAlerts) {
      fetchInventoryData()
    }
  }, [page, rowsPerPage, viewAlerts])

  const fetchInventoryData = () => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter || undefined
    }
    dispatch(fetchInventory(params))
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearch = () => {
    setPage(0)
    fetchInventoryData()
  }

  const getStatusChip = (status) => {
    const statusConfig = {
      'in-stock': { label: 'In Stock', color: 'success', icon: <CheckIcon /> },
      'low-stock': { label: 'Low Stock', color: 'warning', icon: <WarningIcon /> },
      'out-of-stock': { label: 'Out of Stock', color: 'error', icon: <ErrorIcon /> },
      'expired': { label: 'Expired', color: 'error', icon: <ErrorIcon /> }
    }

    const config = statusConfig[status] || { label: 'Unknown', color: 'default', icon: <ErrorIcon /> }
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        color={config.color}
        variant="outlined"
      />
    )
  }

  const getStockPercentage = (quantity, minLevel, maxLevel) => {
    if (quantity === 0) return 0
    return Math.min((quantity / maxLevel) * 100, 100)
  }

  const handleUpdateStock = (itemId) => {
    navigate('/inventory/update', { state: { itemId } })
  }

  if (loading && inventory.length === 0) return <Loading />
  if (error) return <Error message={error} onRetry={fetchInventoryData} />

  const displayData = viewAlerts ? [...alerts.lowStock, ...alerts.expired, ...alerts.outOfStock] : inventory

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Inventory Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UpdateIcon />}
            onClick={() => navigate('/inventory/update')}
          >
            Update Stock
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography color="text.secondary">
                  Total Items
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography color="text.secondary">
                  Low Stock
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.lowStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography color="text.secondary">
                  Out of Stock
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.outOfStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography color="text.secondary">
                  Expired
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.expired}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="in-stock">In Stock</MenuItem>
                <MenuItem value="low-stock">Low Stock</MenuItem>
                <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant={viewAlerts ? 'contained' : 'outlined'}
              color="warning"
              onClick={() => setViewAlerts(!viewAlerts)}
              startIcon={<WarningIcon />}
            >
              {viewAlerts ? 'View All' : 'View Alerts'}
            </Button>
          </Grid>

          <Grid item xs={12} md={3}>
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
      </Paper>

      {/* Alerts Section */}
      {viewAlerts && (
        <Box sx={{ mb: 3 }}>
          {alerts.lowStock.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Low Stock Alerts:</strong> {alerts.lowStock.length} items need restocking
            </Alert>
          )}
          
          {alerts.outOfStock.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>Out of Stock:</strong> {alerts.outOfStock.length} items are out of stock
            </Alert>
          )}
          
          {alerts.expired.length > 0 && (
            <Alert severity="error">
              <strong>Expired Items:</strong> {alerts.expired.length} items have expired
            </Alert>
          )}
          
          {alerts.lowStock.length === 0 && alerts.outOfStock.length === 0 && alerts.expired.length === 0 && (
            <Alert severity="success">
              No alerts at the moment. All items are properly stocked.
            </Alert>
          )}
        </Box>
      )}

      {/* Inventory Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Stock Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {viewAlerts ? 'No alerts found.' : 'No inventory items found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((item) => (
                <TableRow key={item._id || item.item?._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          backgroundColor: 'grey.100',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <InventoryIcon color="action" />
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {item.item?.name || item.name || 'Unknown Item'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Min: {item.item?.minStockLevel || 10}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.item?.category?.name || 'Uncategorized'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      {item.quantity || 0} {item.item?.unit || 'units'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ minWidth: 100 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={getStockPercentage(
                          item.quantity, 
                          item.item?.minStockLevel || 10,
                          item.item?.maxStockLevel || 100
                        )} 
                        color={
                          item.status === 'in-stock' ? 'success' :
                          item.status === 'low-stock' ? 'warning' : 'error'
                        }
                        sx={{ height: 8, borderRadius: 4, mb: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(getStockPercentage(
                          item.quantity, 
                          item.item?.minStockLevel || 10,
                          item.item?.maxStockLevel || 100
                        ))}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(item.status)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.location || 'Main Pantry'}
                    </Typography>
                    {item.expiryDate && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Expires: {new Date(item.expiryDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleUpdateStock(item.item?._id || item._id)}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {!viewAlerts && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={stats.totalItems || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/items')}
            >
              View All Items
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setViewAlerts(true)}
              color="warning"
            >
              View All Alerts
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/inventory/update')}
              color="primary"
            >
              Bulk Update
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchInventoryData}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default InventoryList
