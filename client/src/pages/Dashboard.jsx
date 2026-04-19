import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Dashboard.css';
import UploadPost from '../features/posts/components/UploadPost';
import MapView from '../features/posts/components/MapView';
import AllSpots from '../features/posts/components/AllSpots';
import MyProfile from './MyProfile';
import { MapPin, Upload, Image, Settings, User } from 'lucide-react';
import { getMe } from '../api';
import SettingsPage from '../components/Settings';
import PostModal from '../features/posts/components/PostModal';
import { usePosts } from '../features/posts/hooks/usePosts';

const DEFAULT_AVATAR = '/default-avatar-icon-of-social-media-user-vector.jpg';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const sectionFromUrl = searchParams.get('section') || 'map';
  const postIdFromUrl = searchParams.get('post') || '';

  const [section, setSection] = useState(sectionFromUrl);
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem('avatarUrl') || DEFAULT_AVATAR
  );

  const {
    posts = [],
    isLoading: postsLoading,
    error: postsError,
  } = usePosts();

  useEffect(() => {
    setSection(sectionFromUrl);
  }, [sectionFromUrl]);

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

  const selectedPost = useMemo(() => {
    if (!postIdFromUrl) return null;
    return posts.find((post) => post._id === postIdFromUrl) || null;
  }, [postIdFromUrl, posts]);
  console.log("sectionFromUrl:", sectionFromUrl);
console.log("postIdFromUrl:", postIdFromUrl);
console.log("posts ids:", posts.map((p) => p._id));
console.log("selectedPost:", selectedPost);

  const updateSection = (nextSection) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', nextSection);
    next.delete('post');
    setSearchParams(next);
  };

  const openPostModal = (postId) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', 'posts');
    next.set('post', postId);
    setSearchParams(next);
  };

  const closePostModal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('post');
    setSearchParams(next);
  };

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
          <AllSpots
            posts={posts}
            isLoading={postsLoading}
            error={postsError}
            onOpenPost={openPostModal}
          />
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
        <div className="brand" onClick={() => updateSection('map')}>
          <img src="/spotmap-icon.svg" alt="SpotMap" className="brand-icon" />
          <span className="brand-name">SnapMap</span>
        </div>

        <div className="header-right">
          <button className="btn btn-ghost" onClick={() => updateSection('myprofile')}>
            Profile
          </button>
          <img
            src={avatarUrl || DEFAULT_AVATAR}
            alt="Avatar"
            className="avatar-icon"
            onClick={() => updateSection('myprofile')}
          />
        </div>
      </header>

      <div className="dashboard-body">
        <nav className="dashboard-sidebar">
          <ul>
            <li className={section === 'map' ? 'active' : ''} onClick={() => updateSection('map')}>
              <MapPin size={18} className="nav-icon" />
              Map
            </li>

            <li className={section === 'upload' ? 'active' : ''} onClick={() => updateSection('upload')}>
              <Upload size={18} className="nav-icon" />
              Upload Post
            </li>

            <li className={section === 'posts' ? 'active' : ''} onClick={() => updateSection('posts')}>
              <Image size={18} className="nav-icon" />
              AllSpots
            </li>

            <li className={section === 'settings' ? 'active' : ''} onClick={() => updateSection('settings')}>
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
        <button className={section === 'map' ? 'active' : ''} onClick={() => updateSection('map')}>
          <MapPin size={18} />
          <span>Map</span>
        </button>

        <button className={section === 'upload' ? 'active' : ''} onClick={() => updateSection('upload')}>
          <Upload size={18} />
          <span>Upload</span>
        </button>

        <button className={section === 'posts' ? 'active' : ''} onClick={() => updateSection('posts')}>
          <Image size={18} />
          <span>AllSpots</span>
        </button>

        <button className={section === 'settings' ? 'active' : ''} onClick={() => updateSection('settings')}>
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button className={section === 'myprofile' ? 'active' : ''} onClick={() => updateSection('myprofile')}>
          <User size={18} />
          <span>Profile</span>
        </button>
      </nav>

      {selectedPost ? (
        <PostModal
          post={selectedPost}
          onClose={closePostModal}
        />
      ) : null}
    </div>
  );
  
};

export default Dashboard;
