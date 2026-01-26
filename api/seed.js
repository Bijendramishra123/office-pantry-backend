const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User.model');
const Category = require('./models/Category.model');
const Item = require('./models/Item.model');
const Inventory = require('./models/Inventory.model');

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const seedDatabase = async () => {
  try {
    console.log('Ìº± Seeding database...');
    
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Item.deleteMany({});
    await Inventory.deleteMany({});
    
    console.log('‚úÖ Old data cleared');
    
    // Create admin user
    const adminUser = await User.create({
      employeeId: 'ADMIN001',
      name: 'System Admin',
      email: 'admin@office.com',
      password: 'admin123',
      department: 'IT',
      role: 'admin',
      walletBalance: 10000
    });
    
    // Create manager user
    const managerUser = await User.create({
      employeeId: 'MGR001',
      name: 'Pantry Manager',
      email: 'manager@office.com',
      password: 'manager123',
      department: 'Operations',
      role: 'manager',
      walletBalance: 5000
    });
    
    // Create employee user
    const employeeUser = await User.create({
      employeeId: 'EMP001',
      name: 'John Doe',
      email: 'john@office.com',
      password: 'employee123',
      department: 'Development',
      role: 'employee',
      walletBalance: 1000
    });
    
    console.log('‚úÖ Users created');
    
    // Create categories
    const categories = await Category.create([
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
    ]);
    
    console.log('‚úÖ Categories created');
    
    // Create items
    const items = await Item.create([
      {
        name: 'Coffee',
        description: 'Hot brewed coffee',
        category: categories[0]._id,
        price: 20,
        costPrice: 8,
        unit: 'cup',
        minStockLevel: 50,
        maxStockLevel: 200,
        tags: ['hot', 'beverage', 'morning'],
        nutritionalInfo: {
          calories: 5,
          protein: 0.3,
          carbs: 0,
          fat: 0
        }
      },
      {
        name: 'Tea',
        description: 'Hot tea with milk',
        category: categories[0]._id,
        price: 15,
        costPrice: 5,
        unit: 'cup',
        minStockLevel: 50,
        maxStockLevel: 200,
        tags: ['hot', 'beverage'],
        nutritionalInfo: {
          calories: 10,
          protein: 0.5,
          carbs: 2,
          fat: 0.2
        }
      },
      {
        name: 'Chips',
        description: 'Potato chips - salted',
        category: categories[1]._id,
        price: 30,
        costPrice: 15,
        unit: 'pack',
        minStockLevel: 30,
        maxStockLevel: 100,
        tags: ['snack', 'salty', 'crispy'],
        nutritionalInfo: {
          calories: 150,
          protein: 2,
          carbs: 15,
          fat: 10
        }
      },
      {
        name: 'Cookies',
        description: 'Chocolate chip cookies',
        category: categories[1]._id,
        price: 25,
        costPrice: 10,
        unit: 'pack',
        minStockLevel: 40,
        maxStockLevel: 150,
        tags: ['snack', 'sweet', 'biscuit'],
        nutritionalInfo: {
          calories: 120,
          protein: 1.5,
          carbs: 18,
          fat: 5
        }
      },
      {
        name: 'Sandwich',
        description: 'Veg cheese sandwich',
        category: categories[3]._id,
        price: 50,
        costPrice: 25,
        unit: 'piece',
        minStockLevel: 20,
        maxStockLevel: 80,
        tags: ['lunch', 'meal', 'fresh'],
        nutritionalInfo: {
          calories: 250,
          protein: 10,
          carbs: 30,
          fat: 8
        }
      },
      {
        name: 'Milk',
        description: 'Fresh cow milk',
        category: categories[4]._id,
        price: 25,
        costPrice: 15,
        unit: 'bottle',
        minStockLevel: 20,
        maxStockLevel: 100,
        tags: ['dairy', 'beverage', 'fresh'],
        nutritionalInfo: {
          calories: 150,
          protein: 8,
          carbs: 12,
          fat: 8
        }
      }
    ]);
    
    console.log('‚úÖ Items created');
    
    // Create inventory records
    await Inventory.create([
      {
        item: items[0]._id,
        quantity: 100,
        location: 'Main Pantry',
        status: 'in-stock'
      },
      {
        item: items[1]._id,
        quantity: 80,
        location: 'Main Pantry',
        status: 'in-stock'
      },
      {
        item: items[2]._id,
        quantity: 5,
        location: 'Main Pantry',
        status: 'low-stock'
      },
      {
        item: items[3]._id,
        quantity: 60,
        location: 'Main Pantry',
        status: 'in-stock'
      },
      {
        item: items[4]._id,
        quantity: 0,
        location: 'Main Pantry',
        status: 'out-of-stock'
      },
      {
        item: items[5]._id,
        quantity: 30,
        location: 'Fridge',
        status: 'in-stock'
      }
    ]);
    
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
    
    mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('‚ùå Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run seed
seedDatabase();
