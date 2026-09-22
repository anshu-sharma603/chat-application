import React, { useEffect, useRef, useState } from "react";

export default function CallModal({
  callStatus,      // "calling" | "incoming" | "ongoing" | null
  callerName,
  callType,        // "video" | "audio"
  localStream,
  remoteStream,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!callStatus) return null;

  return (
    <div className="call-overlay">
      {callStatus === "incoming" && (
        <div className="call-card">
          <div className="avatar big">{callerName?.[0]?.toUpperCase()}</div>
          <h2>{callerName}</h2>
          <p>Incoming {callType} call...</p>
          <div className="call-actions">
            <button className="btn-reject" onClick={onReject}>Decline</button>
            <button className="btn-accept" onClick={onAccept}>Accept</button>
          </div>
        </div>
      )}

      {callStatus === "calling" && (
        <div className="call-card">
          <div className="avatar big">{callerName?.[0]?.toUpperCase()}</div>
          <h2>{callerName}</h2>
          <p>Calling...</p>
          <div className="call-actions">
            <button className="btn-reject" onClick={onEnd}>Cancel</button>
          </div>
        </div>
      )}

      {callStatus === "ongoing" && (
        <div className="call-active">
          {callType === "video" ? (
            <>
              <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />
              <video ref={localVideoRef} className="local-video" autoPlay playsInline muted />
            </>
          ) : (
            <div className="audio-call-info">
              <div className="avatar big">{callerName?.[0]?.toUpperCase()}</div>
              <h2>{callerName}</h2>
              <p>Audio call in progress</p>
              {/* audio still needs an element to play remote sound */}
              <video ref={remoteVideoRef} autoPlay playsInline style={{ display: "none" }} />
            </div>
          )}

          <div className="call-controls">
            <button
              onClick={() => {
                setMuted((m) => !m);
                onToggleMute();
              }}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            {callType === "video" && (
              <button
                onClick={() => {
                  setCameraOff((c) => !c);
                  onToggleCamera();
                }}
              >
                {cameraOff ? "Camera On" : "Camera Off"}
              </button>
            )}
            <button className="btn-reject" onClick={onEnd}>End Call</button>
          </div>
        </div>
      )}
    </div>
  );
}
