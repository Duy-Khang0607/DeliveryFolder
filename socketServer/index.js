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

  // Socket auto connect khi login vô
  socket.on("identity", async (userId) => {
    try {
      ({ userId })
      await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/connect`, {
        userId,
        socketId: socket.id
      })
    } catch (error) {
      console.error('❌ Identity error:', error.response?.data || error.message);
    }
  });

  // Socket auto update location khi login vô
  socket.on("update-location", async ({ userId, lat, long }) => {
    try {
      const location = {
        type: "Point",
        coordinates: [long, lat] // ✅ Đúng thứ tự GeoJSON: [longitude, latitude]
      }

      await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/update-location`, {
        userId,
        location
      })

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
    axios.post(`${process.env.NEXT_BASE_URL}/api/chat/save`, message)
    io.to(message?.roomId).emit("send-message", message)
  })

  socket.on("disconnect", (reason) => {
  });

  socket.on("error", (err) => {
    console.error("⚠️ Socket error:", socket.id, err);
  });
});

app.post("/notify", async (req, res) => {
  const { event, data, socketId } = req.body;
  if (socketId) {
    io.to(socketId).emit(event, data);
  } else {
    io.emit(event, data);
  }
  res.status(200).json({ message: "Notify true" });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
