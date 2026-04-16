export function GalleryPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gallery</h2>
          <p className="page-subtitle">ผลงาน pixel art ที่บันทึกไว้</p>
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-icon">🖼️</div>
        <h3>ยังไม่มีผลงาน</h3>
        <p>ผลงานที่บันทึกจาก Pixel Board จะแสดงที่นี่</p>
        <span className="empty-badge">Coming Soon</span>
      </div>
    </div>
  );
}
