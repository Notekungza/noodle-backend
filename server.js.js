const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1. เชื่อมต่อฐานข้อมูล SQLite (เปลี่ยนมาใช้ชื่อไฟล์เฉพาะตัว)
const dbPath = path.resolve(__dirname, 'restaurant.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('❌ เชื่อมต่อ SQLite ล้มเหลว:', err.message);
    }
    console.log('🔌 เชื่อมต่อฐานข้อมูล SQLite (restaurant.db) สำเร็จแล้ว!');
});

// 2. สร้างตารางเก็บออเดอร์ก๋วยเตี๋ยวให้ตรงกับหน้าเว็บ (menu_name, soup, toppings)
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_name TEXT NOT NULL,
        soup TEXT NOT NULL,
        toppings TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('❌ สร้างตารางไม่สำเร็จ:', err.message);
    } else {
        console.log('📁 ตาราง orders สำหรับบันทึกก๋วยเตี๋ยวพร้อมใช้งาน');
    }
});

// 3. API สำหรับรับข้อมูลออเดอร์มาจากหน้าเว็บ (POST)
app.post('/api/orders', (req, res) => {
    const { menu_name, soup, toppings } = req.body;

    // ตรวจสอบความถูกต้องของข้อมูลเบื้องต้น
    if (!menu_name || !soup) {
        return res.status(400).json({ error: 'ข้อมูลออเดอร์ไม่ครบถ้วน' });
    }

    const sql = `INSERT INTO orders (menu_name, soup, toppings) VALUES (?, ?, ?)`;
    db.run(sql, [menu_name, soup, toppings], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'บันทึกข้อมูลลงฐานข้อมูลล้มเหลว' });
        }
        res.status(201).json({
            message: 'บันทึกสำเร็จ!',
            order_id: this.lastID
        });
    });
});

// 4. API สำหรับเปิดดูรายการออเดอร์ก๋วยเตี๋ยวทั้งหมด (GET)
app.get('/api/orders', (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// เริ่มต้นเปิดระบบพอร์ต (อัปเดตเพื่อรองรับ Render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});