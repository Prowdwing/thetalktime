const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
require('./passport-setup'); // Load strategies

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session needed for Passport to manage state during handshake
app.use(session({
    secret: 'keyboard cat', // change in prod
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Root route for health check
app.get('/', (req, res) => {
    res.send('✅ TalkTime Server is running!');
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

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
