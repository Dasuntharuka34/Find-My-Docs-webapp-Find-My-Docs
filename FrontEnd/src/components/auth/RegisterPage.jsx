import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import universityLogo from '../../assets/uni-logo.png'; // Make sure this path is correct
import Footer from '../pages/Footer'; // Make sure this path is correct
import '../../styles/auth/RegisterPage.css'; // You'll need to create or update this CSS file

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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    nic: "", // Added NIC field
    department: "",
    accountType: "Student", // Default role
    password: "",
    confirmPassword: "",
    indexNumber: "" // Added for students
  });

  const [error, setError] = useState("");
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
    // If accountType changes, clear department/indexNumber
    if (e.target.name === "accountType") {
      setFormData(prev => ({
        ...prev,
        department: "",
        indexNumber: ""
      }));
    }
  };

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
    if (messageModal.title === 'Success') {
      navigate('/login'); // Redirect to login page on successful registration submission
    }
  };

  const validatePassword = (password) => {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    return pattern.test(password);
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validateNic = (nic) => {
    // Basic NIC validation: 10 or 12 digits
    const oldNicPattern = /^\d{9}[vVxX]$/;
    const newNicPattern = /^\d{12}$/;
    return oldNicPattern.test(nic) || newNicPattern.test(nic);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!validateNic(formData.nic)) { // NIC validation
      setError("Please enter a valid 9-digit (with V/X) or 12-digit NIC number.");
      return;
    }
    if (!validatePassword(formData.password)) {
      setError(
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol."
      );
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.accountType === "Student" && formData.indexNumber.trim() === "") {
        setError("Student must provide an Index Number.");
        return;
    }
    // Department is now always visible and required for all roles
    if (formData.department.trim() === "") { // Make department required for all
        setError("Please select a department.");
        return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          nic: formData.nic, // Included NIC in the request body
          password: formData.password,
          role: formData.accountType, // Map accountType to role
          department: formData.department, // Department is always sent
          indexNumber: formData.accountType === "Student" ? formData.indexNumber : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageModal({ show: true, title: 'Success', message: data.message || 'Registration request submitted successfully! Please wait for admin approval to log in.' });
        // Optionally reset form
        setFormData({
            fullName: "",
            email: "",
            nic: "", // Reset NIC
            department: "",
            accountType: "Student",
            password: "",
            confirmPassword: "",
            indexNumber: ""
        });
      } else {
        setMessageModal({ show: true, title: 'Registration Failed', message: data.message || 'Something went wrong during registration.' });
      }
    } catch (apiError) {
      console.error("API Error during registration:", apiError);
      setMessageModal({ show: true, title: 'Error', message: 'Network error or server unavailable. Please try again later.' });
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-title">University Of Jaffna</div>
        <div className="flex justify-center mb-4">
          <img
            src={universityLogo}
            alt="University of Jaffna Logo"
            className="registration-logo"
          />
        </div>
        <h2 className="registration-subtitle">Register</h2>

        <form onSubmit={handleSubmit}>
          <label className="block font-semibold" htmlFor="fullName">
            Full Name
          </label>
          <input
            className="registration-input"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <label className="block font-semibold" htmlFor="email">
            Email
          </label>
          <input
            className="registration-input"
            type="email"
            name="email"
            placeholder="e.g., example@university.edu"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label className="block font-semibold" htmlFor="nic"> {/* NIC Input Field */}
            NIC Number
          </label>
          <input
            className="registration-input"
            type="text"
            name="nic"
            placeholder="e.g., 901234567V or 200012345678"
            value={formData.nic}
            onChange={handleChange}
            required
          />

          <label className="block font-semibold" htmlFor="accountType">
            Account Type (Role)
          </label>
          <select
            className="registration-select"
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            required
          >
            <option value="Student">Student</option>
            <option value="Staff">Staff</option>
            <option value="Lecturer">Lecturer</option>
            <option value="HOD">HOD</option>
            <option value="Dean">Dean</option>
            <option value="VC">VC</option>
          </select>

          {formData.accountType === "Student" && (
            <>
              <label className="block font-semibold" htmlFor="indexNumber">
                Index Number
              </label>
              <input
                className="registration-input"
                name="indexNumber"
                placeholder="e.g., 2021/CSC/001"
                value={formData.indexNumber}
                onChange={handleChange}
                required={formData.accountType === "Student"}
              />
            </>
          )}

          {/* Department field is now always visible */}
          <>
            <label className="block font-semibold" htmlFor="department">
              Department
            </label>
            <select
              className="registration-select"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required // Department is now required for ALL roles, including students
            >
              <option value="">-- Select Department --</option>
              {/* Department options */}
              <option value="Computer Science">Computer Science</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Botany">Botany</option>
              <option value="Fisheries">Fisheries</option>
              <option value="Mathematics and Statistics">Mathematics and Statistics</option>
              <option value="Zoology">Zoology</option>
            </select>
          </>

          <label className="block font-semibold" htmlFor="password">
            Password
          </label>
          <input
            className="registration-input"
            type="password"
            name="password"
            placeholder="Min 8 chars, incl. A-Z, a-z, 0-9, symbol"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label className="block font-semibold" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            className="registration-input"
            type="password"
            name="confirmPassword"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && <p className="registration-error">{error}</p>}

          <button type="submit" className="registration-button">
            Sign Up
          </button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
        <div className="footer-wrapper">
          <Footer />
        </div>
      </div>
      
      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={closeMessageModal}
      />
    </div>
  );
}
