// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import UploadPost from '../components/UploadPost';
import MapView from '../components/MapView';
import AllSpots from '../components/AllSpots';
import MyProfile from '../pages/MyProfile';
import { MapPin, Upload, Image, Settings } from 'lucide-react';
import { getMe } from '../api'; // ★ NEW：拉取用户信息以拿到头像

const Dashboard = () => {
  const [section, setSection] = useState('map');

  // ★ NEW：右上角头像的可变状态（默认尝试读取本地缓存）
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem('avatarUrl') || '/default-avatar-icon-of-social-media-user-vector.jpg'
  );

  // ★ NEW：启动时拉一次 /me，获取最新头像并缓存
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        if (me?.avatarUrl) {
          setAvatarUrl(me.avatarUrl);
          localStorage.setItem('avatarUrl', me.avatarUrl);
        }
      } catch (e) {
        // 未登录/失败就用默认图
      }
    })();
  }, []);

  // ★ NEW：监听来自 MyProfile 的“头像已更新”事件，无需刷新页面即可更新右上角头像
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
          {/* ★★★ 关键：改为使用 avatarUrl，而不是写死的 /default-avatar.png */}
          <img
            src={avatarUrl || '/default-avatar-icon-of-social-media-user-vector.jpg'} // ★ CHANGED
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
            {/* 这里可以加一个菜单项跳转到 Profile，如果需要的话
            <li
              className={section === 'myprofile' ? 'active' : ''}
              onClick={() => setSection('myprofile')}
            >
              Profile
            </li> */}
          </ul>
        </nav>

        {/* Dynamic Section */}
        <main className="dashboard-feed">{renderSection()}</main>
      </div>
    </div>
  );
};

export default Dashboard;
