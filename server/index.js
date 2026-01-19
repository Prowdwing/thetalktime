const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, replace with client URL
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// We'll pass io to routes if needed or handle sockets separately
// A simple way is to attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Socket.io Handlers
const socketHandlers = require('./socket/handlers');
socketHandlers(io, db);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
