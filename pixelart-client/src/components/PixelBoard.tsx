import { CursorInfo, Pixel } from "../hooks/usePixelBoard";
import { LiveCursors } from "./LiveCursors";

interface Props {
  board: Pixel[][];
  selectedColor: string;
  zoom: number;
  cursors: Record<string, CursorInfo>;
  myUsername: string;
  onPaint: (x: number, y: number, color: string) => void;
  onMoveCursor: (x: number, y: number) => void;
}

export function PixelBoard({ board, selectedColor, zoom, cursors, myUsername, onPaint, onMoveCursor }: Props) {
  const pixelSize = zoom * 8;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${board[0]?.length ?? 32}, ${pixelSize}px)`,
          border: "1px solid #ccc",
          cursor: "crosshair",
          userSelect: "none",
        }}
      >
        {board.flat().map((pixel) => {
          const ago = pixel.paintedAt
            ? Math.round((Date.now() - new Date(pixel.paintedAt).getTime()) / 60000)
            : null;
          const tooltip = pixel.paintedBy
            ? `${pixel.paintedBy}${ago !== null ? ` · ${ago < 1 ? "เมี่ยวๆ นี้เอง" : `${ago} นาทีที่แล้ว`}` : ""}`
            : undefined;

          return (
            <div
              key={`${pixel.x}-${pixel.y}`}
              title={tooltip}
              onClick={() => onPaint(pixel.x, pixel.y, selectedColor)}
              onMouseEnter={() => onMoveCursor(pixel.x, pixel.y)}
              style={{
                width: pixelSize,
                height: pixelSize,
                backgroundColor: pixel.color,
                boxSizing: "border-box",
                border: "0.5px solid #eee",
              }}
            />
          );
        })}
      </div>

      {/* Live cursors ของ user อื่น overlay อยู่บน board */}
      <LiveCursors cursors={cursors} pixelSize={pixelSize} myUsername={myUsername} />
    </div>
  );
}
