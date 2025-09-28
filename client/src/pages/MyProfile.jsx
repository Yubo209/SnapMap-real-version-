// src/pages/MyProfile.jsx
import React, { useEffect, useState, useRef } from 'react';
import './MyProfile.css';
import { getMe, uploadImage, updateAvatar, deletePost } from '../api';

const MyProfile = () => {
  const [user, setUser] = useState(null);        // { username, email, avatarUrl, posts: [...] }
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);  // 页面整体加载状态
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // 删除中的帖子 id
  const fileInputRef = useRef(null);

  // 初始化加载我的资料 + 帖子
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUser(me);
        // ★ 新增：把后端返回的头像也同步到本地，供其它组件（如右上角）使用
        if (me?.avatarUrl) {
          localStorage.setItem('avatarUrl', me.avatarUrl); // ★ NEW
          window.dispatchEvent(new CustomEvent('avatar-updated', { detail: me.avatarUrl })); // ★ NEW
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

  // 头像两步流：uploadImage → updateAvatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingAvatar(true);
    setMessage('');

    try {
      // 1) 上传到 Cloudinary（通过后端）
      const up = await uploadImage(file, 'snapmap/avatars'); // { url, public_id }

      // 2) 更新用户头像（后端会删除旧头像）
      await updateAvatar({ avatarUrl: up.url, avatarPublicId: up.public_id });

      // 3) 本地 UI 更新
      setUser(prev => ({ ...prev, avatarUrl: up.url }));
      setMessage('✅ Avatar updated successfully!');

      // ★★★ 关键：通知全局（右上角头像）刷新
      localStorage.setItem('avatarUrl', up.url);                                      // ★ NEW
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: up.url }));    // ★ NEW
    } catch (err) {
      console.error('Avatar update error:', err);
      setMessage('❌ Failed to update avatar.');
    } finally {
      setSavingAvatar(false);
      // 清空文件选择框的值，避免同一张图无法再次触发 change
      e.target.value = '';
    }
  };

  // 删除我的帖子
  const handleDeletePost = async (postId) => {
    const yes = window.confirm('Delete this post? This post will be permanently deleted.');
    if (!yes) return;

    setMessage('');
    setDeletingId(postId);
    try {
      await deletePost(postId);

      // 从本地状态移除该帖子（乐观更新）
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
