const Inventory = require('../models/Inventory.model');
const Item = require('../models/Item.model');
const { validationResult } = require('express-validator');

// Get all inventory items
exports.getAllInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      lowStockOnly = false,
      sortBy = 'quantity',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (lowStockOnly === 'true') {
      query.status = 'low-stock';
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const inventoryItems = await Inventory.find(query)
      .populate('item', 'name category price minStockLevel maxStockLevel')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const totalItems = await Inventory.countDocuments(query);

    // Calculate stats
    const totalItemsCount = await Inventory.countDocuments();
    const lowStockCount = await Inventory.countDocuments({ status: 'low-stock' });
    const outOfStockCount = await Inventory.countDocuments({ status: 'out-of-stock' });
    const expiredCount = await Inventory.countDocuments({ status: 'expired' });

    res.status(200).json({
      success: true,
      data: inventoryItems,
      stats: {
        totalItems: totalItemsCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        expired: expiredCount
      },
      pagination: {
        total: totalItems,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message
    });
  }
};

// Update inventory stock
exports.updateStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId, quantity, operation, expiryDate, batchNumber, notes } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    let inventory = await Inventory.findOne({ item: itemId });

    if (!inventory) {
      // Create new inventory record if doesn't exist
      inventory = new Inventory({
        item: itemId,
        quantity: 0,
        status: 'out-of-stock'
      });
    }

    // Update quantity based on operation
    if (operation === 'add') {
      inventory.quantity += quantity;
      inventory.lastRestocked = new Date();
    } else if (operation === 'subtract') {
      if (inventory.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Cannot subtract more than available stock'
        });
      }
      inventory.quantity -= quantity;
    } else if (operation === 'set') {
      inventory.quantity = quantity;
    }

    // Update other fields
    if (expiryDate) inventory.expiryDate = expiryDate;
    if (batchNumber) inventory.batchNumber = batchNumber;
    if (notes) inventory.notes = notes;

    // Update status based on new quantity
    if (inventory.quantity <= 0) {
      inventory.status = 'out-of-stock';
    } else if (inventory.quantity <= item.minStockLevel) {
      inventory.status = 'low-stock';
    } else {
      inventory.status = 'in-stock';
    }

    // Check expiry
    if (inventory.expiryDate && new Date() > inventory.expiryDate) {
      inventory.status = 'expired';
    }

    await inventory.save();

    // Populate item data for response
    await inventory.populate('item', 'name category price');

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
};

// Bulk update inventory
exports.bulkUpdateStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { updates } = req.body;

    const results = [];
    const errorsList = [];

    for (const update of updates) {
      try {
        const item = await Item.findById(update.itemId);
        if (!item) {
          errorsList.push({
            itemId: update.itemId,
            error: 'Item not found'
          });
          continue;
        }

        let inventory = await Inventory.findOne({ item: update.itemId });

        if (!inventory) {
          inventory = new Inventory({
            item: update.itemId,
            quantity: 0,
            status: 'out-of-stock'
          });
        }

        // Update quantity
        inventory.quantity = update.quantity;

        // Update status
        if (inventory.quantity <= 0) {
          inventory.status = 'out-of-stock';
        } else if (inventory.quantity <= item.minStockLevel) {
          inventory.status = 'low-stock';
        } else {
          inventory.status = 'in-stock';
        }

        await inventory.save();
        await inventory.populate('item', 'name');

        results.push({
          itemId: update.itemId,
          itemName: inventory.item.name,
          quantity: inventory.quantity,
          status: inventory.status,
          success: true
        });
      } catch (error) {
        errorsList.push({
          itemId: update.itemId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk update completed',
      data: {
        successful: results,
        failed: errorsList
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk update',
      error: error.message
    });
  }
};

// Get inventory alerts (low stock, expired items)
exports.getAlerts = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({ status: 'low-stock' })
      .populate('item', 'name category minStockLevel')
      .limit(50);

    const expiredItems = await Inventory.find({ status: 'expired' })
      .populate('item', 'name category')
      .limit(50);

    const outOfStockItems = await Inventory.find({ status: 'out-of-stock' })
      .populate('item', 'name category isAvailable')
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        lowStock: lowStockItems,
        expired: expiredItems,
        outOfStock: outOfStockItems
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
};

// Get inventory history for an item
exports.getItemHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 50 } = req.query;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const inventory = await Inventory.findOne({ item: itemId })
      .populate('item', 'name category price');

    // Mock history data - in production, use a separate InventoryHistory model
    const mockHistory = [
      {
        date: new Date(Date.now() - 86400000),
        quantity: inventory.quantity + 10,
        operation: 'restock',
        user: 'System Admin',
        notes: 'Weekly restock'
      },
      {
        date: new Date(Date.now() - 172800000),
        quantity: inventory.quantity + 5,
        operation: 'sale',
        user: 'Auto System',
        notes: 'Order processed'
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        current: inventory,
        history: mockHistory
      }
    });
  } catch (error) {
    console.error('Get item history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item history',
      error: error.message
    });
  }
};
