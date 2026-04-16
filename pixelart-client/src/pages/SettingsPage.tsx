interface Props {
  username: string;
}

export function SettingsPage({ username }: Props) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">ตั้งค่าการใช้งาน</p>
        </div>
      </div>
      <div className="settings-list">
        <div className="settings-section">
          <h3 className="settings-section-title">บัญชีผู้ใช้</h3>
          <div className="settings-item">
            <span className="settings-label">ชื่อผู้ใช้</span>
            <span className="settings-value">{username}</span>
          </div>
        </div>
        <div className="settings-section">
          <h3 className="settings-section-title">Board</h3>
          <div className="settings-item">
            <span className="settings-label">Board Size</span>
            <span className="settings-value">
              {import.meta.env.VITE_BOARD_SIZE ?? 32} × {import.meta.env.VITE_BOARD_SIZE ?? 32}
            </span>
          </div>
          <div className="settings-item">
            <span className="settings-label">Server</span>
            <span className="settings-value settings-value--muted">
              {import.meta.env.VITE_HUB_URL}
            </span>
          </div>
        </div>
        <div className="settings-section">
          <div className="empty-badge" style={{ marginTop: 0 }}>More settings coming soon</div>
        </div>
      </div>
    </div>
  );
}
