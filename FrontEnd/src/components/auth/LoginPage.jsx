import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate import කරන්න
import universityLogo from '../../assets/uni-logo.png'; // Make sure this path is correct
import Footer from '../common-dashboard/Footer'; // Make sure this path is correct
import '../../styles/auth/LoginPage.css'; // You'll need to create or update this CSS file
import { AuthContext } from '../../context/AuthContext'; // AuthContext for login functionality

// Custom Message Modal Component
const MessageModal = ({ show, title, message, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="modal-button">
            Okay
          </button>
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  const [formData, setFormData] = useState({ // formData state එක භාවිතා කරන්න
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // AuthContext එකෙන් login function එක ගන්නවා

  const handleChange = (e) => { // formData හැසිරවීමට
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.email.trim() === "") { // formData.email භාවිතා කරන්න
      setError("Email cannot be empty");
      return;
    }
    if (formData.password.trim() === "") { // formData.password භාවිතා කරන්න
      setError("Password cannot be empty");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // formData object එක යවන්න
      });

      const data = await response.json();

      // --- DEBUGGING LOGS (ප්‍රයෝජනවත්) ---
      console.log('Backend response data:', data);
      console.log('Type of data.user:', typeof data.user);
      // --- END DEBUGGING LOGS ---

      if (response.ok) {
        // Backend එකෙන් ලැබෙන token සහ user object එක AuthContext.login වෙත යවන්න
        login(data.token, data.user); 
        setMessageModal({ show: true, title: 'Success', message: 'Login successful!' });
        
        // Navigation සඳහා user data වලංගු දැයි තහවුරු කරන්න
        if (typeof data.user === 'object' && data.user !== null && data.user.role) {
            if (data.user.role === 'Admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
        } else {
            console.error("Login successful, but received invalid user object for navigation:", data.user);
            setMessageModal({ show: true, title: 'Error', message: 'Login successful, but user data invalid for navigation. Please contact support.', onConfirm: closeMessageModal });
        }
      } else {
        setMessageModal({ show: true, title: 'Login Failed', message: data.message || 'Invalid email or password.' });
        setError(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Login fetch or AuthContext error:', error);
      setMessageModal({ show: true, title: 'Error', message: 'Network error or server unavailable.' });
      setError('Network error. Please try again.');
    }
  };

  const openForgotPasswordModal = (e) => {
    e.preventDefault();
    setShowForgotPasswordModal(true);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
        <h2>University Of Jaffna</h2>
        <div className="flex justify-center mb-6">
          <img
            src={universityLogo}
            alt="University of Jaffna Logo"
            className="login-logo"
          />
        </div>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
          <input
            className="login-input"
            type="email"
            name="email" // name attribute එක එකතු කරන්න
            placeholder="Email"
            value={formData.email} // formData.email භාවිතා කරන්න
            onChange={handleChange}
            required
          />
          </div>
          <div className="form-group">
          <input
            className="login-input"
            type="password"
            name="password" // name attribute එක එකතු කරන්න
            placeholder="Password"
            value={formData.password} // formData.password භාවිතා කරන්න
            onChange={handleChange}
            required
          />
          </div>
          {error && <p className="text-red-600 font-medium">{error}</p>}
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        <div className="login-links">
          <p>
            Forgot <a href="#" onClick={openForgotPasswordModal}>Password?</a>
          </p>
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
        <div className="footer-wrapper">
          <Footer />
          </div>
        </div>
      </div>

      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={closeForgotPasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p>Please contact system administrator to reset your password. Thank you !</p>
            <button className="modal-close-button" onClick={closeForgotPasswordModal}>Close</button>
          </div>
        </div>
      )}
      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={closeMessageModal} // onClose වෙනුවට onConfirm භාවිතා කරන්න
      />
    </div>
  );
}
