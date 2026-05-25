const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

const JWT_SECRET = 'super_secret_jwt_key_for_demo'; // In production, use env variable
const DB_FILE = './database.sqlite';

// Initialize SQLite database
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Promise wrappers for SQLite database operations
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

const dbRun = (sql, params = []) => new Promise(function(resolve, reject) {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

function initializeDatabase() {
    db.serialize(() => {
        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'customer')),
            status TEXT NOT NULL CHECK(status IN ('approved', 'pending')),
            username TEXT NOT NULL,
            phone_number TEXT NOT NULL
        )`);

        // Create Medicines Table
        db.run(`CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            quantity INTEGER NOT NULL DEFAULT 0,
            price REAL NOT NULL,
            cost_price REAL DEFAULT 0,
            expiry_date TEXT
        )`);

        // Migration to add cost_price column to medicines if not exists
        db.run(`ALTER TABLE medicines ADD COLUMN cost_price REAL DEFAULT 0`, (err) => {
            // Ignore error if column already exists
        });

        // Create Orders Table (with columns for discount, tax, final total, and status)
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_price REAL NOT NULL,
            discount_amount REAL DEFAULT 0,
            discount_percentage REAL DEFAULT 0,
            tax_amount REAL DEFAULT 0,
            final_total REAL NOT NULL,
            date TEXT NOT NULL,
            user_id INTEGER,
            type TEXT CHECK(type IN ('pos_sale', 'online_order')),
            status TEXT CHECK(status IN ('pending', 'completed')) DEFAULT 'completed',
            payment_method TEXT DEFAULT 'Cash',
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Migration to add payment_method column if not exists
        db.run(`ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Cash'`, (err) => {
            // Ignore error if column already exists
        });

        // Create Settings Table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT UNIQUE PRIMARY KEY,
            value TEXT NOT NULL
        )`);

        // Seed Default Settings
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('enforce_payment_before_print', 'false')`);
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_status', 'open')`);
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_state', 'Delhi')`);

        // Create Order Items Table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            medicine_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY(medicine_id) REFERENCES medicines(id)
        )`);

        // Seed Admin Account
        db.get("SELECT * FROM users WHERE email = ?", ['admin@medicart.com'], async (err, row) => {
            if (!row) {
                const adminPasswordHash = await bcrypt.hash('admin123', 10);
                db.run("INSERT INTO users (email, password_hash, role, status, username, phone_number) VALUES (?, ?, ?, ?, ?, ?)", 
                    ['admin@medicart.com', adminPasswordHash, 'admin', 'approved', 'admin', '0000000000'], 
                    (err) => {
                        if (err) console.error("Error seeding admin:", err);
                        else console.log("Seeded default Admin: admin@medicart.com / admin123");
                    }
                );
            }
        });
    });
}

// ------------------------------------------------------------------
// MIDDLEWARE
// ------------------------------------------------------------------

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token.' });
        req.user = user;
        next();
    });
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        if (req.user.status !== 'approved') {
            return res.status(403).json({ error: 'Account is pending approval.' });
        }
        next();
    };
}

// ------------------------------------------------------------------
// AUTHENTICATION ROUTES
// ------------------------------------------------------------------

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        if (user.status !== 'approved') {
            return res.status(403).json({ error: 'Account pending admin approval.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, status: user.status }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ message: 'Login successful', token, role: user.role });
    });
});

// Register Cashier
app.post('/api/auth/register-cashier', async (req, res) => {
    const { email, password, confirmPassword, phoneNumber, username } = req.body;
    if (!email || !password || !confirmPassword || !phoneNumber || !username) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (email, password_hash, role, status, username, phone_number) VALUES (?, ?, ?, ?, ?, ?)", 
            [email, hash, 'cashier', 'pending', username, phoneNumber], 
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email already exists.' });
                    }
                    return res.status(500).json({ error: 'Database error.' });
                }
                res.status(201).json({ message: 'Cashier registered successfully. Pending admin approval.', id: this.lastID });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Register Customer
app.post('/api/auth/register-customer', async (req, res) => {
    const { email, password, confirmPassword, phoneNumber, username } = req.body;
    if (!email || !password || !confirmPassword || !phoneNumber || !username) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (email, password_hash, role, status, username, phone_number) VALUES (?, ?, ?, ?, ?, ?)", 
            [email, hash, 'customer', 'approved', username, phoneNumber], 
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email already exists.' });
                    }
                    return res.status(500).json({ error: 'Database error.' });
                }
                res.status(201).json({ message: 'Customer registered successfully.', id: this.lastID });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ------------------------------------------------------------------
// SYSTEM SETTINGS ROUTES
// ------------------------------------------------------------------

// Get public settings (no auth required)
app.get('/api/public-settings', (req, res) => {
    db.all("SELECT * FROM settings WHERE key IN ('shop_status', 'shop_state')", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
});

// Get all settings
app.get('/api/settings', authenticateToken, (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
});

// Update a setting
app.put('/api/settings', authenticateToken, (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: 'Key and value required.' });

    db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", 
        [key, String(value)], function(err) {
            if (err) return res.status(500).json({ error: 'Database error.' });
            res.json({ message: 'Setting updated successfully.' });
        }
    );
});

// ------------------------------------------------------------------
// ADMIN ROUTES
// ------------------------------------------------------------------

const adminOnly = [authenticateToken, requireRole(['admin'])];

// View all Cashiers (to approve them)
app.get('/api/admin/cashiers', adminOnly, (req, res) => {
    db.all("SELECT id, email, status, username, phone_number FROM users WHERE role = 'cashier'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Approve Cashier
app.put('/api/admin/approve-cashier/:id', adminOnly, (req, res) => {
    const id = req.params.id;
    db.run("UPDATE users SET status = 'approved' WHERE id = ? AND role = 'cashier'", [id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Cashier not found' });
        res.json({ message: 'Cashier approved successfully.' });
    });
});

// View basic stats
app.get('/api/admin/stats', adminOnly, async (req, res) => {
    try {
        const userRes = await dbGet("SELECT COUNT(*) as total_users FROM users");
        const medRes = await dbGet("SELECT SUM(quantity) as total_medicines FROM medicines");
        const salesRes = await dbGet("SELECT SUM(final_total) as total_sales FROM orders WHERE status = 'completed'");
        
        // Calculate cost price of items sold
        const costProfitRes = await dbGet(`
            SELECT 
                SUM(CASE 
                    WHEN medicines.cost_price IS NULL OR medicines.cost_price <= 0 
                    THEN order_items.price * 0.7 
                    ELSE medicines.cost_price 
                END * order_items.quantity) as total_cost
            FROM order_items
            JOIN orders ON order_items.order_id = orders.id
            LEFT JOIN medicines ON order_items.medicine_id = medicines.id
            WHERE orders.status = 'completed'
        `);

        const totalSales = salesRes ? (salesRes.total_sales || 0) : 0;
        const totalCost = costProfitRes ? (costProfitRes.total_cost || 0) : 0;
        // Net profit/loss = Total Revenue - Cost of Goods Sold
        const totalProfit = totalSales - totalCost;

        res.json({
            total_users: userRes ? userRes.total_users : 0,
            total_medicines: medRes ? medRes.total_medicines : 0,
            total_sales: totalSales,
            total_cost: totalCost,
            total_profit: totalProfit
        });
    } catch (err) {
        console.error("Stats query failed:", err);
        res.status(500).json({ error: 'Database error fetching stats' });
    }
});

// View all completed orders (billing history) for admin
app.get('/api/admin/orders', adminOnly, async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT orders.*, users.username, users.email 
             FROM orders 
             LEFT JOIN users ON orders.user_id = users.id 
             WHERE orders.status = 'completed' 
             ORDER BY orders.date DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error("Fetch admin orders failed:", err);
        res.status(500).json({ error: 'Database error fetching orders' });
    }
});

// View detail of any order for admin
app.get('/api/admin/orders/:id', adminOnly, async (req, res) => {
    try {
        const order = await dbGet(
            `SELECT orders.*, users.username, users.email 
             FROM orders 
             LEFT JOIN users ON orders.user_id = users.id 
             WHERE orders.id = ?`, 
            [req.params.id]
        );
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const items = await dbAll(
            `SELECT order_items.*, medicines.name, medicines.price AS current_price 
             FROM order_items 
             JOIN medicines ON order_items.medicine_id = medicines.id 
             WHERE order_items.order_id = ?`,
            [req.params.id]
        );
        res.json({ order, items });
    } catch (err) {
        console.error("Fetch admin order details failed:", err);
        res.status(500).json({ error: 'Database error fetching order details' });
    }
});

// CRUD Medicines
app.get('/api/admin/medicines', adminOnly, (req, res) => {
    db.all("SELECT * FROM medicines", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/admin/medicines', adminOnly, (req, res) => {
    const { name, category, quantity, price, cost_price, expiry_date } = req.body;
    const finalCostPrice = cost_price !== undefined ? parseFloat(cost_price) : (parseFloat(price) * 0.7);
    db.run("INSERT INTO medicines (name, category, quantity, price, cost_price, expiry_date) VALUES (?, ?, ?, ?, ?, ?)", 
        [name, category, quantity, price, finalCostPrice, expiry_date], function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(201).json({ message: 'Medicine added successfully', id: this.lastID });
        }
    );
});

app.put('/api/admin/medicines/:id', adminOnly, (req, res) => {
    const { name, category, quantity, price, cost_price, expiry_date } = req.body;
    const finalCostPrice = cost_price !== undefined ? parseFloat(cost_price) : (parseFloat(price) * 0.7);
    db.run("UPDATE medicines SET name=?, category=?, quantity=?, price=?, cost_price=?, expiry_date=? WHERE id=?", 
        [name, category, quantity, price, finalCostPrice, expiry_date, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (this.changes === 0) return res.status(404).json({ error: 'Medicine not found' });
            res.json({ message: 'Medicine updated successfully' });
        }
    );
});

app.delete('/api/admin/medicines/:id', adminOnly, (req, res) => {
    db.run("DELETE FROM medicines WHERE id=?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Medicine not found' });
        res.json({ message: 'Medicine deleted successfully' });
    });
});

// ------------------------------------------------------------------
// CASHIER ROUTES
// ------------------------------------------------------------------

const cashierOnly = [authenticateToken, requireRole(['cashier', 'admin'])];

// View Inventory
app.get('/api/cashier/medicines', cashierOnly, (req, res) => {
    db.all("SELECT * FROM medicines", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// View pending orders list for Cashier
app.get('/api/cashier/pending-orders', cashierOnly, async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT orders.*, users.username, users.email 
             FROM orders 
             LEFT JOIN users ON orders.user_id = users.id 
             WHERE orders.status = 'pending' 
             ORDER BY orders.date DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error("Pending orders error:", err);
        res.status(500).json({ error: 'Database error' });
    }
});

// View detail of a pending order for Cashier
app.get('/api/cashier/pending-orders/:id', cashierOnly, async (req, res) => {
    try {
        const order = await dbGet(
            `SELECT orders.*, users.username, users.email 
             FROM orders 
             LEFT JOIN users ON orders.user_id = users.id 
             WHERE orders.id = ? AND orders.status = 'pending'`, 
            [req.params.id]
        );
        if (!order) {
            return res.status(404).json({ error: 'Pending order not found' });
        }
        const items = await dbAll(
            `SELECT order_items.*, medicines.name, medicines.price AS current_price, medicines.quantity AS stock 
             FROM order_items 
             JOIN medicines ON order_items.medicine_id = medicines.id 
             WHERE order_items.order_id = ?`,
            [req.params.id]
        );
        res.json({ order, items });
    } catch (err) {
        console.error("Pending order details error:", err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POS Checkout & Finalize Order (supports walk-ins and completing pending online orders)
app.post('/api/cashier/checkout', cashierOnly, async (req, res) => {
    const { order_id, items, discount_amount, discount_percentage, tax_amount, final_total, payment_method } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required' });
    }

    try {
        // Start database transaction
        await dbRun("BEGIN TRANSACTION");

        let subtotal = 0;
        const verifiedItems = [];

        // Verify that medicines exist and have sufficient stock
        for (const item of items) {
            const med = await dbGet("SELECT * FROM medicines WHERE id = ?", [item.medicine_id]);
            if (!med) {
                await dbRun("ROLLBACK");
                return res.status(400).json({ error: `Medicine ID ${item.medicine_id} not found` });
            }
            if (med.quantity < item.quantity) {
                await dbRun("ROLLBACK");
                return res.status(400).json({ error: `Insufficient stock for ${med.name} (Stock: ${med.quantity}, Requested: ${item.quantity})` });
            }
            subtotal += med.price * item.quantity;
            verifiedItems.push({
                medicine_id: med.id,
                quantity: item.quantity,
                price: med.price
            });
        }

        // Decrement the stock in medicines
        for (const item of verifiedItems) {
            await dbRun("UPDATE medicines SET quantity = quantity - ? WHERE id = ?", [item.quantity, item.medicine_id]);
        }

        const date = new Date().toISOString();
        let finalOrderId = order_id;

        if (order_id) {
            // Finalize an existing pending order
            const pendingOrder = await dbGet("SELECT * FROM orders WHERE id = ? AND status = 'pending'", [order_id]);
            if (!pendingOrder) {
                await dbRun("ROLLBACK");
                return res.status(404).json({ error: 'Pending order not found or already processed' });
            }

            // Update order record to completed and record totals
            await dbRun(
                `UPDATE orders 
                 SET total_price = ?, discount_amount = ?, discount_percentage = ?, tax_amount = ?, final_total = ?, status = 'completed', date = ?, payment_method = ? 
                 WHERE id = ?`,
                [subtotal, discount_amount || 0, discount_percentage || 0, tax_amount || 0, final_total, date, payment_method || 'Cash', order_id]
            );

            // Re-insert order items (in case items or quantities were modified by the cashier)
            await dbRun("DELETE FROM order_items WHERE order_id = ?", [order_id]);
            for (const item of verifiedItems) {
                await dbRun(
                    "INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES (?, ?, ?, ?)",
                    [order_id, item.medicine_id, item.quantity, item.price]
                );
            }
        } else {
            // Direct POS walk-in sale
            const result = await dbRun(
                `INSERT INTO orders (total_price, discount_amount, discount_percentage, tax_amount, final_total, date, user_id, type, status, payment_method) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pos_sale', 'completed', ?)`,
                [subtotal, discount_amount || 0, discount_percentage || 0, tax_amount || 0, final_total, date, req.user.id, payment_method || 'Cash']
            );
            finalOrderId = result.lastID;

            for (const item of verifiedItems) {
                await dbRun(
                    "INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES (?, ?, ?, ?)",
                    [finalOrderId, item.medicine_id, item.quantity, item.price]
                );
            }
        }

        await dbRun("COMMIT");
        res.json({ 
            message: 'Checkout completed successfully', 
            order_id: finalOrderId, 
            subtotal: subtotal,
            discount_amount: discount_amount || 0,
            discount_percentage: discount_percentage || 0,
            tax_amount: tax_amount || 0,
            final_total: final_total 
        });

    } catch (err) {
        await dbRun("ROLLBACK").catch(() => {});
        console.error("POS checkout error:", err);
        res.status(500).json({ error: 'Server error during cashier checkout' });
    }
});

