import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import axios from 'axios';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
        console.error('Failed to fetch user info:', err);
      }
    };

    fetchUser();
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="header">
      <h1 className="logo">SnapMap</h1>
      <div className="header-actions">
        <button onClick={handleProfileClick}>Profile</button>
        <img
          src={
            user?.avatarUrl ||
            '/default-avatar-icon-of-social-media-user-vector.jpg'
          }
          alt="User Avatar"
          className="avatar"
          onClick={handleProfileClick}
        />
      </div>
    </header>
  );
};

export default Header;

