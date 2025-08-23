import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import universityLogo from '../../assets/uni-logo.png'; // Make sure this path is correct
import Footer from '../pages/Footer'; // Make sure this path is correct
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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
   const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => { 
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.email.trim() === "") { 
      setError("Email cannot be empty");
      return;
    }
    if (formData.password.trim() === "") { 
      setError("Password cannot be empty");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), 
      });

      const data = await response.json();

      // --- DEBUGGING LOGS ---
      console.log('Backend response data:', data);
      console.log('Type of data.user:', typeof data.user);
      // --- END DEBUGGING LOGS ---

      if (response.ok) {
        login(data.token, data.user); 
        setMessageModal({ show: true, title: 'Success', message: 'Login successful!' });
        
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
   // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            name="email"
            placeholder="Email"
            value={formData.email} 
            onChange={handleChange}
            required
          />
          </div>
          <div className="form-group">
          <div className="password-input-container"> {/* Container for password input and toggle */}

          <input
            className="login-input"
            type={showPassword ? 'text' : 'password'}
            name="password" 
            placeholder="Password"
            value={formData.password} 
            onChange={handleChange}
            required
          />
          <button
              type="button"
              onClick={togglePasswordVisibility}
              className="password-toggle-btn"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🔓' : '🔒'} {/* icon for show/hide */}
            </button>
          </div>
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
        onConfirm={closeMessageModal} 
      />
    </div>
  );
}
