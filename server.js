require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASS = '',
  DB_NAME = 'bolt-coin',
  JWT_SECRET = 'change_this',
  ENC_KEY = '' // base64 32 bytes recommended
} = process.env;

if (!ENC_KEY) {
  console.warn('Warning: ENC_KEY not set in .env. Stored passwords will not be decryptable across restarts.');
}

const KEY = ENC_KEY ? Buffer.from(ENC_KEY, 'base64') : crypto.randomBytes(32);

async function getDbConnection() {
  return mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

function encrypt(text) {
  const iv = crypto.randomBytes(12); // recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(data) {
  try {
    const b = Buffer.from(data, 'base64');
    const iv = b.slice(0, 12);
    const tag = b.slice(12, 28);
    const encrypted = b.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    return null;
  }
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization format' });
  const token = parts[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Routes
app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const pool = await getDbConnection();
  try {
    const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) return res.status(400).json({ error: 'username already taken' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
    const userId = result.insertId;
    const token = generateToken({ id: userId, username });
    res.json({ ok: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const pool = await getDbConnection();
  try {
    const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(400).json({ error: 'invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = generateToken({ id: user.id, username });
    res.json({ ok: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// New lightweight endpoint: list only titles (no decrypted passwords)
app.get('/api/entries/titles', authenticate, async (req, res) => {
  const pool = await getDbConnection();
  function strengthOf(pw){
    const len = pw.length;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSym = /[^A-Za-z0-9]/.test(pw);
    const diversity = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;
    if (len >= 12 && diversity >= 3) return 'strong';
    if (len >= 8 && diversity >= 2) return 'medium';
    return 'weak';
  }
  try {
    const [rows] = await pool.execute(
      'SELECT id, title, website_url, email, username, category, created_at, updated_at, password_encrypted FROM password_entries WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );
    const items = rows.map(r => {
      const pw = decrypt(r.password_encrypted) || '';
      return {
        id: r.id,
        title: r.title,
        website_url: r.website_url,
        email: r.email,
        username: r.username,
        category: r.category,
        created_at: r.created_at,
        updated_at: r.updated_at,
        strength: strengthOf(pw)
      };
    });
    res.json({ ok: true, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get single entry (decrypted) by id
app.get('/api/entries/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const pool = await getDbConnection();
  try {
    const [rows] = await pool.execute('SELECT id, user_id, title, website_url, email, username, password_encrypted, notes, category, created_at, updated_at FROM password_entries WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    const row = rows[0];
    if (row.user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    return res.json({ ok: true, item: {
      id: row.id,
      title: row.title,
      website_url: row.website_url,
      email: row.email,
      username: row.username,
      password: decrypt(row.password_encrypted),
      notes: row.notes,
      category: row.category,
      created_at: row.created_at,
      updated_at: row.updated_at
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Password strength stats for dashboard
app.get('/api/entries/stats', authenticate, async (req, res) => {
  const pool = await getDbConnection();
  try {
    const [rows] = await pool.execute('SELECT password_encrypted FROM password_entries WHERE user_id = ?', [req.user.id]);
    let total = 0, weak = 0, strong = 0;
    for (const r of rows) {
      total++;
      const pw = decrypt(r.password_encrypted) || '';
      const len = pw.length;
      const hasLower = /[a-z]/.test(pw);
      const hasUpper = /[A-Z]/.test(pw);
      const hasNum = /[0-9]/.test(pw);
      const hasSym = /[^A-Za-z0-9]/.test(pw);
      const diversity = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;
      if (len >= 12 && diversity >= 3) strong++;
      else if (len < 8 || diversity <= 1) weak++;
    }
    res.json({ ok: true, total, weak, strong });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/entries', authenticate, async (req, res) => {
  const pool = await getDbConnection();
  try {
    const [rows] = await pool.execute('SELECT id, title, website_url, email, username, password_encrypted, notes, category, created_at, updated_at FROM password_entries WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    const items = rows.map(r => ({
      id: r.id,
      title: r.title,
      website_url: r.website_url,
      email: r.email,
      username: r.username,
      password: decrypt(r.password_encrypted),
      notes: r.notes,
      category: r.category,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
    res.json({ ok: true, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/entries', authenticate, async (req, res) => {
  const { title, website_url, email, username: entryUser, password, notes, category } = req.body;
  if (!title || !password) return res.status(400).json({ error: 'title and password required' });
  const pool = await getDbConnection();
  try {
    const encrypted = encrypt(password);
    const [result] = await pool.execute('INSERT INTO password_entries (user_id, title, website_url, email, username, password_encrypted, notes, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, website_url || '', email || '', entryUser || '', encrypted, notes || '', category || 'General']);
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.put('/api/entries/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, website_url, email, username: entryUser, password, notes, category } = req.body;
  const pool = await getDbConnection();
  try {
    const [rows] = await pool.execute('SELECT user_id FROM password_entries WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    const encrypted = password ? encrypt(password) : undefined;
    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (website_url !== undefined) { updates.push('website_url = ?'); params.push(website_url); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (entryUser !== undefined) { updates.push('username = ?'); params.push(entryUser); }
    if (encrypted !== undefined) { updates.push('password_encrypted = ?'); params.push(encrypted); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (updates.length === 0) return res.status(400).json({ error: 'nothing to update' });
    params.push(id);
    await pool.execute(`UPDATE password_entries SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.delete('/api/entries/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const pool = await getDbConnection();
  try {
    const [rows] = await pool.execute('SELECT user_id FROM password_entries WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    await pool.execute('DELETE FROM password_entries WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// New route to get available categories
app.get('/api/categories', authenticate, async (req, res) => {
  const pool = await getDbConnection();
  try {
    const [rows] = await pool.execute('SELECT name, icon, color FROM categories ORDER BY name');
    res.json({ ok: true, categories: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bolt-Pass server listening on port ${PORT}`));
