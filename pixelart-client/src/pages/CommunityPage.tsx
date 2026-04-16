import { useEffect, useRef, useState } from "react";
import { ChatMessage, Pixel } from "../hooks/usePixelBoard";

interface Props {
  board: Pixel[][];
  messages: ChatMessage[];
  onlineUsers: string[];
  username: string;
  sendMessage: (text: string) => void;
}

function formatTime(sentAt: string) {
  const diff = Math.floor((Date.now() - new Date(sentAt).getTime()) / 1000);
  if (diff < 60) return "เมื่อกี้";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ที่แล้ว`;
  return new Date(sentAt).toLocaleDateString("th-TH");
}

function BoardMiniPreview({ board }: { board: Pixel[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CELL = 6;
  const size = board.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    board.forEach((row) =>
      row.forEach((pixel) => {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(pixel.x * CELL, pixel.y * CELL, CELL, CELL);
      })
    );
  }, [board]);

  return (
    <canvas
      ref={canvasRef}
      width={size * CELL}
      height={size * CELL}
      className="board-preview-canvas"
    />
  );
}

export function CommunityPage({ board, messages, onlineUsers, username, sendMessage }: Props) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // auto-scroll ลงล่างเมื่อมีข้อความใหม่
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // นับ pixels ที่วาดแล้ว
  const paintedCount = board.flat().filter((p) => p.paintedBy).length;
  const totalPixels = board.flat().length;

  return (
    <div className="page community-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">🗣️ Community Board</h2>
          <p className="page-subtitle">พูดคุยกับขยะ</p>
        </div>
        <div className="comm-stats">
          <div className="comm-stat">
            <span className="comm-stat-value">{onlineUsers.length}</span>
            <span className="comm-stat-label">online</span>
          </div>
          <div className="comm-stat">
            <span className="comm-stat-value">{messages.length}</span>
            <span className="comm-stat-label">ข้อความ</span>
          </div>
          <div className="comm-stat">
            <span className="comm-stat-value">{paintedCount}</span>
            <span className="comm-stat-label">pixels</span>
          </div>
        </div>
      </div>

      <div className="community-layout">
        {/* LEFT — Board preview + Online users */}
        <aside className="community-sidebar">
          <div className="comm-card">
            <div className="comm-card-title">🎨 Board ปัจจุบัน</div>
            <div className="board-preview-wrapper">
              <BoardMiniPreview board={board} />
            </div>
            <div className="board-progress-bar">
              <div
                className="board-progress-fill"
                style={{ width: `${(paintedCount / totalPixels) * 100}%` }}
              />
            </div>
            <div className="board-progress-label">
              {paintedCount} / {totalPixels} pixels วาดแล้ว
            </div>
          </div>

          <div className="comm-card">
            <div className="comm-card-title">🟢 ออนไลน์ {onlineUsers.length} คน</div>
            <div className="comm-online-list">
              {onlineUsers.map((u) => (
                <div key={u} className="comm-online-row">
                  <div className="comm-avatar comm-avatar--sm">{u[0]?.toUpperCase()}</div>
                  <span className="comm-online-name">{u}</span>
                  {u === username && <span className="comm-you-tag">you</span>}
                </div>
              ))}
            </div>
          </div>
        </aside>

       
        <section className="community-chat">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <span>💬</span>
                <p>ยังไม่มีข้อความ เป็นคนแรกที่พูดคุย!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.username === username;
              return (
                <div key={msg.id} className={`chat-message ${isMe ? "chat-message--me" : ""}`}>
                  {!isMe && (
                    <div className="comm-avatar comm-avatar--msg">{msg.username[0]?.toUpperCase()}</div>
                  )}
                  <div className="chat-bubble-wrapper">
                    {!isMe && <span className="chat-username">{msg.username}</span>}
                    <div className={`chat-bubble ${isMe ? "chat-bubble--me" : ""}`}>
                      {msg.text}
                    </div>
                    <span className="chat-time">{formatTime(msg.sentAt)}</span>
                  </div>
                  {isMe && (
                    <div className="comm-avatar comm-avatar--msg comm-avatar--me">
                      {msg.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="พิมพ์ข้อความ... (Enter เพื่อส่ง)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={300}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!text.trim()}
            >
              ส่ง
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
