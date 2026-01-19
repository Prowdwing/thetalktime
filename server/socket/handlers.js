module.exports = (io, db) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        socket.on('send_message', (data) => {
            // data: { chatId, senderId, content, attachmentUrl, attachmentType }
            const { chatId, senderId, content, attachmentUrl, attachmentType } = data;

            // Save to DB
            const stmt = db.prepare("INSERT INTO messages (chat_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)");
            stmt.run([chatId, senderId, content, attachmentUrl, attachmentType], function (err) {
                if (err) console.error(err);

                // Fetch sender info to broadcast full message object
                db.get("SELECT id, displayName, avatar FROM users WHERE id = ?", [senderId], (err, user) => {
                    if (user) {
                        const messagePayload = {
                            id: this.lastID, // from stmt.run
                            chat_id: chatId,
                            sender_id: senderId,
                            displayName: user.displayName,
                            avatar: user.avatar,
                            content,
                            attachment_url: attachmentUrl,
                            attachment_type: attachmentType,
                            created_at: new Date().toISOString()
                        };
                        io.to(chatId).emit('receive_message', messagePayload);
                    }
                });
            });
            stmt.finalize();
        });

        socket.on('start_private_chat', ({ userA, userB }) => {
            // check if chat exists
            db.get(`
                SELECT c.id FROM chats c
                JOIN chat_participants cp1 ON c.id = cp1.chat_id
                JOIN chat_participants cp2 ON c.id = cp2.chat_id
                WHERE c.type = 'private' AND cp1.user_id = ? AND cp2.user_id = ?
            `, [userA, userB], (err, row) => {
                if (row) {
                    socket.emit('private_chat_started', { chatId: row.id });
                } else {
                    // Create new
                    db.run("INSERT INTO chats (type) VALUES ('private')", function (err) {
                        const chatId = this.lastID;
                        db.run("INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)", [chatId, userA]);
                        db.run("INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)", [chatId, userB]);

                        socket.emit('private_chat_started', { chatId: chatId });
                        // Also notify the other user if online? (Future)
                    });
                }
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};
