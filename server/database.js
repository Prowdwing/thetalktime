const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'thetalktime.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

db.serialize(() => {
  // Users
  // Note: We use try/catch logic for column additions in a real migration system.
  // Here, for simplicity in dev, we assume the table creation or simple "add column" if exists.
  // Since we can't easily "alter if not exists" in one line for sqlite without checking,
  // We'll trust the CREATE TABLE IF NOT EXISTS.
  // Ideally, if the user wanted to keep data, we'd do an ALTER TABLE.
  // Given this is a scratch project, I will drop and recreate OR try to alter.
  // Let's try to ALTER for robustness so we don't lose their data.

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE, -- Nullable now for OAuth users who might just use email/id
    password TEXT, -- Nullable for OAuth
    displayName TEXT NOT NULL,
    avatar TEXT DEFAULT 'default_avatar.png',
    google_id TEXT,
    discord_id TEXT,
    email TEXT
  )`, (err) => {
    // If table exists, try to add columns (ignore errors if they exist)
    if (!err) {
      const cols = ['google_id', 'discord_id', 'email'];
      cols.forEach(col => {
        db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT`, () => { });
      });
    }
  });

  // Friend Requests
  db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id),
    UNIQUE(sender_id, receiver_id)
  )`);

  // Friends
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    user_a INTEGER NOT NULL,
    user_b INTEGER NOT NULL,
    PRIMARY KEY (user_a, user_b),
    FOREIGN KEY(user_a) REFERENCES users(id),
    FOREIGN KEY(user_b) REFERENCES users(id)
  )`);

  // Chat Rooms
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY, 
    type TEXT NOT NULL, 
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Chat Participants
  db.run(`CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (chat_id, user_id),
    FOREIGN KEY(chat_id) REFERENCES chats(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Messages
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT,
    attachment_url TEXT,
    attachment_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_id) REFERENCES chats(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  )`);

  // Seed Public Chat
  db.get("SELECT id FROM chats WHERE id = 'global'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO chats (id, type, name) VALUES ('global', 'public', 'Global Chat')");
    }
  });
});

module.exports = db;
