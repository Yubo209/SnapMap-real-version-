import React from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";
import "../style/Settings.css";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <div className="settings-card">
        <div className="settings-row">
          <div>
            <div className="settings-title">Theme</div>
            <div className="settings-desc">Current: {theme}</div>
          </div>
          <button 
            className="btn btn-ghost" 
            onClick={toggleTheme}
            style={{
              backgroundColor: theme === "dark" ? "var(--surface-2)" : "var(--surface-2)",
              borderColor: "var(--border-strong)",
            }}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </div>
  );
}