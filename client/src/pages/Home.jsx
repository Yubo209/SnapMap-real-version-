import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-box">
        <h1>Welcome to SnapMap</h1>
        <p>Capture and share your best photography moments with the world.</p>
        <div className="home-buttons">
          <button onClick={() => navigate('/login')}>Login</button>
          <button onClick={() => navigate('/register')}>Register</button>
        </div>
      </div>
    </div>
  );
};

export default Home;