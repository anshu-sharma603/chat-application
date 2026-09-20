const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  },
  { timestamps: true }
);

// Fast lookup of a conversation between two users, newest first
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
