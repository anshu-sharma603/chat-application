import React from "react";

export default function Sidebar({ users, activeUser, onSelectUser, currentUser, onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="me">
          <div className="avatar">{currentUser?.name?.[0]?.toUpperCase()}</div>
          <span>{currentUser?.name}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
      <div className="user-list">
        {users.map((u) => (
          <div
            key={u._id}
            className={`user-item ${activeUser?._id === u._id ? "active" : ""}`}
            onClick={() => onSelectUser(u)}
          >
            <div className="avatar">
              {u.name[0].toUpperCase()}
              {u.isOnline && <span className="online-dot" />}
            </div>
            <div className="user-info">
              <div className="user-name">{u.name}</div>
              <div className="user-status">{u.isOnline ? "Online" : "Offline"}</div>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="empty">No other users yet</p>}
      </div>
    </div>
  );
}
