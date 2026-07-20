const express = require('express');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'labdb',
  user:     process.env.DB_USER     || 'labuser',
  password: process.env.DB_PASSWORD || 'changeme',
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.json({ status: 'ok', db: 'unavailable' });
  }
});

app.get('/version', (req, res) => {
  res.json({
    version:     process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV    || 'development',
  });
});

app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM items ORDER BY created_at DESC'
    );
    res.json({ items: result.rows });
  } catch (err) {
    res.json({
      items: [
        { id: 1, name: 'Item Alpha' },
        { id: 2, name: 'Item Beta'  },
      ],
      note: 'mock data — database not connected',
    });
  }
});

app.post('/api/items', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO items (name, created_at) VALUES ($1, NOW()) RETURNING *',
      [name]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'database unavailable' });
  }
});

const server = app.listen(PORT, () => {
  console.log('API demarree sur le port ' + PORT);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recu — arret gracieux...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});