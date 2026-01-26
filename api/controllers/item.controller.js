const Item = require('../models/Item.model');
const Category = require('../models/Category.model');
const Inventory = require('../models/Inventory.model');
const mongoose = require('mongoose'); // ✅ Add mongoose import
const { validationResult } = require('express-validator');

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'name',
      sortOrder = 'asc',
      availableOnly = false
    } = req.query;

    const query = {};

    // Filter by category
    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Filter by availability
    if (availableOnly === 'true') {
      query.isAvailable = true;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    const items = await Item.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const totalItems = await Item.countDocuments(query);

    // Get inventory status for each item
    const itemsWithInventory = await Promise.all(items.map(async (item) => {
      const inventory = await Inventory.findOne({ item: item._id });
      const itemObj = item.toObject();
      itemObj.currentStock = inventory ? inventory.quantity : 0;
      itemObj.stockStatus = inventory ? inventory.status : 'out-of-stock';
      return itemObj;
    }));

    res.status(200).json({
      success: true,
      data: itemsWithInventory,
      pagination: {
        total: totalItems,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
};

// Get single item
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('category', 'name description');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Get inventory info
    const inventory = await Inventory.findOne({ item: item._id });
    const itemObj = item.toObject();
    itemObj.currentStock = inventory ? inventory.quantity : 0;
    itemObj.stockStatus = inventory ? inventory.status : 'out-of-stock';

    res.status(200).json({
      success: true,
      data: itemObj
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: error.message
    });
  }
};

// ✅ FIXED: Create new item function
exports.createItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const itemData = req.body;
    let categoryId = itemData.category;

    console.log('Creating item with category:', categoryId);

    // ✅ FIX: Handle both category name and ID
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      console.log('Category is not ObjectId, treating as name...');
      
      // Try to find category by name (case-insensitive)
      let category = await Category.findOne({ 
        name: { $regex: new RegExp(`^${categoryId}$`, 'i') } 
      });
      
      // If category doesn't exist, create it
      if (!category) {
        console.log('Category not found, creating new category...');
        category = await Category.create({
          name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1).toLowerCase(),
          description: `${categoryId} items`
        });
      }
      
      categoryId = category._id;
      console.log('Using category ID:', categoryId);
    } else {
      // Verify category exists by ID
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Create item with correct category ID
    const item = await Item.create({
      ...itemData,
      category: categoryId,
      isAvailable: true
    });

    // Create initial inventory entry
    const initialStock = itemData.stock || 0;
    const stockStatus = initialStock > 0 ? 'in-stock' : 
                      initialStock === 0 ? 'out-of-stock' : 'low-stock';
    
    await Inventory.create({
      item: item._id,
      quantity: initialStock,
      status: stockStatus,
      lastUpdated: new Date()
    });

    // Populate category in response
    const populatedItem = await Item.findById(item._id)
      .populate('category', 'name description');

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: populatedItem
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item',
      error: error.message
    });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Delete associated inventory
    await Inventory.deleteMany({ item: item._id });

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error.message
    });
  }
};

// Get items by category
exports.getItemsByCategory = async (req, res) => {
  try {
    const items = await Item.find({ category: req.params.categoryId })
      .populate('category', 'name')
      .where('isAvailable').equals(true);

    // Get inventory status
    const itemsWithInventory = await Promise.all(items.map(async (item) => {
      const inventory = await Inventory.findOne({ item: item._id });
      const itemObj = item.toObject();
      itemObj.currentStock = inventory ? inventory.quantity : 0;
      itemObj.stockStatus = inventory ? inventory.status : 'out-of-stock';
      return itemObj;
    }));

    res.status(200).json({
      success: true,
      data: itemsWithInventory
    });
  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items by category',
      error: error.message
    });
  }
};