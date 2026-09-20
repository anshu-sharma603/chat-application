import React, { useEffect, useRef } from "react";

export default function ChatWindow({
  activeUser,
  messages,
  currentUser,
  text,
  setText,
  onSend,
  isTyping,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!activeUser) {
    return (
      <div className="chat-window empty-state">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="avatar">{activeUser.name[0].toUpperCase()}</div>
        <div>
          <div className="user-name">{activeUser.name}</div>
          <div className="user-status">
            {isTyping ? "typing..." : activeUser.isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      <div className="messages">
        {messages.map((m) => {
          const mine = m.sender === currentUser.id || m.sender?._id === currentUser.id;
          return (
            <div key={m._id} className={`bubble ${mine ? "mine" : "theirs"}`}>
              <span>{m.text}</span>
              {mine && <span className="tick">{m.status === "read" ? "✓✓" : m.status === "delivered" ? "✓✓" : "✓"}</span>}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="input-row">
        <input
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={onSend}>Send</button>
      </div>
    </div>
  );
}
