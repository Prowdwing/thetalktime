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
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    displayName TEXT NOT NULL,
    avatar TEXT DEFAULT 'default_avatar.png'
  )`);

  // Friend Requests (sender_id -> receiver_id)
  db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected (though rejected usually deletes)
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id),
    UNIQUE(sender_id, receiver_id)
  )`);

  // Friends (bidirectional is usually modeled as two rows or one row with ordered ids, here we'll use a single row for simplicity or check both ways)
  // Let's use a 'friends' table where we store pairs.
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    user_a INTEGER NOT NULL,
    user_b INTEGER NOT NULL,
    PRIMARY KEY (user_a, user_b),
    FOREIGN KEY(user_a) REFERENCES users(id),
    FOREIGN KEY(user_b) REFERENCES users(id)
  )`);

  // Chat Rooms (Private or Group)
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'private', 'group', 'public'
    name TEXT, -- Null for private, set for group
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Chat Participants
  db.run(`CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (chat_id, user_id),
    FOREIGN KEY(chat_id) REFERENCES chats(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Messages
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT, -- Can be null if attachment only?
    attachment_url TEXT,
    attachment_type TEXT, -- 'image', 'video', 'audio'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_id) REFERENCES chats(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  )`);

  // Seed Public Chat
  db.get("SELECT id FROM chats WHERE type = 'public'", (err, row) => {
    if (!row) {
        db.run("INSERT INTO chats (type, name) VALUES ('public', 'Global Chat')");
    }
  });
});

module.exports = db;
