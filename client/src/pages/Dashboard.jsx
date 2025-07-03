// client/pages/Dashboard.jsx
import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>SnapMap</h1>
        <div className="header-right">
          <button className="profile-btn">Profile</button>
          <img
            src="/default-avatar.png"
            alt="Avatar"
            className="avatar-icon"
          />
        </div>
      </header>

      {/* Body layout */}
      <div className="dashboard-body">
        {/* Sidebar */}
        <nav className="dashboard-sidebar">
          <ul>
            <li>📍 Map</li>
            <li>🖼️ My Posts</li>
            <li>⚙️ Settings</li>
          </ul>
        </nav>

        {/* Feed */}
        <main className="dashboard-feed">
          <h2>Recent Uploads</h2>
          {/* 图片流将在这里动态渲染 */}
          <div className="photo-grid">
            {/* 示例图片 */}
            <img src="/sample1.jpg" alt="Sample 1" />
            <img src="/sample2.jpg" alt="Sample 2" />
            <img src="/sample3.jpg" alt="Sample 3" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;