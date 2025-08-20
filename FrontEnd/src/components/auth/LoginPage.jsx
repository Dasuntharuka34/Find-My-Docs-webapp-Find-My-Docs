import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext'; // AuthContext import කරන්න
import '../../styles/auth/LoginPage.css'; // Login page සඳහා CSS
import Footer from '../common-dashboard/Footer';
import universityLogo from '../../assets/uni-logo.png'; // Make sure this path is correct


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

  const [error, setError] = useState("");
  // State for the Forgot Password modal
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false); 
  // const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  // Function to open the Forgot Password modal
  const openForgotPasswordModal = (e) => {
    e.preventDefault(); // Prevent default link behavior
    setShowForgotPasswordModal(true);
  };

  // Function to close the Forgot Password modal
  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
  };

  return (
    <div className='login-page'>
      <div className="login-container">
      <div className="login-box">
        <h2>University Of Jaffna</h2>
        <img
            src={universityLogo}
            alt="University of Jaffna Logo"
            className="login-logo"
          />
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
          <p>
            Forgot <a href="#" onClick={openForgotPasswordModal}>Password?</a>
          </p>
        <p className="register-link">
          Don't have an account? <a href="/register">Register</a> {/* Register link එක ඔබට අවශ්‍ය නම් */}
        </p>
        <Footer/>
      </div>

      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onClose={closeMessageModal}
      />
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={closeForgotPasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p>Please contact system administrator to reset your password. Thank you !</p>
            <button className="modal-close-button" onClick={closeForgotPasswordModal}>Close</button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default LoginPage;
