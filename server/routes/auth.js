const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const multer = require('multer');
const path = require('path');
const passport = require('passport');

const JWT_SECRET = 'supersecretkey_change_in_prod';

// Multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Register
router.post('/register', (req, res) => {
    const { username, password, displayName } = req.body;
    if (!username || !password || !displayName) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Check if user exists (generic check)
    // We could add constraints but lets run insert
    const stmt = db.prepare("INSERT INTO users (username, password, displayName) VALUES (?, ?, ?)");
    stmt.run([username, hashedPassword, displayName], function (err) {
        if (err) {
            return res.status(400).json({ error: 'Username already taken or invalid' });
        }
        res.status(201).json({ message: 'User created successfully' });
    });
    stmt.finalize();
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

        // If OAuth user (no password)
        if (!user.password) return res.status(401).json({ error: 'Please login with Google/Discord' });

        if (bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id }, JWT_SECRET);
            res.json({ token, user: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// OAUTH ROUTES
// NOTE: We need to redirect to Frontend with the token.
// Frontend URL: Default to localhost, but allow ENV Override
// In Vercel, this won't be localhost. It will be the Vercel URL.
// We should pass a 'redirect' param or configure the production URL.
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const handleOAuthCallback = (req, res) => {
    const user = req.user;
    if (!user) return res.redirect(`${CLIENT_URL}/auth?error=LoginFailed`);

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    // Redirect to frontend with token in query params
    res.redirect(`${CLIENT_URL}/auth?token=${token}`);
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/api/auth/fail' }), handleOAuthCallback);

router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord', { failureRedirect: '/api/auth/fail' }), handleOAuthCallback);

router.get('/fail', (req, res) => {
    res.redirect(`${CLIENT_URL}/auth?error=LoginFailed`);
});


// Get Current User (Protected)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) return res.sendStatus(403);
        req.user = userPayload; // contains { id: ... }
        next();
    });
};

router.get('/me', authenticateToken, (req, res) => {
    db.get("SELECT id, username, displayName, avatar FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err || !user) return res.sendStatus(404);
        res.json(user);
    });
});

// Update Profile
router.post('/update-profile', authenticateToken, upload.single('avatar'), (req, res) => {
    const { displayName } = req.body;
    let sql = "UPDATE users SET displayName = ? WHERE id = ?";
    let params = [displayName, req.user.id];

    if (req.file) {
        sql = "UPDATE users SET displayName = ?, avatar = ? WHERE id = ?";
        params = [displayName, req.file.filename, req.user.id];
    }

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: 'Database update failed' });
        // Return updated user info
        db.get("SELECT id, username, displayName, avatar FROM users WHERE id = ?", [req.user.id], (err, user) => {
            res.json(user);
        });
    });
});

// Search Users
router.get('/search', authenticateToken, (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    db.all("SELECT id, username, displayName, avatar FROM users WHERE username LIKE ? OR displayName LIKE ?", [`%${q}%`, `%${q}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Friend Request
router.post('/friend-request', authenticateToken, (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (senderId == receiverId) return res.status(400).json({ error: "Cannot add self" });

    db.run("INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)", [senderId, receiverId], function (err) {
        if (err) return res.status(500).json({ error: 'Already requested or error' });

        // Notify Receiver
        if (req.io) {
            req.io.to(`user_${receiverId}`).emit('new_friend_request', {
                senderId: senderId,
                displayName: req.user.displayName // Optimistic info
            });
        }
        res.json({ message: 'Request sent' });
    });
});

// Get Friend Requests
router.get('/friend-requests', authenticateToken, (req, res) => {
    db.all(`
        SELECT fr.id, u.username, u.displayName, u.avatar, fr.sender_id
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
    `, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Respond to Friend Request
router.post('/friend-request/respond', authenticateToken, (req, res) => {
    const { requestId, action } = req.body;

    db.get("SELECT * FROM friend_requests WHERE id = ?", [requestId], (err, row) => {
        if (!row) return res.status(404).json({ error: "Request not found" });
        if (row.receiver_id !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

        if (action === 'accept') {
            db.serialize(() => {
                db.run("DELETE FROM friend_requests WHERE id = ?", [requestId]);
                const u1 = Math.min(row.sender_id, row.receiver_id);
                const u2 = Math.max(row.sender_id, row.receiver_id);
                db.run("INSERT INTO friends (user_a, user_b) VALUES (?, ?)", [u1, u2]);
                res.json({ message: "Friend added" });
            });
        } else {
            db.run("DELETE FROM friend_requests WHERE id = ?", [requestId]);
            res.json({ message: "Request rejected" });
        }
    });
});

// Get Friends
router.get('/friends', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT u.id, u.username, u.displayName, u.avatar
        FROM friends f
        JOIN users u ON (u.id = f.user_a OR u.id = f.user_b)
        WHERE (f.user_a = ? OR f.user_b = ?) AND u.id != ?
    `;
    db.all(query, [userId, userId, userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

module.exports = router;
