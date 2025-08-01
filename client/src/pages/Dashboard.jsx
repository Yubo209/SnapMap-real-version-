import React, { useState } from 'react';
import './Dashboard.css';
import UploadPost from '../components/UploadPost';
import MapView from '../components/MapView';
import AllSpots from '../components/AllSpots';
import MyProfile from '../pages/MyProfile'; 
import { MapPin, Upload, Image, Settings } from 'lucide-react';

const Dashboard = () => {
  const [section, setSection] = useState('map');

  const renderSection = () => {
    switch (section) {
      case 'map':
        return (
          <>
            <h2>Map View</h2>
            <MapView />
          </>
        );
      case 'upload':
        return (
          <>
            <h2>Upload a New Post</h2>
            <UploadPost />
          </>
        );
      case 'posts':
        return (
          <>
            <h2>All Photography Spots</h2>
            <AllSpots />
          </>
        );
      case 'settings':
        return <div>Settings (To be implemented)</div>;
      case 'myprofile':
        return (
          <>
            
            <MyProfile />
          </>
        );
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
          <button className="profile-btn" onClick={() => setSection('myprofile')}>
            Profile
          </button>
          <img
            src="/default-avatar.png" 
            alt="Avatar"
            className="avatar-icon"
            onClick={() => setSection('myprofile')}
          />
        </div>
      </header>

      {/* Body layout */}
      <div className="dashboard-body">
        {/* Sidebar */}
        <nav className="dashboard-sidebar">
          <ul>
            <li
              className={section === 'map' ? 'active' : ''}
              onClick={() => setSection('map')}
            >
              <MapPin size={18} style={{ marginRight: 8 }} />
              Map
            </li>
            <li
              className={section === 'upload' ? 'active' : ''}
              onClick={() => setSection('upload')}
            >
              <Upload size={18} style={{ marginRight: 8 }} />
              Upload Post
            </li>
            <li
              className={section === 'posts' ? 'active' : ''}
              onClick={() => setSection('posts')}
            >
              <Image size={18} style={{ marginRight: 8 }} />
              AllSpots
            </li>
            <li
              className={section === 'settings' ? 'active' : ''}
              onClick={() => setSection('settings')}
            >
              <Settings size={18} style={{ marginRight: 8 }} />
              Settings
            </li>
          </ul>
        </nav>

        {/* Dynamic Section */}
        <main className="dashboard-feed">{renderSection()}</main>
      </div>
    </div>
  );
};

export default Dashboard;
