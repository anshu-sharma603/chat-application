import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth, API_URL } from "../context/AuthContext.jsx";
import { connectSocket, disconnectSocket } from "../socket.js";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";

export default function Chat() {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingMap, setTypingMap] = useState({});
  const socketRef = useRef(null);
  const activeUserRef = useRef(null);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // Connect socket once
  useEffect(() => {
    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("message:receive", (msg) => {
      const current = activeUserRef.current;
      if (current && (msg.sender === current._id || msg.sender?._id === current._id)) {
        setMessages((prev) => [...prev, msg]);
        socket.emit("message:read", { senderId: msg.sender });
      }
      // refresh user list order/online-status agnostic; could add unread badges here
    });

    socket.on("message:sent", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("presence:update", ({ userId, isOnline }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isOnline } : u))
      );
    });

    socket.on("typing", ({ senderId, isTyping }) => {
      setTypingMap((prev) => ({ ...prev, [senderId]: isTyping }));
    });

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load user list
  useEffect(() => {
    axios.get(`${API_URL}/users`).then((res) => setUsers(res.data));
  }, []);

  const selectUser = useCallback(async (u) => {
    setActiveUser(u);
    const res = await axios.get(`${API_URL}/users/${u._id}/messages`);
    setMessages(res.data);
    socketRef.current?.emit("message:read", { senderId: u._id });
  }, []);

  const sendMessage = () => {
    if (!text.trim() || !activeUser) return;
    socketRef.current?.emit("message:send", {
      receiverId: activeUser._id,
      text,
    });
    setText("");
    socketRef.current?.emit("typing", { receiverId: activeUser._id, isTyping: false });
  };

  const handleTextChange = (val) => {
    setText(val);
    if (activeUser) {
      socketRef.current?.emit("typing", { receiverId: activeUser._id, isTyping: val.length > 0 });
    }
  };

  return (
    <div className="chat-page">
      <Sidebar
        users={users}
        activeUser={activeUser}
        onSelectUser={selectUser}
        currentUser={user}
        onLogout={() => {
          disconnectSocket();
          logout();
        }}
      />
      <ChatWindow
        activeUser={activeUser}
        messages={messages}
        currentUser={user}
        text={text}
        setText={handleTextChange}
        onSend={sendMessage}
        isTyping={activeUser ? !!typingMap[activeUser._id] : false}
      />
    </div>
  );
}
