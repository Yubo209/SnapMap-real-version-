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
import MobileUploadSheet from '../features/posts/components/MobileUploadSheet';

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

  // Address pre-filled from map create-pin
  const [prefilledAddress, setPrefilledAddress] = useState('');

  // Mobile upload sheet
  const [sheetOpen,        setSheetOpen]        = useState(false);
  const [sheetPrefillAddr, setSheetPrefillAddr] = useState('');

  const isMobile = () =>
    typeof window !== 'undefined' && window.innerWidth <= 768;

  const { posts = [], isLoading: postsLoading, error: postsError, refresh } = usePosts();

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
    refresh();
  };

  const handleUploadSuccess = () => {
    refresh();
  };

  // From map create-pin — sheet on mobile, section nav on desktop
  const handleCreateFromMap = (address) => {
    if (isMobile()) {
      setSheetPrefillAddr(address || '');
      if (address) sessionStorage.setItem('snapmap_prefill_address', address);
      setSheetOpen(true);
    } else {
      if (address) sessionStorage.setItem('snapmap_prefill_address', address);
      setPrefilledAddress(address || '');
      const next = new URLSearchParams(searchParams);
      next.set('section', 'upload');
      next.delete('post');
      setSearchParams(next);
    }
  };

  // Upload button — sheet on mobile, section nav on desktop
  const handleUploadClick = () => {
    if (isMobile()) {
      setSheetPrefillAddr('');
      setSheetOpen(true);
    } else {
      updateSection('upload');
    }
  };

  // PostModal "On Map": close modal, go to map, open that post's mini card
  const handleViewOnMap = (postId) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', 'map');
    next.set('focusPost', postId);
    next.delete('post');
    setSearchParams(next);
  };

  return (
    <div className="dashboard-container">

      <header className="dashboard-header">
        <div className="brand" onClick={() => updateSection('map')}>
          <img src="/spotmap-icon.svg" alt="SnapMap" className="brand-icon" />
          <span className="brand-name">SnapMap</span>
        </div>
        <div className="header-right">
          <button className="btn-ghost" onClick={() => updateSection('myprofile')} aria-label="My profile">
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

      <div className="dashboard-body">
        <nav className="dashboard-sidebar">
          <ul>
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <li
                key={key}
                className={section === key ? 'active' : ''}
                onClick={() => key === 'upload' ? handleUploadClick() : updateSection(key)}
              >
                <Icon size={15} strokeWidth={1.5} className="nav-icon" />
                {label}
              </li>
            ))}
          </ul>
        </nav>

        <main className={`dashboard-feed${section === 'map' ? ' dashboard-feed--map' : ''}`}>
          {/* Keep all sections mounted — just hide/show with display */}
          
          <div style={{ display: section === 'map' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
            <div className="dashboard-map-section">
              <MapView onCreateFromMap={handleCreateFromMap} />
            </div>
          </div>

          <div style={{ display: section === 'upload' ? 'block' : 'none' }}>
            <h2 className="section-title">Upload a spot</h2>
            <UploadPost
              onSuccess={handleUploadSuccess}
              prefilledAddress={prefilledAddress}
              onAddressUsed={() => setPrefilledAddress('')}
            />
          </div>

          <div style={{ display: section === 'posts' ? 'block' : 'none' }}>
            <AllSpots
              posts={posts}
              isLoading={postsLoading}
              error={postsError}
              onOpenPost={openPostModal}
              initialCity={searchParams.get('city') || 'All'}
              initialSearch={searchParams.get('q') || ''}
            />
          </div>

          <div style={{ display: section === 'settings' ? 'block' : 'none' }}>
            <SettingsPage />
          </div>

          <div style={{ display: section === 'myprofile' ? 'block' : 'none' }}>
            <MyProfile />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — NOT AFFECTED by display changes above */}
      <nav className="mobile-bottom-nav">
        {/* Map */}
        <button className={section === 'map' ? 'active' : ''} onClick={() => updateSection('map')}>
          <MapPin size={22} strokeWidth={1.5} />
          <span>Map</span>
        </button>
        {/* Spots */}
        <button className={section === 'posts' ? 'active' : ''} onClick={() => updateSection('posts')}>
          <Images size={22} strokeWidth={1.5} />
          <span>Spots</span>
        </button>
        {/* Center plus */}
        <button className="mobile-nav-plus" onClick={handleUploadClick} aria-label="Create post">
          <div className="mobile-nav-plus-inner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5"  y1="12" x2="19" y2="12"/>
            </svg>
          </div>
        </button>
        {/* Settings */}
        <button className={section === 'settings' ? 'active' : ''} onClick={() => updateSection('settings')}>
          <SlidersHorizontal size={22} strokeWidth={1.5} />
          <span>Settings</span>
        </button>
        {/* Profile */}
        <button className={section === 'myprofile' ? 'active' : ''} onClick={() => updateSection('myprofile')}>
          <User size={22} strokeWidth={1.5} />
          <span>Profile</span>
        </button>
      </nav>

      {/* Mobile upload sheet */}
      <MobileUploadSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={() => { refresh(); setSheetOpen(false); }}
        prefilledAddress={sheetPrefillAddr}
      />

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={closePostModal}
          onViewOnMap={handleViewOnMap}
        />
      )}
    </div>
  );
};

export default Dashboard;