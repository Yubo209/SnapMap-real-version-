import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import UploadPost from '../features/posts/components/UploadPost';
import MapView from '../features/posts/components/MapView';
import AllSpots from '../features/posts/components/AllSpots';
import MyProfile from '../pages/MyProfile';
import { MapPin, Upload, Image, Settings, User } from 'lucide-react';
import { getMe } from '../api';
import SettingsPage from '../components/Settings';

const Dashboard = () => {
  const [section, setSection] = useState('map');
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem('avatarUrl') || '/default-avatar-icon-of-social-media-user-vector.jpg'
  );

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        if (me?.avatarUrl) {
          setAvatarUrl(me.avatarUrl);
          localStorage.setItem('avatarUrl', me.avatarUrl);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const onAvatarUpdated = (e) => {
      const url = e.detail;
      if (url) {
        setAvatarUrl(url);
        localStorage.setItem('avatarUrl', url);
      }
    };
    window.addEventListener('avatar-updated', onAvatarUpdated);
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated);
  }, []);

  const renderSection = () => {
    switch (section) {
      case 'map':
        return (
          <div className="dashboard-map-section">
            
            <MapView />
          </div>
        );
      case 'upload':
        return (
          <>
            <h2 className="section-title">Upload a New Post</h2>
            <UploadPost />
          </>
        );
      case 'posts':
        return (
          <>
            
            <AllSpots />
          </>
        );
      case 'settings':
        return <SettingsPage />;
      case 'myprofile':
        return <MyProfile />;
      default:
        return <MapView />;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand" onClick={() => setSection('map')}>
          <img src="/spotmap-icon.svg" alt="SpotMap" className="brand-icon" />
          <span className="brand-name">SnapMap</span>
        </div>

        <div className="header-right">
          <button className="btn btn-ghost" onClick={() => setSection('myprofile')}>
            Profile
          </button>
          <img
            src={avatarUrl || '/default-avatar-icon-of-social-media-user-vector.jpg'}
            alt="Avatar"
            className="avatar-icon"
            onClick={() => setSection('myprofile')}
          />
        </div>
      </header>

      <div className="dashboard-body">
        <nav className="dashboard-sidebar">
          <ul>
            <li className={section === 'map' ? 'active' : ''} onClick={() => setSection('map')}>
              <MapPin size={18} className="nav-icon" />
              Map
            </li>
            <li className={section === 'upload' ? 'active' : ''} onClick={() => setSection('upload')}>
              <Upload size={18} className="nav-icon" />
              Upload Post
            </li>
            <li className={section === 'posts' ? 'active' : ''} onClick={() => setSection('posts')}>
              <Image size={18} className="nav-icon" />
              AllSpots
            </li>
            <li className={section === 'settings' ? 'active' : ''} onClick={() => setSection('settings')}>
              <Settings size={18} className="nav-icon" />
              Settings
            </li>
          </ul>
        </nav>

        <main className={`dashboard-feed ${section === 'map' ? 'dashboard-feed--map' : ''}`}>
          {renderSection()}
        </main>
      </div>

      <nav className="mobile-bottom-nav">
        <button
          className={section === 'map' ? 'active' : ''}
          onClick={() => setSection('map')}
        >
          <MapPin size={18} />
          <span>Map</span>
        </button>

        <button
          className={section === 'upload' ? 'active' : ''}
          onClick={() => setSection('upload')}
        >
          <Upload size={18} />
          <span>Upload</span>
        </button>

        <button
          className={section === 'posts' ? 'active' : ''}
          onClick={() => setSection('posts')}
        >
          <Image size={18} />
          <span>AllSpots</span>
        </button>

        <button
          className={section === 'settings' ? 'active' : ''}
          onClick={() => setSection('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button
          className={section === 'myprofile' ? 'active' : ''}
          onClick={() => setSection('myprofile')}
        >
          <User size={18} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;