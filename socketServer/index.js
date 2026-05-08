import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv"
import axios from "axios";

dotenv.config()
const app = express();
const server = http.createServer(app)
const PORT = process.env.PORT || 4000;

// Cho phép body json
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_BASE_URL,
  },
});


io.on("connection", (socket) => {

  const internalHeaders = { headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET } }

  // Socket auto connect khi login vô
  socket.on("identity", async (userId) => {
    // ✅ THÊM: broadcast cho tất cả client
    io.emit('user-status-updated', { userId, isOnline: true })
    try {
      socket.userId = userId;
      await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/connect`, {
        userId,
        socketId: socket.id
      }, internalHeaders)
    } catch (error) {
      console.error('❌ Identity error:', error.response?.data || error.message);
    }
  });

  // Socket auto update location khi login vô
  socket.on("update-location", async ({ userId, lat, long }) => {
    try {
      const location = {
        type: "Point",
        coordinates: [long, lat]
      }

      await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/update-location`, {
        userId,
        location
      }, internalHeaders)

      // Cập nhật vị trí deliveryboy
      io.emit("update-deliveryBoy-location", { userId, location });
    } catch (error) {
      console.error('❌ Update location error:', error.response?.data || error.message);
    }
  });

  // Socket join room
  socket.on("join-room", async ({ roomId }) => {
    socket.join(roomId)
  })

  // Socket send message chat
  socket.on("send-message", async (message) => {
    axios.post(`${process.env.NEXT_BASE_URL}/api/chat/save`, message, internalHeaders).catch(err => {
      console.error('❌ Save message error:', err.message)
    })
    io.to(message?.roomId).emit("send-message", message)
  })

  socket.on("disconnect", async (reason) => {
    try {
      await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/disconnect`, {
        userId: socket?.userId
      }, internalHeaders)

      // ✅ THÊM: broadcast cho tất cả client
      if (socket.userId) {
        io.emit('user-status-updated', { userId: socket.userId, isOnline: false })
      }
    } catch (error) {
      console.error('❌ Disconnect error:', error.message);

    }
  });

  socket.on("error", (err) => {
    console.error("⚠️ Socket error:", socket.id, err);
  });

});

app.post("/notify", async (req, res) => {
  const secret = req.headers['x-internal-secret']
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  const { event, data, socketId } = req.body;
  if (socketId) {
    io.to(socketId).emit(event, data);
  } else {
    io.emit(event, data);
  }
  res.status(200).json({ message: "Notify true" });
});

server.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  try {
    await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/reset-all`, {}, {
      headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET }
    })
    console.log('✅ Reset all users to offline on server start');
  } catch (error) {
    console.error('❌ Reset all users failed:', error.message);
  }
});
