const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();

require('dotenv').config();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large payloads for base64 images

// Setup SQLite database
const db = new Database(path.join(__dirname, 'database.db'));

// Initialize table
db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        fullName TEXT,
        nambaSimu TEXT,
        timestamp TEXT,
        data TEXT
    )
`);

// POST: Save registration
app.post('/api/registrations', (req, res) => {
    try {
        const regData = req.body;
        
        const id = regData.id || Date.now().toString();
        const fullName = regData.fullName || '';
        const nambaSimu = regData.nambaSimu || '';
        const timestamp = regData.timestamp || new Date().toISOString();
        
        // Ensure ID is set in the data object before stringifying
        regData.id = id;
        const dataStr = JSON.stringify(regData);

        const stmt = db.prepare('INSERT OR REPLACE INTO registrations (id, fullName, nambaSimu, timestamp, data) VALUES (?, ?, ?, ?, ?)');
        stmt.run(id, fullName, nambaSimu, timestamp, dataStr);

        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error("Save error:", err);
        res.status(500).json({ error: 'Failed to save registration' });
    }
});

// GET: All registrations
app.get('/api/registrations', (req, res) => {
    try {
        const rows = db.prepare('SELECT data FROM registrations ORDER BY timestamp DESC').all();
        const registrations = rows.map(row => JSON.parse(row.data));
        res.json(registrations);
    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// GET: Single registration
app.get('/api/registrations/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT data FROM registrations WHERE id = ?').get(req.params.id);
        if (row) {
            res.json(JSON.parse(row.data));
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch registration' });
    }
});

// DELETE: Remove registration
app.delete('/api/registrations/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM registrations WHERE id = ?');
        const info = stmt.run(req.params.id);
        
        if (info.changes > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: 'Failed to delete registration' });
    }
});

app.listen(port, () => {
    console.log(`Backend API running at http://localhost:${port}`);
});
