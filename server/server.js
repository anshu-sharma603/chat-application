require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => res.send("Chat API is running"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "*" },
});

// userId -> socketId, so we know where to deliver a message
const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.userId;
  onlineUsers.set(userId, socket.id);
  await User.findByIdAndUpdate(userId, { isOnline: true });
  io.emit("presence:update", { userId, isOnline: true });

  // Join a personal room so we can target this user easily
  socket.join(userId);

  socket.on("message:send", async ({ receiverId, text }) => {
    if (!text || !text.trim()) return;
    const message = await Message.create({
      sender: userId,
      receiver: receiverId,
      text: text.trim(),
      status: onlineUsers.has(receiverId) ? "delivered" : "sent",
    });

    // Send to receiver if online
    io.to(receiverId).emit("message:receive", message);
    // Echo back to sender (so their own UI updates with the saved message)
    socket.emit("message:sent", message);
  });

  socket.on("typing", ({ receiverId, isTyping }) => {
    io.to(receiverId).emit("typing", { senderId: userId, isTyping });
  });

  socket.on("message:read", async ({ senderId }) => {
    await Message.updateMany(
      { sender: senderId, receiver: userId, status: { $ne: "read" } },
      { $set: { status: "read" } }
    );
    io.to(senderId).emit("message:readAck", { readerId: userId });
  });

  socket.on("disconnect", async () => {
    onlineUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
    io.emit("presence:update", { userId, isOnline: false });
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