// ------------------------------------------------------------------
// CUSTOMER ROUTES
// ------------------------------------------------------------------

const customerOnly = [authenticateToken, requireRole(['customer', 'admin'])];

// View In-Stock Inventory
app.get('/api/customer/medicines', customerOnly, (req, res) => {
    db.all("SELECT id, name, category, price, quantity FROM medicines WHERE quantity > 0", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Customer checkout (creates a PENDING order, does not deduct stock)
app.post('/api/customer/checkout', customerOnly, async (req, res) => {
    const { items, payment_method } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required' });
    }

    try {
        let subtotal = 0;
        const verifiedItems = [];

        // Check if items are available and calculate subtotal
        for (const item of items) {
            const med = await dbGet("SELECT * FROM medicines WHERE id = ?", [item.medicine_id]);
            if (!med) {
                return res.status(400).json({ error: `Medicine ID ${item.medicine_id} not found` });
            }
            if (med.quantity < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${med.name} (Stock: ${med.quantity})` });
            }
            subtotal += med.price * item.quantity;
            verifiedItems.push({
                medicine_id: med.id,
                quantity: item.quantity,
                price: med.price
            });
        }

        const date = new Date().toISOString();

        // Create pending order
        await dbRun("BEGIN TRANSACTION");

        const result = await dbRun(
            `INSERT INTO orders (total_price, discount_amount, discount_percentage, tax_amount, final_total, date, user_id, type, status, payment_method) 
             VALUES (?, 0, 0, 0, ?, ?, ?, 'online_order', 'pending', ?)`,
            [subtotal, subtotal, date, req.user.id, payment_method || 'Cash']
        );
        const orderId = result.lastID;

        for (const item of verifiedItems) {
            await dbRun(
                "INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES (?, ?, ?, ?)",
                [orderId, item.medicine_id, item.quantity, item.price]
            );
        }

        await dbRun("COMMIT");
        res.json({ message: 'Online Order submitted successfully (Pending cashier confirmation)', order_id: orderId, total_price: subtotal });

    } catch (err) {
        await dbRun("ROLLBACK").catch(() => {});
        console.error("Customer checkout error:", err);
        res.status(500).json({ error: 'Server error during checkout' });
    }
});

// Get customer's orders history
app.get('/api/customer/orders', customerOnly, (req, res) => {
    db.all(
        `SELECT id, total_price, discount_amount, discount_percentage, tax_amount, final_total, date, type, status 
         FROM orders 
         WHERE user_id = ? 
         ORDER BY date DESC`, 
        [req.user.id], 
        (err, rows) => {
            if (err) {
                console.error("Error fetching customer orders:", err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

// Get customer's specific order details (invoice data)
app.get('/api/customer/orders/:id', customerOnly, async (req, res) => {
    const orderId = req.params.id;
    try {
        const order = await dbGet(
            `SELECT id, total_price, discount_amount, discount_percentage, tax_amount, final_total, date, type, status, user_id 
             FROM orders 
             WHERE id = ?`, 
            [orderId]
        );
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Security check: Only the customer who placed the order (or an admin) can see it
        if (order.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. You cannot view other customers\' orders.' });
        }

        const items = await dbAll(
            `SELECT order_items.id, order_items.medicine_id, order_items.quantity, order_items.price, medicines.name 
             FROM order_items 
             JOIN medicines ON order_items.medicine_id = medicines.id 
             WHERE order_items.order_id = ?`,
            [orderId]
        );

        res.json({ order, items });
    } catch (err) {
        console.error("Error fetching customer order detail:", err);
        res.status(500).json({ error: 'Database error' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Medicart API server running on port ${PORT}`);
});
