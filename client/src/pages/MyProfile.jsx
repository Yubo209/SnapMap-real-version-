import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './MyProfile.css';
import { getMe, uploadImage, updateAvatar, deletePost } from '../api';
import PostModal from '../features/posts/components/PostModal';

const MyProfile = () => {
  const [user, setUser] = useState(null);        
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);  
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'likes'
  const [selectedPost, setSelectedPost] = useState(null); // 用于 PostModal
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        // populate likedPosts
        setUser(me);
        
        if (me?.avatarUrl) {
          localStorage.setItem('avatarUrl', me.avatarUrl); 
          window.dispatchEvent(new CustomEvent('avatar-updated', { detail: me.avatarUrl })); 
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        setMessage('Failed to load profile. Please re-login.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingAvatar(true);
    setMessage('');

    try {
      const up = await uploadImage(file, 'snapmap/avatars'); 
      await updateAvatar({ avatarUrl: up.url, avatarPublicId: up.public_id });
      setUser(prev => ({ ...prev, avatarUrl: up.url }));
      setMessage('Avatar updated successfully!');
      localStorage.setItem('avatarUrl', up.url);                                      
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: up.url }));    
    } catch (err) {
      console.error('Avatar update error:', err);
      setMessage('Failed to update avatar.');
    } finally {
      setSavingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDeletePost = async (postId) => {
    const yes = window.confirm('Delete this post? This cannot be undone.');
    if (!yes) return;

    setMessage('');
    setDeletingId(postId);
    try {
      await deletePost(postId);
      setUser(prev => ({
        ...prev,
        posts: (prev.posts || []).filter(p => p._id !== postId)
      }));
      setMessage('Post deleted successfully.');
    } catch (err) {
      console.error('Delete post error:', err);
      setMessage('Failed to delete post.');
    } finally {
      setDeletingId(null);
    }
  };

  // 打开 PostModal
  const handleViewPost = (post) => {
    setSelectedPost(post);
  };

  // 关闭 PostModal
  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  // On Map 逻辑：关闭 modal，跳转到 dashboard 的 map 页面，并显示这个 post
  const handleViewOnMap = (postId) => {
    handleCloseModal();
    // 跳转到 dashboard，map 部分，并 focus 这个 post
    const next = new URLSearchParams();
    next.set('section', 'map');
    next.set('focusPost', postId);
    navigate(`/dashboard?${next.toString()}`);
  };

  const handleLogout = () => {
    const yes = window.confirm('Log out from SnapMap?');
    if (!yes) return;
    localStorage.removeItem('token');
    localStorage.removeItem('me');
    localStorage.removeItem('avatarUrl');
    navigate('/', { replace: true });
  };

  if (loading) return <p style={{ padding: '1rem' }}>Loading profile...</p>;
  if (!user) return <p style={{ padding: '1rem' }}>Not logged in.</p>;

  const likedPosts = user.likedPosts || [];
  const uploadedPosts = user.posts || [];

  return (
    <div className="myprofile-container">
      {/* Header */}
      <div className="myprofile-header">
        <img
          src={user.avatarUrl || '/default-avatar-icon-of-social-media-user-vector.jpg'}
          alt="Avatar"
          className="myprofile-avatar"
          onClick={handleAvatarClick}
          style={{ cursor: savingAvatar ? 'not-allowed' : 'pointer', opacity: savingAvatar ? 0.7 : 1 }}
          title={savingAvatar ? 'Uploading...' : 'Click to change avatar'}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
          disabled={savingAvatar}
        />
        <div className="myprofile-header-info">
          <p className="myprofile-username">{user.username}</p>
          <p className="myprofile-email">{user.email}</p>
        </div>
        <button className="myprofile-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {message && <p className={`myprofile-message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>}

      {/* Tabs */}
      <div className="myprofile-tabs">
        <button
          className={`myprofile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          My Posts ({uploadedPosts.length})
        </button>
        <button
          className={`myprofile-tab ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          Liked ({likedPosts.length})
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          <div className="myprofile-posts">
            {uploadedPosts.length > 0 ? (
              uploadedPosts.map((post) => (
                <div key={post._id} className="myprofile-post-card">
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt={post.name} className="myprofile-post-image" />
                  )}
                  <div className="myprofile-post-info">
                    <h4>{post.name}</h4>
                    <p>{post.description}</p>
                    <small className="myprofile-post-address">{post.address}</small>
                    <div className="myprofile-post-actions">
                      <button
                        className="myprofile-delete-btn"
                        onClick={() => handleDeletePost(post._id)}
                        disabled={deletingId === post._id}
                      >
                        {deletingId === post._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="myprofile-empty">No posts uploaded yet. Start by uploading a spot!</p>
            )}
          </div>
        </div>
      )}

      {/* Likes Tab */}
      {activeTab === 'likes' && (
        <div>
          <div className="myprofile-posts">
            {likedPosts.length > 0 ? (
              likedPosts.map((post) => (
                <div key={post._id} className="myprofile-post-card">
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt={post.name} className="myprofile-post-image" />
                  )}
                  <div className="myprofile-post-info">
                    <h4>{post.name}</h4>
                    <p>{post.description}</p>
                    <small className="myprofile-post-address">{post.address}</small>
                    <small className="myprofile-post-by">
                      by {post.user?.username || 'Unknown'}
                    </small>
                    <div className="myprofile-post-actions">
                      <button
                        className="myprofile-view-btn"
                        onClick={() => handleViewPost(post)}
                      >
                        View Post
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="myprofile-empty">You haven't liked any posts yet.</p>
            )}
          </div>
        </div>
      )}

      {/* PostModal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={handleCloseModal}
          onViewOnMap={() => handleViewOnMap(selectedPost._id)}
        />
      )}
    </div>
  );
};

export default MyProfile;