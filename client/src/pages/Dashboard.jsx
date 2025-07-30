import React, { useState } from 'react';
import './Dashboard.css';
import UploadPost from '../components/UploadPost';
import MapView from '../components/MapView';
import MyPosts from '../components/MyPosts';

const Dashboard = () => {
  const [section, setSection] = useState('map');  

  const sampleLocations = [
    { lat: 40.7128, lng: -74.0060, title: 'New York Spot' },
    { lat: 34.0522, lng: -118.2437, title: 'LA View' },
    { lat: 35.6895, lng: 139.6917, title: 'Tokyo' },
  ];

  const renderSection = () => {
    switch (section) {
      case 'map':
        return (
          <>
            <h2>📍 Map View</h2>
            <MapView />

          </>
        );
      case 'upload':
        return (
          <>
            <h2>⬆️ Upload a New Post</h2>
            <UploadPost />
          </>
        );
        case 'posts':
          return <MyPosts />;
      case 'settings':
        return <div>Settings (To be implemented)</div>;
      default:
        return <MapView />;
    }
  };

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
            <li onClick={() => setSection('map')}>📍 Map</li>
            <li onClick={() => setSection('upload')}>⬆️ Upload Post</li>
            <li onClick={() => setSection('posts')}>🖼️ My Posts</li>
            <li onClick={() => setSection('settings')}>⚙️ Settings</li>
          </ul>
        </nav>

        {/* Dynamic Section */}
        <main className="dashboard-feed">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
