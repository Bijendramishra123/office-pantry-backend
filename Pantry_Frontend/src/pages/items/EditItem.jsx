import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
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
  Chip,
  IconButton,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { fetchItemById, updateItem } from '../../store/slice/itemSlice'
import Loading from '../../components/common/Loading'

const EditItem = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentItem, loading: reduxLoading, error } = useSelector((state) => state.items)
  const { user } = useSelector((state) => state.auth)

  // ✅ Add local loading state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user has permission
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      navigate('/items')
    }
  }, [user, navigate])

  useEffect(() => {
    if (id) {
      dispatch(fetchItemById(id))
    }
  }, [id, dispatch])

  const [formData, setFormData] = useState(null)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (currentItem) {
      setFormData({
        name: currentItem.name || '',
        description: currentItem.description || '',
        category: currentItem.category?._id || currentItem.category || '',
        price: currentItem.price || '',
        costPrice: currentItem.costPrice || '',
        unit: currentItem.unit || 'piece',
        minStockLevel: currentItem.minStockLevel || '10',
        maxStockLevel: currentItem.maxStockLevel || '100',
        isAvailable: currentItem.isAvailable ?? true,
        tags: currentItem.tags || [],
        nutritionalInfo: {
          calories: currentItem.nutritionalInfo?.calories || '',
          protein: currentItem.nutritionalInfo?.protein || '',
          carbs: currentItem.nutritionalInfo?.carbs || '',
          fat: currentItem.nutritionalInfo?.fat || ''
        },
        vendor: {
          name: currentItem.vendor?.name || '',
          contact: currentItem.vendor?.contact || '',
          email: currentItem.vendor?.email || ''
        }
      })
    }
  }, [currentItem])

  const units = [
    { value: 'piece', label: 'Piece' },
    { value: 'pack', label: 'Pack' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'can', label: 'Can' },
    { value: 'cup', label: 'Cup' },
    { value: 'bowl', label: 'Bowl' }
  ]

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target
    
    if (name.startsWith('nutritionalInfo.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        nutritionalInfo: {
          ...prev.nutritionalInfo,
          [field]: value
        }
      }))
    } else if (name.startsWith('vendor.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        vendor: {
          ...prev.vendor,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && formData && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData) return
    
    // Prevent multiple submissions
    if (isSubmitting || reduxLoading) return

    // Validate form
    if (!formData.name || !formData.category || !formData.price || !formData.costPrice) {
      alert('Please fill in all required fields')
      return
    }

    // ✅ Set local loading true
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        minStockLevel: parseInt(formData.minStockLevel),
        maxStockLevel: parseInt(formData.maxStockLevel),
        nutritionalInfo: {
          calories: parseFloat(formData.nutritionalInfo.calories) || 0,
          protein: parseFloat(formData.nutritionalInfo.protein) || 0,
          carbs: parseFloat(formData.nutritionalInfo.carbs) || 0,
          fat: parseFloat(formData.nutritionalInfo.fat) || 0
        }
      }

      // ✅ Dispatch and wait for result
      const result = await dispatch(updateItem({ id, itemData: submitData })).unwrap()
      
      if (result) {
        console.log('✅ Item updated successfully:', result)
        
        // Wait a moment then redirect
        setTimeout(() => {
          navigate(`/items/${id}`)
        }, 1000)
      }
      
    } catch (error) {
      console.error('❌ Failed to update item:', error)
    } finally {
      // ✅ Always reset local loading state
      setIsSubmitting(false)
    }
  }

  if (reduxLoading && !formData) return <Loading />
  if (error) return (
    <Alert severity="error" sx={{ m: 3 }}>
      {error}
    </Alert>
  )
  if (!formData) return <Loading />

  // Calculate if form is disabled
  const isDisabled = isSubmitting || reduxLoading

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate(`/items/${id}`)} 
            sx={{ mr: 2 }}
            disabled={isDisabled}
          >
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Edit Item: {currentItem?.name}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isDisabled}
              helperText="Enter Category Name or ID"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          {/* Pricing */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
              Pricing & Units
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              disabled={isDisabled}
              InputProps={{
                startAdornment: '₹'
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Cost Price"
              name="costPrice"
              type="number"
              value={formData.costPrice}
              onChange={handleChange}
              disabled={isDisabled}
              InputProps={{
                startAdornment: '₹'
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth required disabled={isDisabled}>
              <InputLabel>Unit</InputLabel>
              <Select
                name="unit"
                value={formData.unit}
                label="Unit"
                onChange={handleChange}
              >
                {units.map((unit) => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Stock Management */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
              Stock Management
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Stock Level"
              name="minStockLevel"
              type="number"
              value={formData.minStockLevel}
              onChange={handleChange}
              disabled={isDisabled}
              helperText="Alert when stock goes below this level"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Maximum Stock Level"
              name="maxStockLevel"
              type="number"
              value={formData.maxStockLevel}
              onChange={handleChange}
              disabled={isDisabled}
              helperText="Maximum capacity for this item"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  name="isAvailable"
                  color="primary"
                  disabled={isDisabled}
                />
              }
              label="Item is available for ordering"
            />
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
              Tags
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Add Tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                disabled={isDisabled}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={isDisabled || !tagInput.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  disabled={isDisabled}
                />
              ))}
            </Box>
          </Grid>

          {/* Nutritional Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
              Nutritional Information (per serving)
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Calories (g)"
              name="nutritionalInfo.calories"
              type="number"
              value={formData.nutritionalInfo.calories}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Protein (g)"
              name="nutritionalInfo.protein"
              type="number"
              value={formData.nutritionalInfo.protein}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Carbs (g)"
              name="nutritionalInfo.carbs"
              type="number"
              value={formData.nutritionalInfo.carbs}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Fat (g)"
              name="nutritionalInfo.fat"
              type="number"
              value={formData.nutritionalInfo.fat}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          {/* Vendor Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
              Vendor Information (Optional)
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Vendor Name"
              name="vendor.name"
              value={formData.vendor.name}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact Number"
              name="vendor.contact"
              value={formData.vendor.contact}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Email"
              name="vendor.email"
              type="email"
              value={formData.vendor.email}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </Grid>

          {/* Submit Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/items/${id}`)}
                disabled={isDisabled}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={isDisabled}
                sx={{ minWidth: 140 }}
              >
                {isSubmitting ? 'Updating...' : reduxLoading ? 'Processing...' : 'Update Item'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default EditItem