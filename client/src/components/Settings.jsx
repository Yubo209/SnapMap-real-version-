import React from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="settings-card">
      <h2 style={{ marginTop: 0 }}>Settings</h2>

      <div className="settings-row">
        <div>
          <div className="settings-title">Theme</div>
          <div className="settings-desc">Current: {theme}</div>
        </div>
        <button className="btn ghost" onClick={toggleTheme}>
          {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
        </button>
      </div>

      
    </div>
  );
}
