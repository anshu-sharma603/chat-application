const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// GET /api/users -> list all other users (for sidebar/contact list)
router.get("/", requireAuth, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.userId } })
    .select("name email avatar isOnline lastSeen")
    .sort({ name: 1 });
  res.json(users);
});

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("name email avatar");
  res.json(user);
});

// GET /api/users/:id/messages -> conversation history with another user
router.get("/:id/messages", requireAuth, async (req, res) => {
  const otherId = req.params.id;
  const messages = await Message.find({
    $or: [
      { sender: req.userId, receiver: otherId },
      { sender: otherId, receiver: req.userId },
    ],
  }).sort({ createdAt: 1 });
  res.json(messages);
});

module.exports = router;
