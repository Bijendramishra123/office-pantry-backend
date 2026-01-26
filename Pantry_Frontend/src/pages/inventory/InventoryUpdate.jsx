import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { updateStock, bulkUpdateStock, fetchInventory } from '../../store/slice/inventorySlice'
import { fetchItems } from '../../store/slice/itemSlice'
import Loading from '../../components/common/Loading'
import toast from 'react-hot-toast'

const InventoryUpdate = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { items, loading: itemsLoading } = useSelector((state) => state.items)
  const { loading, error } = useSelector((state) => state.inventory)
  const { user } = useSelector((state) => state.auth)

  // Check if user has permission
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      navigate('/inventory')
    }
  }, [user, navigate])

  const [updateType, setUpdateType] = useState('single') // 'single' or 'bulk'
  const [singleUpdate, setSingleUpdate] = useState({
    itemId: location.state?.itemId || '',
    quantity: '',
    operation: 'add',
    expiryDate: '',
    batchNumber: '',
    notes: ''
  })
  const [bulkUpdates, setBulkUpdates] = useState([{ itemId: '', quantity: '' }])

  useEffect(() => {
    dispatch(fetchItems())
  }, [dispatch])

  const handleSingleChange = (e) => {
    const { name, value } = e.target
    setSingleUpdate(prev => ({ ...prev, [name]: value }))
  }

  const handleBulkChange = (index, field, value) => {
    const newUpdates = [...bulkUpdates]
    newUpdates[index][field] = value
    setBulkUpdates(newUpdates)
  }

  const addBulkRow = () => {
    setBulkUpdates([...bulkUpdates, { itemId: '', quantity: '' }])
  }

  const removeBulkRow = (index) => {
    if (bulkUpdates.length > 1) {
      const newUpdates = [...bulkUpdates]
      newUpdates.splice(index, 1)
      setBulkUpdates(newUpdates)
    }
  }

  const handleSingleSubmit = async (e) => {
    e.preventDefault()
    
    if (!singleUpdate.itemId || !singleUpdate.quantity) {
      toast.error('Please select an item and enter quantity')
      return
    }

    const submitData = {
      ...singleUpdate,
      quantity: parseInt(singleUpdate.quantity)
    }

    const result = await dispatch(updateStock(submitData))
    if (result.type === 'inventory/updateStock/fulfilled') {
      toast.success('Stock updated successfully')
      setSingleUpdate({
        itemId: '',
        quantity: '',
        operation: 'add',
        expiryDate: '',
        batchNumber: '',
        notes: ''
      })
      dispatch(fetchInventory())
    }
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    
    // Filter out empty rows
    const validUpdates = bulkUpdates.filter(update => update.itemId && update.quantity)
    
    if (validUpdates.length === 0) {
      toast.error('Please add at least one valid update')
      return
    }

    const submitData = validUpdates.map(update => ({
      itemId: update.itemId,
      quantity: parseInt(update.quantity)
    }))

    const result = await dispatch(bulkUpdateStock(submitData))
    if (result.type === 'inventory/bulkUpdateStock/fulfilled') {
      toast.success(`Updated ${validUpdates.length} items successfully`)
      setBulkUpdates([{ itemId: '', quantity: '' }])
      dispatch(fetchInventory())
    }
  }

  if (itemsLoading) return <Loading />

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/inventory')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Update Inventory
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Update Type Toggle */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="body1" fontWeight="medium">
              Update Type:
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant={updateType === 'single' ? 'contained' : 'outlined'}
                onClick={() => setUpdateType('single')}
              >
                Single Item Update
              </Button>
              <Button
                fullWidth
                variant={updateType === 'bulk' ? 'contained' : 'outlined'}
                onClick={() => setUpdateType('bulk')}
              >
                Bulk Update
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {updateType === 'single' ? (
        /* Single Item Update Form */
        <Paper component="form" onSubmit={handleSingleSubmit} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Update Single Item
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Item</InputLabel>
                <Select
                  name="itemId"
                  value={singleUpdate.itemId}
                  label="Select Item"
                  onChange={handleSingleChange}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Select an item</em>
                  </MenuItem>
                  {items.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name} ({item.currentStock || 0} in stock)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Quantity"
                name="quantity"
                type="number"
                value={singleUpdate.quantity}
                onChange={handleSingleChange}
                disabled={loading}
                helperText="Enter quantity to add/subtract/set"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Operation</InputLabel>
                <Select
                  name="operation"
                  value={singleUpdate.operation}
                  label="Operation"
                  onChange={handleSingleChange}
                  disabled={loading}
                >
                  <MenuItem value="add">Add Stock</MenuItem>
                  <MenuItem value="subtract">Subtract Stock</MenuItem>
                  <MenuItem value="set">Set Stock Level</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Batch Number"
                name="batchNumber"
                value={singleUpdate.batchNumber}
                onChange={handleSingleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiryDate"
                type="date"
                value={singleUpdate.expiryDate}
                onChange={handleSingleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={singleUpdate.notes}
                onChange={handleSingleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/inventory')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Updating...' : 'Update Stock'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        /* Bulk Update Form */
        <Paper component="form" onSubmit={handleBulkSubmit} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Bulk Update Items
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addBulkRow}
              disabled={loading}
            >
              Add Row
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="60%">Item</TableCell>
                  <TableCell width="30%">New Quantity</TableCell>
                  <TableCell width="10%" align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkUpdates.map((update, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <InputLabel>Select Item</InputLabel>
                        <Select
                          value={update.itemId}
                          label="Select Item"
                          onChange={(e) => handleBulkChange(index, 'itemId', e.target.value)}
                          disabled={loading}
                        >
                          <MenuItem value="">
                            <em>Select an item</em>
                          </MenuItem>
                          {items.map((item) => (
                            <MenuItem key={item._id} value={item._id}>
                              {item.name} (Current: {item.currentStock || 0})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        label="Quantity"
                        type="number"
                        value={update.quantity}
                        onChange={(e) => handleBulkChange(index, 'quantity', e.target.value)}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeBulkRow(index)}
                        disabled={loading || bulkUpdates.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ mb: 3 }}>
            Note: Bulk update will set the quantity to the specified value for each item.
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/inventory')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Updating...' : 'Bulk Update'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Recent Items Card */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Recent Inventory Items
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          {items.slice(0, 6).map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium" gutterBottom>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current: {item.currentStock || 0} {item.unit}s
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setUpdateType('single')
                        setSingleUpdate(prev => ({ ...prev, itemId: item._id }))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      Update
                    </Button>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Min: {item.minStockLevel || 10} | Max: {item.maxStockLevel || 100}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  )
}

export default InventoryUpdate
