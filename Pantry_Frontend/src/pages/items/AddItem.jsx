import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
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
  Card,
  CardContent,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { createItem } from '../../store/slice/itemSlice'
import itemService from '../../services/itemService'
import Loading from '../../components/common/Loading'

const AddItem = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading: reduxLoading, error } = useSelector((state) => state.items)
  const { user } = useSelector((state) => state.auth)

  // ✅ Add local loading state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  
  // Check if user has permission
  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      navigate('/items')
    }
  }, [user, navigate])

  // ✅ Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        
        // Try to fetch from backend first
        try {
          const categoriesData = await itemService.getCategories()
          if (categoriesData && categoriesData.data) {
            setCategories(categoriesData.data)
          } else {
            throw new Error('No categories data')
          }
        } catch (error) {
          console.log('API error, using fallback categories:', error.message)
          // Fallback categories
          setCategories([
            { _id: 'beverages', name: 'Beverages' },
            { _id: 'snacks', name: 'Snacks' },
            { _id: 'breakfast', name: 'Breakfast' },
            { _id: 'lunch', name: 'Lunch' },
            { _id: 'dinner', name: 'Dinner' },
            { _id: 'dairy', name: 'Dairy' }
          ])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Ultimate fallback
        setCategories([
          { _id: 'breakfast', name: 'Breakfast' },
          { _id: 'lunch', name: 'Lunch' },
          { _id: 'dinner', name: 'Dinner' }
        ])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '', // ✅ This will store category ID
    price: '',
    costPrice: '',
    unit: 'piece',
    minStockLevel: '10',
    maxStockLevel: '100',
    tags: [],
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    vendor: {
      name: '',
      contact: '',
      email: ''
    }
  })

  const [tagInput, setTagInput] = useState('')

  const units = [
    { value: 'piece', label: 'Piece' },
    { value: 'pack', label: 'Pack' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'can', label: 'Can' },
    { value: 'cup', label: 'Cup' },
    { value: 'bowl', label: 'Bowl' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    
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
        [name]: value
      }))
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
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

      console.log('📤 Submitting item data:', {
        ...submitData,
        category: formData.category,
        categoryName: categories.find(c => c._id === formData.category)?.name || 'Unknown'
      })

      // ✅ Dispatch and wait for result
      const result = await dispatch(createItem(submitData)).unwrap()
      
      if (result) {
        console.log('✅ Item created successfully:', result)
        
        // Show success message
        setTimeout(() => {
          navigate('/items')
        }, 1500)
      }
      
    } catch (error) {
      console.error('❌ Failed to create item:', error)
      alert(`Error creating item: ${error.message || 'Unknown error'}`)
    } finally {
      // ✅ Always reset local loading state
      setIsSubmitting(false)
    }
  }

  // ✅ Show loading only on initial page load
  if (loadingCategories) return <Loading />

  // Calculate if form is disabled
  const isDisabled = isSubmitting || reduxLoading

  // ✅ Get category name for display
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Not selected'
    const category = categories.find(cat => cat._id === categoryId)
    return category ? category.name : 'Unknown category'
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate('/items')} 
            sx={{ mr: 2 }}
            disabled={isDisabled}
          >
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Add New Item
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
            <FormControl fullWidth required disabled={isDisabled || loadingCategories}>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                onClick={() => navigate('/items')}
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
                {isSubmitting ? 'Creating...' : reduxLoading ? 'Processing...' : 'Save Item'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Preview Card */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Preview
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Item Name
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formData.name || 'Not specified'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {getCategoryName(formData.category)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formData.price ? `₹${formData.price}` : 'Not specified'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  )
}

export default AddItem