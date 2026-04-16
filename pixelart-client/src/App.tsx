import { useState } from "react";
import "./App.css";
import { Layout } from "./components/Layout";

function App() {
  const [username, setUsername] = useState("");
  const [confirmedName, setConfirmedName] = useState("");

  // หน้า login ถ้ายังไม่ได้ตั้งชื่อ
  if (!confirmedName) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h1>🎨 Pixel Art</h1>
          <p>ใส่ชื่อของคุณเพื่อเข้าร่วมวาดภาพ</p>
          <input
            className="login-input"
            placeholder="ชื่อของคุณ..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && username.trim() && setConfirmedName(username.trim())}
            autoFocus
          />
          <button
            className="login-btn"
            disabled={!username.trim()}
            onClick={() => setConfirmedName(username.trim())}
          >
            เข้าร่วม
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout username={confirmedName} />
  );
}

export default App;
