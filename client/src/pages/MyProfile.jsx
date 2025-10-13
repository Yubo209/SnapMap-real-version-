
import React, { useEffect, useState, useRef } from 'react';
import './MyProfile.css';
import { getMe, uploadImage, updateAvatar, deletePost } from '../api';

const MyProfile = () => {
  const [user, setUser] = useState(null);        
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);  
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [deletingId, setDeletingId] = useState(null); 
  const fileInputRef = useRef(null);

  
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUser(me);
        
        if (me?.avatarUrl) {
          localStorage.setItem('avatarUrl', me.avatarUrl); 
          window.dispatchEvent(new CustomEvent('avatar-updated', { detail: me.avatarUrl })); 
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        setMessage('❌ Failed to load profile. Please re-login.');
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
      setMessage('✅ Avatar updated successfully!');

      
      localStorage.setItem('avatarUrl', up.url);                                      
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: up.url }));    
    } catch (err) {
      console.error('Avatar update error:', err);
      setMessage('❌ Failed to update avatar.');
    } finally {
      setSavingAvatar(false);
      
      e.target.value = '';
    }
  };

  
  const handleDeletePost = async (postId) => {
    const yes = window.confirm('Delete this post? This post will be permanently deleted.');
    if (!yes) return;

    setMessage('');
    setDeletingId(postId);
    try {
      await deletePost(postId);

      
      setUser(prev => ({
        ...prev,
        posts: (prev.posts || []).filter(p => p._id !== postId)
      }));
      setMessage('✅ Post deleted.');
    } catch (err) {
      console.error('Delete post error:', err);
      setMessage('❌ Failed to delete post.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p style={{ padding: '1rem' }}>Loading...</p>;
  if (!user) return <p style={{ padding: '1rem' }}>Not logged in.</p>;

  return (
    <div className="myprofile-container">
      <h2 className="myprofile-header">My Profile</h2>

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
        <div>
          <p className="myprofile-username">{user.username}</p>
          <p>{user.email}</p>
        </div>
      </div>

      {message && <p className="myprofile-message" style={{ marginTop: 8 }}>{message}</p>}

      <h3 className="myprofile-posts-title">My Uploaded Posts</h3>

      <div className="myprofile-posts">
        {user.posts && user.posts.length > 0 ? (
          user.posts.map((post) => (
            <div key={post._id} className="myprofile-post-card">
              {post.imageUrl && (
                <img src={post.imageUrl} alt={post.name} className="myprofile-post-image" />
              )}
              <div className="myprofile-post-info">
                <h4>{post.name}</h4>
                <p>{post.description}</p>
                <small>{post.address}</small>

                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    disabled={deletingId === post._id}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #e33',
                      background: deletingId === post._id ? '#f8d7da' : '#fff',
                      color: '#e33',
                      cursor: deletingId === post._id ? 'not-allowed' : 'pointer'
                    }}
                    title="Delete this post"
                  >
                    {deletingId === post._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No posts uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
