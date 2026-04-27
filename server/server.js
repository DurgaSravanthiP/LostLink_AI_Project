const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();

app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // 10mb limit for base64 images

const Message = require('./models/Message');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));

// Get chat history for a room
app.get('/api/messages/:roomId', async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected');
        const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        const io = new Server(server, {
            cors: {
                origin: '*'
            }
        });

        io.on("connection", (socket) => {
            socket.on("join_room", (roomId) => {
                socket.join(roomId);
            });

            socket.on("send_message", async (data) => {
                try {
                    // Save message to database
                    const newMessage = new Message({
                        roomId: data.roomId,
                        sender: data.sender, // The real user name
                        message: data.message,
                        time: data.time
                    });
                    await newMessage.save();

                    // Broadcast to others in the room
                    socket.to(data.roomId).emit("receive_message", data);
                } catch (err) {
                    console.error("Socket error:", err);
                }
            });
        });
    })
    .catch(err => console.log(err));
