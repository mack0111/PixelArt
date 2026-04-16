import { useState } from "react";
import { ColorPicker } from "../components/ColorPicker";
import { PixelBoard } from "../components/PixelBoard";
import { CursorInfo, Pixel } from "../hooks/usePixelBoard";

interface Props {
  board: Pixel[][];
  connected: boolean;
  paintPixel: (x: number, y: number, color: string) => void;
  undoLastPixel: () => void;
  colorHistory: string[];
  cursors: Record<string, CursorInfo>;
  username: string;
  onlineUsers: string[];
  moveCursor: (x: number, y: number) => void;
}

export function PixelBoardPage({
  board,
  paintPixel,
  undoLastPixel,
  colorHistory,
  cursors,
  username,
  moveCursor,
}: Props) {
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [zoom, setZoom] = useState(2);

  return (
    <div className="page board-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pixel Board</h2>
          <p className="page-subtitle">วาดภาพร่วมกันแบบ real-time</p>
        </div>
      </div>

      <div className="board-toolbar">
        <ColorPicker selectedColor={selectedColor} onSelect={setSelectedColor} />

        <div className="toolbar-divider" />

        <div className="controls-right">
          <label className="zoom-label">
            Zoom
            <input
              type="range" min={1} max={4} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <span className="zoom-value">{zoom}x</span>
          </label>

          <button className="undo-btn" onClick={undoLastPixel}>
            ↩ Undo
          </button>

          {colorHistory.length > 0 && (
            <div className="color-history">
              <div className="color-history-label">Recent</div>
              <div className="color-history-swatches">
                {colorHistory.map((c) => (
                  <div
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    title={c}
                    style={{
                      width: 24, height: 24,
                      backgroundColor: c,
                      border: selectedColor === c ? "2px solid #89b4fa" : "1px solid #45475a",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="board-canvas-wrapper">
        <PixelBoard
          board={board}
          selectedColor={selectedColor}
          zoom={zoom}
          cursors={cursors}
          myUsername={username}
          onPaint={paintPixel}
          onMoveCursor={moveCursor}
        />
      </div>
    </div>
  );
}
