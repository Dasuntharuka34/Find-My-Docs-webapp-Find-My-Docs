import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/auth/RegisterPage.css';
import { AuthContext } from '../../context/AuthContext';

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

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Student', // Default role
    department: '',
    indexNumber: '' // Only for students
  });
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });
  const navigate = useNavigate();
  // const { login } = useContext(AuthContext); // Not needed for auto-login now

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
    if (messageModal.title === 'Success') {
      navigate('/login'); // Redirect to login page on successful registration submission
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setMessageModal({ show: true, title: 'Error', message: 'Please fill in all required fields.' });
      return;
    }
    if (formData.role === 'Student' && !formData.indexNumber) {
      setMessageModal({ show: true, title: 'Error', message: 'Students must provide an index number.' });
      return;
    }
    if (formData.role !== 'Student' && !formData.department) {
      setMessageModal({ show: true, title: 'Error', message: 'Staff/Faculty must provide a department.' });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/register', { // Calls the modified register endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageModal({ show: true, title: 'Success', message: data.message || 'Registration request submitted successfully! Please wait for admin approval to log in.' }); // Updated message
        // No auto-login here
      } else {
        setMessageModal({ show: true, title: 'Registration Failed', message: data.message || 'Something went wrong during registration.' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessageModal({ show: true, title: 'Error', message: 'Network error or server unavailable.' });
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role:</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} required>
            <option value="Student">Student</option>
            <option value="Staff">Staff</option>
            <option value="Lecturer">Lecturer</option>
            <option value="HOD">HOD</option>
            <option value="Dean">Dean</option>
            <option value="VC">VC</option>
          </select>
        </div>

        {formData.role === 'Student' && (
          <div className="form-group">
            <label htmlFor="indexNumber">Index Number:</label>
            <input type="text" id="indexNumber" name="indexNumber" value={formData.indexNumber} onChange={handleChange} />
          </div>
        )}

        {formData.role !== 'Student' && (
          <div className="form-group">
            <label htmlFor="department">Department:</label>
            <input type="text" id="department" name="department" value={formData.department} onChange={handleChange} />
          </div>
        )}

        <button type="submit" className="register-button">Register</button>
        <p className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={closeMessageModal}
      />
    </div>
  );
};

export default RegisterPage;
