import React, { useContext } from 'react';
import '../../styles/pages/Header.css';
import universityLogo from '../../assets/uni-logo.png';
import { AuthContext } from '../../context/AuthContext'; // AuthContext import කරන්න

function Header({ user }) {
  const { logout } = useContext(AuthContext); 

  const handleLogout = () => {
    logout(); 
  };

  return (
    <header className="header">
      <div className="header-left">
        {universityLogo && <img src={universityLogo} alt="University Logo" className="logo" />}
        <h1 className="university-name">University of Jaffna</h1>
      </div>
      <div className="header-right">
        <div className="user-info">
          <span className="user-name">{user.name}</span> | <span className="user-role">{user.role}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button>
      </div>
    </header>
  );
}

export default Header;
