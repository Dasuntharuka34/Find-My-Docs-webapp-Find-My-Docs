import React, { useState, useContext, useEffect, useRef } from 'react';

import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/ProfilePage.css';

// ----------------- Modal -----------------
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

// ----------------- ProfilePage -----------------
const ProfilePage = () => {
  const { user, token, updateUser: updateUserInContext } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    nic: '',
    department: '',
    indexNumber: '',
    role: '',
    mobile: '',            // ✅ Added for Mobile
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });
  const [error, setError] = useState('');

  const defaultProfilePic = 'https://placehold.co/100x100/aabbcc/ffffff?text=User';

  const getFullImageUrl = (relativePath) => {
    if (!relativePath) return defaultProfilePic;
    return `${process.env.REACT_APP_BACKEND_URL}${relativePath}?t=${new Date().getTime()}`;
  };

  // Initialize user data
  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.name || '',
        email: user.email || '',
        nic: user.nic || '',
        department: user.department || '',
        indexNumber: user.indexNumber || '',
        role: user.role || '',
        mobile: user.mobile || '',      // ✅ Initialize mobile
      });
      setProfilePicturePreview(getFullImageUrl(user.profilePicture));
    }
  }, [user]);

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
    setError('');
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setProfilePicturePreview(getFullImageUrl(user.profilePicture));
    setProfilePictureFile(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
    if (user) {
      setEditFormData({
        name: user.name || '',
        email: user.email || '',
        nic: user.nic || '',
        department: user.department || '',
        indexNumber: user.indexNumber || '',
        role: user.role || '',
        mobile: user.mobile || '',      // ✅ Reset mobile
      });
      setProfilePicturePreview(getFullImageUrl(user.profilePicture));
      setProfilePictureFile(null);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
    setError(''); // Clear error on input change
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file)); // Create a temporary URL for immediate preview
      setError(''); // Clear errors
    } else {
      setProfilePictureFile(null);
      // If no file selected, revert preview to current user's picture (if any) or default
      setProfilePicturePreview(getFullImageUrl(user.profilePicture)); 
    }
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validateNic = (nic) => {
    const oldNicPattern = /^\d{9}[vVxX]$/;
    const newNicPattern = /^\d{12}$/;
    return oldNicPattern.test(nic) || newNicPattern.test(nic);
  };

  const validateMobile = (mobile) => {
    const mobilePattern = /^\d{10}$/;   // ✅ 10 digit number
    return mobilePattern.test(mobile);
  };

  // -------------- Save ----------------
  const handleSave = async (e) => {
    e.preventDefault();

    if (!editFormData.name.trim()) return setError("Full Name cannot be empty.");
    if (!validateEmail(editFormData.email)) return setError("Please enter a valid email address.");
    if (!validateNic(editFormData.nic)) return setError("Please enter a valid NIC.");
    if (!validateMobile(editFormData.mobile)) return setError("Please enter a valid 10-digit mobile number."); // ✅ Validate mobile
    if (editFormData.role === "Student" && !editFormData.indexNumber.trim())
      return setError("Student must provide an Index Number.");
    if (editFormData.department.trim() === "")
      return setError("Please select a department.");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', editFormData.name);
      formDataToSend.append('email', editFormData.email);
      formDataToSend.append('nic', editFormData.nic);
      formDataToSend.append('department', editFormData.department);
      formDataToSend.append('role', editFormData.role);
      formDataToSend.append('mobile', editFormData.mobile);  // ✅ Send mobile
      if (editFormData.role === 'Student') {
        formDataToSend.append('indexNumber', editFormData.indexNumber);
      }
      if (profilePictureFile) {
        formDataToSend.append('profilePicture', profilePictureFile);
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend,
      });

      const data = await response.json();
      if (response.ok) {
        updateUserInContext(data);
        setProfilePicturePreview(getFullImageUrl(data.profilePicture));
        setMessageModal({ show: true, title: 'Success', message: 'Profile updated successfully!', onConfirm: closeMessageModal });
        setIsEditing(false);
        setProfilePictureFile(null);
      } else {
        setError(data.message || 'Failed to update profile.');
        setMessageModal({ show: true, title: 'Error', message: data.message || 'Failed to update profile.', onConfirm: closeMessageModal });
      }
    } catch (apiError) {
      console.error('Profile update error:', apiError);
      setError('Network error or server unavailable.');
      setMessageModal({ show: true, title: 'Error', message: 'Network error or server unavailable.', onConfirm: closeMessageModal });
    }
  };

  // ----------------- UI -----------------
  if (!user) {
    return (
      <div className="profile-container">
        <Header user={null} />
        <div className="profile-layout">
          <Sidebar />
          <main className="profile-content">
            <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading user profile...</p>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Header user={user} />
      <div className="profile-layout">
        <Sidebar />
        <main className="profile-content">
          <div className="profile-card">
            <h2>{user.name}</h2>
            {/* Profile Picture */}
            <div className="profile-picture-container">
              <img src={profilePicturePreview} alt="Profile" className="profile-picture"
                onError={(e) => { e.target.onerror = null; e.target.src = defaultProfilePic; }} />
              {isEditing && (
                <button type="button" className="change-photo-btn" onClick={() => fileInputRef.current.click()}>
                  Change Photo
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleProfilePictureChange}
                style={{ display: 'none' }} accept="image/*" />
            </div>

            {!isEditing ? (
              <>
                <div className="profile-info-group"><strong>Name:</strong><span>{user.name}</span></div>
                <div className="profile-info-group"><strong>Email:</strong><span>{user.email}</span></div>
                <div className="profile-info-group"><strong>NIC:</strong><span>{user.nic || 'N/A'}</span></div>
                <div className="profile-info-group"><strong>Mobile:</strong><span>{user.mobile || 'N/A'}</span></div> {/* ✅ Show mobile */}
                <div className="profile-info-group"><strong>Role:</strong><span>{user.role}</span></div>
                <div className="profile-info-group"><strong>Department:</strong><span>{user.department || 'N/A'}</span></div>
                {user.role === 'Student' && (
                  <div className="profile-info-group"><strong>Index Number:</strong><span>{user.indexNumber || 'N/A'}</span></div>
                )}
                <button onClick={handleEditClick} className="edit-profile-btn">Edit Profile</button>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label htmlFor="name">Name:</label>
                  <input type="text" id="name" name="name" value={editFormData.name} onChange={handleEditFormChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input type="email" id="email" name="email" value={editFormData.email} onChange={handleEditFormChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="nic">NIC Number:</label>
                  <input type="text" id="nic" name="nic" value={editFormData.nic} onChange={handleEditFormChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number:</label>  {/* ✅ Mobile field */}
                  <input type="text" id="mobile" name="mobile" value={editFormData.mobile} onChange={handleEditFormChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role:</label>
                  <input type="text" id="role" name="role" value={editFormData.role} disabled />
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department:</label>
                  <select id="department" name="department" value={editFormData.department} onChange={handleEditFormChange} required>
                    <option value="">-- Select Department --</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Botany">Botany</option>
                    <option value="Fisheries">Fisheries</option>
                    <option value="Mathematics and Statistics">Mathematics and Statistics</option>
                    <option value="Zoology">Zoology</option>
                    <option value="General Administration">General Administration</option>
                  </select>
                </div>
                {editFormData.role === 'Student' && (
                  <div className="form-group">
                    <label htmlFor="indexNumber">Index Number:</label>
                    <input type="text" id="indexNumber" name="indexNumber"
                      value={editFormData.indexNumber} onChange={handleEditFormChange} required />
                  </div>
                )}
                {error && <p className="profile-error">{error}</p>}
                <div className="profile-actions">
                  <button type="submit" className="save-profile-btn">Save Changes</button>
                  <button type="button" onClick={handleCancelEdit} className="cancel-profile-btn">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
      <Footer />
      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={closeMessageModal}
      />
    </div>
  );
};

export default ProfilePage;
