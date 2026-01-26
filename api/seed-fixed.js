const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database FIRST
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('‚úÖ Connected to MongoDB');
    await seedDatabase();
    process.exit(0);
  })
  .catch(err => {
    console.error('‚ùå MongoDB connection error:', err);
    process.exit(1);
  });

async function seedDatabase() {
  try {
    console.log('Ìº± Seeding database...');
    
    // Import models AFTER connection
    const User = require('./models/User.model');
    const Category = require('./models/Category.model');
    const Item = require('./models/Item.model');
    const Inventory = require('./models/Inventory.model');
    
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Item.deleteMany({});
    await Inventory.deleteMany({});
    
    console.log('‚úÖ Old data cleared');
    
    // Create users WITHOUT using .create() to avoid middleware issues
    const usersData = [
      {
        employeeId: 'ADMIN001',
        name: 'System Admin',
        email: 'admin@office.com',
        password: 'admin123',
        department: 'IT',
        role: 'admin',
        walletBalance: 10000
      },
      {
        employeeId: 'MGR001',
        name: 'Pantry Manager',
        email: 'manager@office.com',
        password: 'manager123',
        department: 'Operations',
        role: 'manager',
        walletBalance: 5000
      },
      {
        employeeId: 'EMP001',
        name: 'John Doe',
        email: 'john@office.com',
        password: 'employee123',
        department: 'Development',
        role: 'employee',
        walletBalance: 1000
      }
    ];
    
    // Save users one by one
    for (const userData of usersData) {
      const user = new User(userData);
      await user.save();
    }
    
    console.log('‚úÖ Users created');
    
    // Create categories
    const categories = [
      {
        name: 'Beverages',
        description: 'Hot and cold drinks',
        displayOrder: 1
      },
      {
        name: 'Snacks',
        description: 'Chips, cookies, and snacks',
        displayOrder: 2
      },
      {
        name: 'Breakfast',
        description: 'Morning snacks and breakfast items',
        displayOrder: 3
      },
      {
        name: 'Lunch',
        description: 'Ready-to-eat meals',
        displayOrder: 4
      },
      {
        name: 'Dairy',
        description: 'Milk, yogurt, and cheese products',
        displayOrder: 5
      }
    ];
    
    const createdCategories = [];
    for (const catData of categories) {
      const category = new Category(catData);
      createdCategories.push(await category.save());
    }
    
    console.log('‚úÖ Categories created');
    
    // Create items
    const items = [
      {
        name: 'Coffee',
        description: 'Hot brewed coffee',
        category: createdCategories[0]._id,
        price: 20,
        costPrice: 8,
        unit: 'cup',
        minStockLevel: 50,
        maxStockLevel: 200,
        tags: ['hot', 'beverage', 'morning']
      },
      {
        name: 'Tea',
        description: 'Hot tea with milk',
        category: createdCategories[0]._id,
        price: 15,
        costPrice: 5,
        unit: 'cup',
        minStockLevel: 50,
        maxStockLevel: 200,
        tags: ['hot', 'beverage']
      },
      {
        name: 'Chips',
        description: 'Potato chips - salted',
        category: createdCategories[1]._id,
        price: 30,
        costPrice: 15,
        unit: 'pack',
        minStockLevel: 30,
        maxStockLevel: 100,
        tags: ['snack', 'salty', 'crispy']
      },
      {
        name: 'Cookies',
        description: 'Chocolate chip cookies',
        category: createdCategories[1]._id,
        price: 25,
        costPrice: 10,
        unit: 'pack',
        minStockLevel: 40,
        maxStockLevel: 150,
        tags: ['snack', 'sweet', 'biscuit']
      },
      {
        name: 'Sandwich',
        description: 'Veg cheese sandwich',
        category: createdCategories[3]._id,
        price: 50,
        costPrice: 25,
        unit: 'piece',
        minStockLevel: 20,
        maxStockLevel: 80,
        tags: ['lunch', 'meal', 'fresh']
      },
      {
        name: 'Milk',
        description: 'Fresh cow milk',
        category: createdCategories[4]._id,
        price: 25,
        costPrice: 15,
        unit: 'bottle',
        minStockLevel: 20,
        maxStockLevel: 100,
        tags: ['dairy', 'beverage', 'fresh']
      }
    ];
    
    const createdItems = [];
    for (const itemData of items) {
      const item = new Item(itemData);
      createdItems.push(await item.save());
    }
    
    console.log('‚úÖ Items created');
    
    // Create inventory records
    const inventoryData = [
      {
        item: createdItems[0]._id,
        quantity: 100,
        location: 'Main Pantry',
        status: 'in-stock'
      },
      {
        item: createdItems[1]._id,
        quantity: 80,
        location: 'Main Pantry',
        status: 'in-stock'
      },
      {
        item: createdItems[2]._id,
        quantity: 5,
        location: 'Main Pantry',
        status: 'low-stock'
      },
      {
        item: createdItems[3]._id,
        quantity: 60,
        location: 'Main Pantry',
        status: 'in-stock'
      },
      {
        item: createdItems[4]._id,
        quantity: 0,
        location: 'Main Pantry',
        status: 'out-of-stock'
      },
      {
        item: createdItems[5]._id,
        quantity: 30,
        location: 'Fridge',
        status: 'in-stock'
      }
    ];
    
    for (const invData of inventoryData) {
      const inventory = new Inventory(invData);
      await inventory.save();
    }
    
    console.log('‚úÖ Inventory created');
    
    console.log('====================================');
    console.log('Ìæâ Database seeded successfully!');
    console.log('====================================');
    console.log('Admin Login:');
    console.log('Email: admin@office.com');
    console.log('Password: admin123');
    console.log('====================================');
    console.log('Manager Login:');
    console.log('Email: manager@office.com');
    console.log('Password: manager123');
    console.log('====================================');
    console.log('Employee Login:');
    console.log('Email: john@office.com');
    console.log('Password: employee123');
    console.log('====================================');
    
  } catch (error) {
    console.error('‚ùå Error seeding database:', error);
    throw error;
  }
}
