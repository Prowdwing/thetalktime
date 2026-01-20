const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'supersecretkey_change_in_prod';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

router.post('/upload', authenticateToken, upload.single('attachment'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Determine type
    let type = 'file';
    if (req.file.mimetype.startsWith('image/')) type = 'image';
    if (req.file.mimetype.startsWith('video/')) type = 'video';
    if (req.file.mimetype.startsWith('audio/')) type = 'audio';

    res.json({
        url: req.file.filename,
        type: type,
        originalName: req.file.originalname
    });
});

// Get Messages for a Chat
router.get('/history/:chatId', authenticateToken, (req, res) => {
    const chatId = req.params.chatId;
    // Check if user has access to this chat (unless public)
    db.get("SELECT type FROM chats WHERE id = ?", [chatId], (err, chat) => {
        if (!chat) return res.status(404).json({ error: "Chat not found" });

        // TODO: Access control for private/group chats
        // For MVP, we assume if they have the ID and are auth'd, they can try to load.
        // But for private chars, we should check participants.

        db.all(`
            SELECT m.id, m.content, m.attachment_url, m.attachment_type, m.created_at, m.sender_id, u.displayName, u.avatar 
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.chat_id = ?
            ORDER BY m.created_at ASC
        `, [chatId], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(rows);
        });
    });
});

// Get My Chats (Recent)
router.get('/rooms', authenticateToken, (req, res) => {
    // Return Public Global Chat + Private Chats
    const userId = req.user.id;

    // Get Public Chats
    db.all("SELECT * FROM chats WHERE type = 'public'", (err, publicChats) => {
        // Get Private/Group Chats user is in
        db.all(`
            SELECT c.* 
            FROM chats c
            JOIN chat_participants cp ON c.id = cp.chat_id
            WHERE cp.user_id = ?
        `, [userId], (err, myChats) => {
            const allChats = [...(publicChats || []), ...(myChats || [])];
            res.json(allChats);
        });
    });
});

// Create Group Chat
router.post('/group', authenticateToken, (req, res) => {
    const { name, participants } = req.body; // participants is array of userIds
    if (!name || !participants || !Array.isArray(participants)) {
        return res.status(400).json({ error: 'Invalid group data' });
    }

    const chatId = 'group_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const creatorId = req.user.id;
    const allUserIds = [...new Set([creatorId, ...participants])]; // Ensure unique and include creator

    db.serialize(() => {
        db.run("INSERT INTO chats (id, type, name) VALUES (?, 'group', ?)", [chatId, name], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to create group' });

            const stmt = db.prepare("INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)");
            allUserIds.forEach(uid => {
                stmt.run(chatId, uid);
            });
            stmt.finalize();

            res.json({ id: chatId, type: 'group', name: name, created_at: new Date() });
        });
    });
});

module.exports = router;
