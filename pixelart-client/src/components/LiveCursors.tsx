import { CursorInfo } from "../hooks/usePixelBoard";

interface Props {
  cursors: Record<string, CursorInfo>;
  pixelSize: number;   
  myUsername: string;
}


function colorFromUsername(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
}

export function LiveCursors({ cursors, pixelSize, myUsername }: Props) {
  return (
    <>
      {Object.values(cursors)
        .filter((c) => c.username !== myUsername)
        .map((cursor) => (
          <div
            key={cursor.username}
            style={{
              position: "absolute",
              left: cursor.x * pixelSize,
              top: cursor.y * pixelSize,
              width: pixelSize,
              height: pixelSize,
              border: `2px solid ${colorFromUsername(cursor.username)}`,
              boxSizing: "border-box",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -20,
                left: 0,
                fontSize: 11,
                background: colorFromUsername(cursor.username),
                color: "#fff",
                padding: "1px 4px",
                borderRadius: 3,
                whiteSpace: "nowrap",
              }}
            >
              {cursor.username}
            </span>
          </div>
        ))}
    </>
  );
}
