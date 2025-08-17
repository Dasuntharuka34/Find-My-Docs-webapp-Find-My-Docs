import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext'; // AuthContext import කරන්න
import '../../styles/auth/LoginPage.css'; // Login page සඳහා CSS

// Custom Message Modal Component (අපි කලින් හදාගත් එකම)
const MessageModal = ({ show, title, message, onClose }) => { // onClose එකතු කළා
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="submit-btn">
            Okay
          </button>
        </div>
      </div>
    </div>
  );
};

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext); // AuthContext එකෙන් login function එක ගන්නවා

  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // AuthContext එකේ login function එක call කරනවා
      await login(email, password);
      // Login සාර්ථක නම්, AuthContext එක මගින් user state manage කරනු ඇත.
      // ඔබට මෙතනට login සාර්ථක වූ පසු redirect වීමට logic add කළ හැක.
      // e.g., navigate('/dashboard'); (if using react-router-dom)
    } catch (error) {
      console.error('Login failed:', error);
      setMessageModal({ show: true, title: 'Login Failed', message: error.message, onClose: closeMessageModal });
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="register-link">
          Don't have an account? <a href="/register">Register</a> {/* Register link එක ඔබට අවශ්‍ය නම් */}
        </p>
      </div>

      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onClose={closeMessageModal}
      />
    </div>
  );
}

export default LoginPage;
