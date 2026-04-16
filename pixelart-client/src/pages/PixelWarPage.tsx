import { useRef } from "react";
import { WarPixel, WarState, WarTeam } from "../hooks/usePixelWar";

const TEAM_COLOR: Record<WarTeam, string> = {
  Red: "#f38ba8",
  Blue: "#89b4fa",
  None: "#1e1e2e",
};

const TEAM_LABEL: Record<WarTeam, string> = {
  Red: "🔴 ทีมแดง",
  Blue: "🔵 ทีมน้ำเงิน",
  None: "—",
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface Props {
  board: WarPixel[][];
  state: WarState;
  myTeam: WarTeam;
  username: string;
  error: string | null;
  onJoinTeam: (team: WarTeam) => void;
  onStartWar: (sec: number) => void;
  onPaint: (x: number, y: number) => void;
  onReset: () => void;
}

export function PixelWarPage({
  board,
  state,
  myTeam,
  username,
  error,
  onJoinTeam,
  onStartWar,
  onPaint,
  onReset,
}: Props) {
  const isPainting = useRef(false);

  const redPct = state.totalPixels > 0 ? (state.redCount / state.totalPixels) * 100 : 0;
  const bluePct = state.totalPixels > 0 ? (state.blueCount / state.totalPixels) * 100 : 0;

  const redCount = Object.values(state.players).filter((t) => t === "Red").length;
  const blueCount = Object.values(state.players).filter((t) => t === "Blue").length;

  const PIXEL_SIZE = 16;

  return ( 
    <div className="page war-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">⚔️ Pixel War</h2>
          <p className="page-subtitle">แย่งพื้นที่ board พวกเหี้ย</p>
        </div>
        {state.isRunning && (
          <div className={`war-timer ${state.secondsLeft <= 30 ? "war-timer--urgent" : ""}`}>
            ⏱ {formatTime(state.secondsLeft)}
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && <div className="war-error-toast">{error}</div>}

      {/* Winner banner */}
      {!state.isRunning && state.winner && (
        <div className={`war-winner-banner war-winner-banner--${state.winner.toLowerCase()}`}>
          <span className="war-winner-icon">{state.winner === "Red" ? "🔴" : "🔵"}</span>
          <span className="war-winner-text">{TEAM_LABEL[state.winner]} ชนะ!</span>
          <span className="war-winner-score">
            แดง {state.redCount} px · น้ำเงิน {state.blueCount} px
          </span>
          <button className="war-reset-btn" onClick={onReset}>เริ่มใหม่</button>
        </div>
      )}

      <div className="war-layout">
        {/* LEFT PANEL */}
        <aside className="war-sidebar">

          {/* Score bar */}
          <div className="war-card">
            <div className="war-card-title">📊 คะแนน</div>
            <div className="war-score-bar">
              <div className="war-score-red" style={{ width: `${redPct}%` }} />
              <div className="war-score-blue" style={{ width: `${bluePct}%` }} />
            </div>
            <div className="war-score-labels">
              <span className="war-score-label war-score-label--red">
                🔴 {state.redCount} px ({redPct.toFixed(1)}%)
              </span>
              <span className="war-score-label war-score-label--blue">
                🔵 {state.blueCount} px ({bluePct.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Team selection */}
          <div className="war-card">
            <div className="war-card-title">🏳️ เลือกทีม</div>
            {!state.isRunning ? (
              <div className="war-team-buttons">
                <button
                  className={`war-team-btn war-team-btn--red ${myTeam === "Red" ? "active" : ""}`}
                  onClick={() => onJoinTeam("Red")}
                  disabled={state.isRunning}
                >
                  🔴 ทีมแดง
                  <span className="war-team-count">{redCount} คน</span>
                </button>
                <button
                  className={`war-team-btn war-team-btn--blue ${myTeam === "Blue" ? "active" : ""}`}
                  onClick={() => onJoinTeam("Blue")}
                  disabled={state.isRunning}
                >
                  🔵 ทีมน้ำเงิน
                  <span className="war-team-count">{blueCount} คน</span>
                </button>
              </div>
            ) : (
              <div className="war-my-team">
                <span>คุณอยู่ทีม</span>
                <span className={`war-team-badge war-team-badge--${myTeam.toLowerCase()}`}>
                  {TEAM_LABEL[myTeam]}
                </span>
              </div>
            )}
          </div>

          {/* Start / Reset */}
          <div className="war-card">
            <div className="war-card-title">🎮 ควบคุมเกม</div>
            {!state.isRunning && !state.winner && (
              <div className="war-start-options">
                <button className="war-start-btn" onClick={() => onStartWar(120)}
                  disabled={myTeam === "None"}>
                  ▶ เริ่ม 2 นาที
                </button>
                <button className="war-start-btn" onClick={() => onStartWar(180)}
                  disabled={myTeam === "None"}>
                  ▶ เริ่ม 3 นาที
                </button>
                <button className="war-start-btn" onClick={() => onStartWar(300)}
                  disabled={myTeam === "None"}>
                  ▶ เริ่ม 5 นาที
                </button>
                {myTeam === "None" && (
                  <p className="war-hint">เลือกทีมก่อนเริ่มเกม</p>
                )}
              </div>
            )}
            {state.isRunning && (
              <p className="war-hint">เกมกำลังดำเนินอยู่ ⚔️</p>
            )}
            {!state.isRunning && state.winner && (
              <button className="war-reset-btn" onClick={onReset}>🔄 Reset game</button>
            )}
          </div>

          {/* Players */}
          <div className="war-card">
            <div className="war-card-title">👥 ผู้เล่น</div>
            <div className="war-players-list">
              {Object.entries(state.players).map(([name, team]) => (
                <div key={name} className="war-player-row">
                  <div className={`war-player-dot war-player-dot--${team.toLowerCase()}`} />
                  <span className={`war-player-name ${name === username ? "war-player-name--me" : ""}`}>
                    {name}
                    {name === username && " (you)"}
                  </span>
                </div>
              ))}
              {Object.keys(state.players).length === 0 && (
                <p className="war-hint">ยังไม่มีผู้เล่น</p>
              )}
            </div>
          </div>
        </aside>

        {/* BOARD */}
        <div className="war-board-wrapper">
          <div
            className="war-board"
            style={{
              gridTemplateColumns: `repeat(${board[0]?.length ?? 32}, ${PIXEL_SIZE}px)`,
            }}
            onMouseDown={() => { isPainting.current = true; }}
            onMouseUp={() => { isPainting.current = false; }}
            onMouseLeave={() => { isPainting.current = false; }}
          >
            {board.flat().map((pixel) => (
              <div
                key={`${pixel.x}-${pixel.y}`}
                className="war-pixel"
                style={{
                  width: PIXEL_SIZE,
                  height: PIXEL_SIZE,
                  backgroundColor: TEAM_COLOR[pixel.team],
                }}
                onMouseDown={() => state.isRunning && myTeam !== "None" && onPaint(pixel.x, pixel.y)}
                onMouseEnter={() => isPainting.current && state.isRunning && myTeam !== "None" && onPaint(pixel.x, pixel.y)}
                title={pixel.paintedBy ? `วาดโดย ${pixel.paintedBy}` : undefined}
              />
            ))}
          </div>
          {!state.isRunning && !state.winner && (
            <div className="war-board-overlay">
              <span>{myTeam === "None" ? "เลือกทีมก่อนเริ่มเกม" : "รอผู้จัดการกด Start"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
