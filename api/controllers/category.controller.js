const Category = require('../models/Category.model');
const Item = require('../models/Item.model');
const { validationResult } = require('express-validator');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 });

    // Get item count for each category
    const categoriesWithCounts = await Promise.all(categories.map(async (category) => {
      const itemCount = await Item.countDocuments({ 
        category: category._id, 
        isAvailable: true 
      });
      const categoryObj = category.toObject();
      categoryObj.itemCount = itemCount;
      return categoryObj;
    }));

    res.status(200).json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get items in this category
    const items = await Item.find({ 
      category: category._id,
      isAvailable: true 
    }).select('name price image');

    const categoryWithItems = {
      ...category.toObject(),
      items
    };

    res.status(200).json({
      success: true,
      data: categoryWithItems
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, parentCategory } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Check parent category if provided
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    const category = await Category.create({
      name,
      description,
      parentCategory: parentCategory || null
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has items
    const itemCount = await Item.countDocuments({ category: category._id });
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing items'
      });
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};
