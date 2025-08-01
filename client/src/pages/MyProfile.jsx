import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './MyProfile.css';

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:5174/api/users/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setUser(res.data);
      } catch (err) {
        console.error('Failed to load user profile', err);
        setMessage('❌ Failed to load profile.');
      }
    };

    fetchUser();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await axios.put(
          'http://localhost:5174/api/users/avatar',
          { avatarBase64: reader.result },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }
        );
        setUser(prev => ({ ...prev, avatarUrl: reader.result }));
        setMessage('✅ Avatar updated successfully!');
      } catch (err) {
        console.error('Error uploading avatar:', err);
        setMessage('❌ Failed to upload avatar.');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="myprofile-container">
      <div className="myprofile-header">
        <img
          src={user.avatarUrl || '/default-avatar-icon-of-social-media-user-vector.jpg'}
          alt="Avatar"
          className="myprofile-avatar"
          onClick={handleAvatarClick}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <div className="myprofile-username">{user.username}</div>
      </div>

      <p><strong>Email:</strong> {user.email}</p>

      {message && <p className="profile-message">{message}</p>}
    </div>
  );
};

export default MyProfile;
