const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('[Seeder] Starting database migration and seeding...');

  try {
    // 1. Create Tables
    console.log('[Seeder] Creating tables if they do not exist...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('staff', 'manager') NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        unit VARCHAR(10) NOT NULL
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ingredient_id INT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        remaining_quantity DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        receipt_image_path VARCHAR(255) NULL,
        status ENUM('active', 'used', 'wasted') DEFAULT 'active',
        expiry_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT NULL
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantity_needed DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS promo_drafts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id INT NOT NULL,
        discount_percentage INT NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending_approval', 'active', 'expired') DEFAULT 'pending_approval',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ingredient_id INT NOT NULL,
        quantity_used DECIMAL(10,2) NOT NULL,
        sale_date DATE NOT NULL,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('[Seeder] Tables created successfully.');

    // 2. Seed Users
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0][0].count === 0) {
      console.log('[Seeder] Seeding default users...');
      const managerPassword = await bcrypt.hash('manager123', 10);
      const staffPassword = await bcrypt.hash('staff123', 10);
      
      await db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['manager', managerPassword, 'manager']);
      await db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['staff', staffPassword, 'staff']);
      console.log('[Seeder] Users seeded: manager / manager123, staff / staff123');
    } else {
      console.log('[Seeder] Users already exists. Skipping...');
    }

    // 3. Seed Ingredients
    const ingCount = await db.query('SELECT COUNT(*) as count FROM ingredients');
    let ingredientMap = {};
    if (ingCount[0][0].count === 0) {
      console.log('[Seeder] Seeding default ingredients...');
      const items = [
        ['Daging Sapi', 'Daging', 'kg'],
        ['Ayam', 'Daging', 'kg'],
        ['Telur', 'Bahan Pokok', 'pcs'],
        ['Beras', 'Bahan Pokok', 'kg'],
        ['Bawang Merah', 'Bumbu', 'kg']
      ];
      for (const item of items) {
        const [result] = await db.query('INSERT INTO ingredients (name, category, unit) VALUES (?, ?, ?)', item);
        ingredientMap[item[0]] = result.insertId;
      }
      console.log('[Seeder] Ingredients seeded successfully.');
    } else {
      console.log('[Seeder] Ingredients already exist. Fetching IDs...');
      const [rows] = await db.query('SELECT id, name FROM ingredients');
      rows.forEach(r => { ingredientMap[r.name] = r.id; });
    }

    // 4. Seed Menu Items & Menu Ingredients
    const menuCount = await db.query('SELECT COUNT(*) as count FROM menu_items');
    if (menuCount[0][0].count === 0) {
      console.log('[Seeder] Seeding default menu items and recipes...');
      
      // Menu 1: Beef Black Pepper
      const [menu1] = await db.query('INSERT INTO menu_items (name, price, description) VALUES (?, ?, ?)', 
        ['Beef Black Pepper', 55000.00, 'Daging sapi tumis lada hitam dengan saus spesial']);
      await db.query('INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)',
        [menu1.insertId, ingredientMap['Daging Sapi'], 0.15]);
      await db.query('INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)',
        [menu1.insertId, ingredientMap['Bawang Merah'], 0.02]);

      // Menu 2: Chicken Teriyaki
      const [menu2] = await db.query('INSERT INTO menu_items (name, price, description) VALUES (?, ?, ?)', 
        ['Chicken Teriyaki', 40000.00, 'Daging ayam fillet panggang dengan saus teriyaki manis']);
      await db.query('INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)',
        [menu2.insertId, ingredientMap['Ayam'], 0.20]);
      await db.query('INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)',
        [menu2.insertId, ingredientMap['Bawang Merah'], 0.01]);

      // Menu 3: Nasi Goreng Spesial
      const [menu3] = await db.query('INSERT INTO menu_items (name, price, description) VALUES (?, ?, ?)', 
        ['Nasi Goreng Spesial', 25000.00, 'Nasi goreng bumbu lokal disajikan dengan telur dadar']);
      await db.query('INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)',
        [menu3.insertId, ingredientMap['Beras'], 0.10]);
      await db.query('INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)',
        [menu3.insertId, ingredientMap['Telur'], 1.00]);
      await db.query('INSERT INTO menu_ingredients (menu_item_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)',
        [menu3.insertId, ingredientMap['Bawang Merah'], 0.01]);

      console.log('[Seeder] Menu and recipes seeded successfully.');
    }

    // 5. Seed Historical Sales (3 months of daily usage logs)
    const salesCount = await db.query('SELECT COUNT(*) as count FROM sales_history');
    if (salesCount[0][0].count === 0) {
      console.log('[Seeder] Generating 3 months of daily historical usage data for ML forecaster...');
      const today = new Date();
      const queries = [];
      
      for (let i = 90; i > 0; i--) {
        const saleDate = new Date();
        saleDate.setDate(today.getDate() - i);
        const dateStr = saleDate.toISOString().split('T')[0];

        // Seed values with slight random variances around an average
        const dailyData = [
          [ingredientMap['Daging Sapi'], (4.5 + Math.random() * 1.5).toFixed(2)],
          [ingredientMap['Ayam'], (7.0 + Math.random() * 3.0).toFixed(2)],
          [ingredientMap['Telur'], Math.round(25 + Math.random() * 15)],
          [ingredientMap['Beras'], (9.0 + Math.random() * 2.0).toFixed(2)],
          [ingredientMap['Bawang Merah'], (1.5 + Math.random() * 0.8).toFixed(2)]
        ];

        for (const log of dailyData) {
          queries.push(db.query('INSERT INTO sales_history (ingredient_id, quantity_used, sale_date) VALUES (?, ?, ?)',
            [log[0], log[1], dateStr]));
        }
      }
      await Promise.all(queries);
      console.log(`[Seeder] Seeded ${queries.length} sales history logs successfully.`);
    }

    // 6. Seed Stock Batches (15-20 transaction logs from past 2 weeks)
    const batchCount = await db.query('SELECT COUNT(*) as count FROM stock_batches');
    if (batchCount[0][0].count === 0) {
      console.log('[Seeder] Seeding 15-20 transaction logs for dashboard metrics...');
      const today = new Date();
      
      const batches = [
        // Ingredient, Quantity, Remaining Qty, Unit Price, Total Price, Status, Expiry Offset (days), Date Offset (days ago)
        ['Daging Sapi', 20.0, 0.0, 110000.00, 2200000.00, 'used', 5, 12],
        ['Daging Sapi', 10.0, 2.0, 115000.00, 1150000.00, 'wasted', 4, 10], // spoiled batch
        ['Daging Sapi', 15.0, 15.0, 112000.00, 1680000.00, 'active', 7, 2],
        
        ['Ayam', 30.0, 0.0, 35000.00, 1050000.00, 'used', 4, 14],
        ['Ayam', 25.0, 0.0, 36000.00, 900000.00, 'used', 4, 9],
        ['Ayam', 20.0, 8.0, 35000.00, 700000.00, 'wasted', 3, 6], // wasted batch
        ['Ayam', 25.0, 25.0, 37000.00, 925000.00, 'active', 1, 0], // critical/expiring soon
        
        ['Telur', 150.0, 0.0, 2000.00, 300000.00, 'used', 10, 13],
        ['Telur', 200.0, 50.0, 2100.00, 420000.00, 'used', 10, 5],
        ['Telur', 100.0, 100.0, 2000.00, 200000.00, 'active', 8, 1],

        ['Beras', 100.0, 0.0, 14000.00, 1400000.00, 'used', 30, 14],
        ['Beras', 50.0, 20.0, 15000.00, 750000.00, 'active', 25, 3],

        ['Bawang Merah', 10.0, 0.0, 30000.00, 300000.00, 'used', 14, 12],
        ['Bawang Merah', 15.0, 2.0, 32000.00, 480000.00, 'wasted', 14, 8],
        ['Bawang Merah', 12.0, 12.0, 31000.00, 372000.00, 'active', 1, 0] // critical/expiring soon
      ];

      for (const batch of batches) {
        const ingId = ingredientMap[batch[0]];
        
        const expDate = new Date();
        expDate.setDate(today.getDate() + batch[6]);
        const expStr = expDate.toISOString().split('T')[0];

        const logDate = new Date();
        logDate.setDate(today.getDate() - batch[7]);
        const logStr = logDate.toISOString().split('T')[0];

        await db.query(
          `INSERT INTO stock_batches 
          (ingredient_id, quantity, remaining_quantity, unit_price, total_price, status, expiry_date, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ingId, batch[1], batch[2], batch[3], batch[4], batch[5], expStr, logStr]
        );
      }
      console.log('[Seeder] Stock transaction batches seeded successfully.');
    }

    console.log('[Seeder] Database migration and seeding completed successfully!');
  } catch (error) {
    console.error('[Seeder] Error executing database migration/seeding:', error);
  } finally {
    // If not required to keep pool open, we can close it
    await db.end();
    console.log('[Seeder] Connection pool closed.');
  }
}

// Support running directly from command line
if (require.main === module) {
  seed();
}

module.exports = seed;
