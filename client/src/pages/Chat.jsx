import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth, API_URL } from "../context/AuthContext.jsx";
import { connectSocket, disconnectSocket } from "../socket.js";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import CallModal from "../components/CallModal.jsx";
import useWebRTC from "../hooks/useWebRTC.js";

export default function Chat() {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingMap, setTypingMap] = useState({});
  const socketRef = useRef(null);
  const activeUserRef = useRef(null);
  const usersRef = useRef([]); // always holds latest users list

  // ---- Call state ----
  const [callStatus, setCallStatus] = useState(null); // null | "calling" | "incoming" | "ongoing"
  const [callType, setCallType] = useState("video");
  const [callPeer, setCallPeer] = useState(null); // { id, name }
  const pendingOfferRef = useRef(null);

  const webrtc = useWebRTC(socketRef.current);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // keep usersRef in sync without needing "users" in the socket effect's deps
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

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

    // ---- Call signaling ----
    socket.on("call:incoming", ({ fromUserId, offer, callType: incomingType }) => {
      const caller = usersRef.current.find((u) => u._id === fromUserId) || { _id: fromUserId, name: "Someone" };
      pendingOfferRef.current = offer;
      setCallPeer(caller);
      setCallType(incomingType);
      setCallStatus("incoming");
    });

    socket.on("call:answered", async ({ answer }) => {
      await webrtc.handleAnswer(answer);
      setCallStatus("ongoing");
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      await webrtc.handleIceCandidate(candidate);
    });

    socket.on("call:rejected", () => {
      webrtc.endCall();
      setCallStatus(null);
      setCallPeer(null);
    });

    socket.on("call:ended", () => {
      webrtc.endCall();
      setCallStatus(null);
      setCallPeer(null);
    });

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load user list — token attached directly to avoid race condition
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Failed to load users:", err));
  }, [token]);

  const selectUser = useCallback(
    async (u) => {
      setActiveUser(u);
      const res = await axios.get(`${API_URL}/users/${u._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
      socketRef.current?.emit("message:read", { senderId: u._id });
    },
    [token]
  );

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

  // ---- Call actions ----
  const handleStartCall = async (type) => {
    if (!activeUser) return;
    setCallPeer(activeUser);
    setCallType(type);
    setCallStatus("calling");
    try {
      await webrtc.startCall(activeUser._id, type);
    } catch (err) {
      console.error("Failed to start call:", err);
      alert("Camera/Microphone permission denied. Please allow access and try again.");
      setCallStatus(null);
      setCallPeer(null);
    }
  };

  const handleAcceptCall = async () => {
    if (!callPeer || !pendingOfferRef.current) return;
    try {
      await webrtc.answerCall(callPeer._id, pendingOfferRef.current, callType);
      setCallStatus("ongoing");
    } catch (err) {
      console.error("Failed to answer call:", err);
      alert("Camera/Microphone permission denied. Please allow access and try again.");
      handleRejectCall();
    }
  };

  const handleRejectCall = () => {
    if (callPeer) {
      socketRef.current?.emit("call:reject", { toUserId: callPeer._id });
    }
    setCallStatus(null);
    setCallPeer(null);
  };

  const handleEndCall = () => {
    if (callPeer) {
      socketRef.current?.emit("call:end", { toUserId: callPeer._id });
    }
    webrtc.endCall();
    setCallStatus(null);
    setCallPeer(null);
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
        onStartCall={handleStartCall}
      />
      <CallModal
        callStatus={callStatus}
        callerName={callPeer?.name}
        callType={callType}
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        onToggleMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
      />
    </div>
  );
}