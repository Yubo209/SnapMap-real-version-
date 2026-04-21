import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Dashboard.css';
import UploadPost from '../features/posts/components/UploadPost';
import MapView from '../features/posts/components/MapView';
import AllSpots from '../features/posts/components/AllSpots';
import MyProfile from './MyProfile';
import { MapPin, Upload, Images, SlidersHorizontal, User } from 'lucide-react';
import { getMe } from '../api';
import SettingsPage from '../components/Settings';
import PostModal from '../features/posts/components/PostModal';
import { usePosts } from '../features/posts/hooks/usePosts';

const DEFAULT_AVATAR = '/default-avatar-icon-of-social-media-user-vector.jpg';

const NAV_ITEMS = [
  { key: 'map',      label: 'Map',      Icon: MapPin            },
  { key: 'upload',   label: 'Upload',   Icon: Upload            },
  { key: 'posts',    label: 'Spots',    Icon: Images            },
  { key: 'settings', label: 'Settings', Icon: SlidersHorizontal },
];

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const sectionFromUrl = searchParams.get('section') || 'map';
  const postIdFromUrl  = searchParams.get('post')    || '';

  const [section,   setSection]   = useState(sectionFromUrl);
  const [avatarUrl, setAvatarUrl] = useState(
    localStorage.getItem('avatarUrl') || DEFAULT_AVATAR
  );

  const { posts = [], isLoading: postsLoading, error: postsError } = usePosts();

  useEffect(() => { setSection(sectionFromUrl); }, [sectionFromUrl]);

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
      if (url) { setAvatarUrl(url); localStorage.setItem('avatarUrl', url); }
    };
    window.addEventListener('avatar-updated', onAvatarUpdated);
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated);
  }, []);

  const selectedPost = useMemo(() => {
    if (!postIdFromUrl) return null;
    return posts.find((p) => p._id === postIdFromUrl) || null;
  }, [postIdFromUrl, posts]);

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
            <h2 className="section-title">Upload a spot</h2>
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
            initialCity={searchParams.get('city') || 'All'}
            initialSearch={searchParams.get('q') || ''}
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

      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="brand" onClick={() => updateSection('map')}>
          <img src="/spotmap-icon.svg" alt="SnapMap" className="brand-icon" />
          <span className="brand-name">SnapMap</span>
        </div>

        <div className="header-right">
          <button
            className="btn-ghost"
            onClick={() => updateSection('myprofile')}
            aria-label="My profile"
          >
            <User size={13} strokeWidth={1.5} />
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

      {/* ── Body ── */}
      <div className="dashboard-body">

        {/* Sidebar */}
        <nav className="dashboard-sidebar">
          <ul>
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <li
                key={key}
                className={section === key ? 'active' : ''}
                onClick={() => updateSection(key)}
              >
                <Icon size={15} strokeWidth={1.5} className="nav-icon" />
                {label}
              </li>
            ))}
          </ul>
        </nav>

        {/* Main */}
        <main
          className={`dashboard-feed${section === 'map' ? ' dashboard-feed--map' : ''}`}
        >
          {renderSection()}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={section === key ? 'active' : ''}
            onClick={() => updateSection(key)}
          >
            <Icon size={19} strokeWidth={1.5} />
            <span>{label}</span>
          </button>
        ))}
        <button
          className={section === 'myprofile' ? 'active' : ''}
          onClick={() => updateSection('myprofile')}
        >
          <User size={19} strokeWidth={1.5} />
          <span>Profile</span>
        </button>
      </nav>

      {/* ── Post modal ── */}
      {selectedPost && (
        <PostModal post={selectedPost} onClose={closePostModal} />
      )}
    </div>
  );
};

export default Dashboard;