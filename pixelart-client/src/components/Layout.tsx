import { useState } from "react";
import { usePixelBoard } from "../hooks/usePixelBoard";
import { usePixelWar } from "../hooks/usePixelWar";
import { PixelBoardPage } from "../pages/PixelBoardPage";
import { GalleryPage } from "../pages/GalleryPage";
import { SettingsPage } from "../pages/SettingsPage";
import { CommunityPage } from "../pages/CommunityPage";
import { PixelWarPage } from "../pages/PixelWarPage";

type Page = "board" | "war" | "community" | "gallery" | "settings";

const NAV_ITEMS: { id: Page; icon: string; label: string }[] = [
  { id: "board", icon: "🎨", label: "Pixel Board" },
  { id: "war", icon: "⚔️", label: "Pixel War" },
  { id: "community", icon: "🗣️", label: "Community" },
  { id: "gallery", icon: "🖼️", label: "Gallery" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

interface Props {
  username: string;
}

export function Layout({ username }: Props) {
  const [activePage, setActivePage] = useState<Page>("board");
  const [collapsed, setCollapsed] = useState(false);

  const { board, connected, paintPixel, undoLastPixel, colorHistory, onlineUsers, cursors, moveCursor, messages, sendMessage } =
    usePixelBoard(username);

  const war = usePixelWar(username);

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🎨</span>
          {!collapsed && <span className="sidebar-logo-text">Pixel Art</span>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {activePage === item.id && <span className="nav-active-bar" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Online users list (expanded) */}
          {!collapsed && (
            <div className="online-section">
              <div className="online-header">
                <span className="online-dot" />
                <span className="online-title">{onlineUsers.length} ออนไลน์</span>
              </div>
              <div className="online-list">
                {onlineUsers.map((u) => (
                  <div key={u} className="online-user-row">
                    <div className="online-user-avatar">{u[0]?.toUpperCase()}</div>
                    <span className="online-user-name">{u}</span>
                    {u === username && <span className="online-you-tag">you</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Collapsed: show count badge */}
          {collapsed && (
            <div className="online-badge-collapsed" title={`${onlineUsers.length} ออนไลน์`}>
              <span className="online-dot" />
              <span className="online-count-badge">{onlineUsers.length}</span>
            </div>
          )}
          <div className="sidebar-user" title={username}>
            <div className="user-avatar">{username[0]?.toUpperCase()}</div>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{username}</span>
                <span className={`user-status ${connected ? "connected" : "disconnected"}`}>
                  {connected ? "Connected" : "Connecting..."}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Collapse toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed((p) => !p)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? "▶" : "◀"}
      </button>

      {/* Main */}
      <main className="main-content">
        {activePage === "board" && (
          <PixelBoardPage
            board={board}
            connected={connected}
            paintPixel={paintPixel}
            undoLastPixel={undoLastPixel}
            colorHistory={colorHistory}
            cursors={cursors}
            username={username}
            onlineUsers={onlineUsers}
            moveCursor={moveCursor}
          />
        )}
        {activePage === "war" && (
          <PixelWarPage
            board={war.board}
            state={war.state}
            myTeam={war.myTeam}
            username={username}
            error={war.error}
            onJoinTeam={war.joinTeam}
            onStartWar={war.startWar}
            onPaint={war.paintPixel}
            onReset={war.resetWar}
          />
        )}
        {activePage === "community" && (
          <CommunityPage
            board={board}
            messages={messages}
            onlineUsers={onlineUsers}
            username={username}
            sendMessage={sendMessage}
          />
        )}
        {activePage === "gallery" && <GalleryPage />}
        {activePage === "settings" && <SettingsPage username={username} />}
      </main>
    </div>
  );
}
