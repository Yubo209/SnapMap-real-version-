import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="header">
      <h1 className="logo">SnapMap</h1>
      <div className="header-actions">
        <button onClick={handleProfileClick}>My Profile</button>
        <img
          src="/avatar.png"
          alt="User Avatar"
          className="avatar"
          onClick={handleProfileClick}
        />
      </div>
    </header>
  );
};

export default Header;
