import React, { useState, useContext, useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/common-dashboard/ProfilePage.css';

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
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null); // State for the uploaded file
  const [profilePicturePreview, setProfilePicturePreview] = useState(null); // State for image preview URL (for immediate display)
  const fileInputRef = useRef(null); // Ref for file input

  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });
  const [error, setError] = useState('');

  // Default profile picture URL (fallback)
  const defaultProfilePic = 'https://placehold.co/100x100/aabbcc/ffffff?text=User'; 

  // Function to construct the full image URL with a cache-buster
  const getFullImageUrl = (relativePath) => {
    if (!relativePath) {
      return defaultProfilePic;
    }
    // Prepend the backend base URL to the relative path
    // Add a timestamp query parameter to force browser to reload the image and prevent caching
    return `http://localhost:5000${relativePath}?t=${new Date().getTime()}`;
  };

  // Effect to initialize form data and profile picture when user loads or user data changes
  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.name || '',
        email: user.email || '',
        nic: user.nic || '',
        department: user.department || '',
        indexNumber: user.indexNumber || '',
        role: user.role || '',
      });
      // Set initial profile picture preview from user data, including a cache-buster
      setProfilePicturePreview(getFullImageUrl(user.profilePicture));
    }
  }, [user]); // Rerun when the user object in context changes

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
    setError(''); // Clear error when modal closes
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // When entering edit mode, ensure preview reflects current user's profile pic from context
    setProfilePicturePreview(getFullImageUrl(user.profilePicture));
    setProfilePictureFile(null); // Clear any previously selected file when entering edit mode
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(''); // Clear error on cancel
    // Reset form data to original user data from context
    if (user) {
      setEditFormData({
        name: user.name || '',
        email: user.email || '',
        nic: user.nic || '',
        department: user.department || '',
        indexNumber: user.indexNumber || '',
        role: user.role || '',
      });
      // Reset profile picture preview to original user's picture from context
      setProfilePicturePreview(getFullImageUrl(user.profilePicture));
      setProfilePictureFile(null); // Clear selected file
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

  const handleSave = async (e) => {
    e.preventDefault();

    // Frontend validation before sending to backend
    if (!editFormData.name.trim()) {
      setError("Full Name cannot be empty.");
      return;
    }
    if (!validateEmail(editFormData.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!validateNic(editFormData.nic)) {
        setError("Please enter a valid 9-digit (with V/X) or 12-digit NIC number.");
        return;
    }
    if (editFormData.role === "Student" && !editFormData.indexNumber.trim()) {
        setError("Student must provide an Index Number.");
        return;
    }
    if (editFormData.department.trim() === "") { // Department is required for all
        setError("Please select a department.");
        return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', editFormData.name);
      formDataToSend.append('email', editFormData.email);
      formDataToSend.append('nic', editFormData.nic);
      formDataToSend.append('department', editFormData.department);
      formDataToSend.append('role', editFormData.role); 
      if (editFormData.role === 'Student') { 
        formDataToSend.append('indexNumber', editFormData.indexNumber);
      }
      
      if (profilePictureFile) {
        formDataToSend.append('profilePicture', profilePictureFile);
      }


      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}` 
        },
        body: formDataToSend,
      });

      const data = await response.json();

      console.log('Backend response after profile update:', data);

      if (response.ok) {
        // Update user data in AuthContext.
        updateUserInContext(data); 
        
        // Explicitly update the preview with the new path from the updated user object in context,
        // and add a new timestamp to force browser refresh.
        setProfilePicturePreview(getFullImageUrl(data.profilePicture));

        setMessageModal({ show: true, title: 'Success', message: 'Profile updated successfully!', onConfirm: closeMessageModal });
        setIsEditing(false); // Exit editing mode
        setProfilePictureFile(null); // Clear selected file after successful upload
      } else {
        setError(data.message || 'Failed to update profile.');
        setMessageModal({ show: true, title: 'Error', message: data.message || 'Failed to update profile.', onConfirm: closeMessageModal });
      }
    } catch (apiError) {
      console.error('Profile update error:', apiError);
      setError('Network error or server unavailable.');
      setMessageModal({ show: true, title: 'Error', message: 'Network error or server unavailable. Please try again later.', onConfirm: closeMessageModal });
    }
  };

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
            <h2>User Profile</h2>
            {/* Profile Picture Display (always visible) */}
            <div className="profile-picture-container">
                <img
                    // Use the profilePicturePreview state directly, which now contains the full URL with cache-buster
                    src={profilePicturePreview} 
                    alt="Profile"
                    className="profile-picture"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultProfilePic; }} // Fallback if image fails to load
                />
                {isEditing && (
                    <button type="button" className="change-photo-btn" onClick={() => fileInputRef.current.click()}>
                        Change Photo
                    </button>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureChange}
                    style={{ display: 'none' }} // Hide the default file input
                    accept="image/*" // Only allow image files
                />
            </div>

            {!isEditing ? (
              <>
                <div className="profile-info-group">
                  <strong>Name:</strong>
                  <span>{user.name}</span>
                </div>
                <div className="profile-info-group">
                  <strong>Email:</strong>
                  <span>{user.email}</span>
                </div>
                <div className="profile-info-group">
                  <strong>NIC:</strong>
                  <span>{user.nic || 'N/A'}</span>
                </div>
                <div className="profile-info-group">
                  <strong>Role:</strong>
                  <span>{user.role}</span>
                </div>
                <div className="profile-info-group">
                  <strong>Department:</strong>
                  <span>{user.department || 'N/A'}</span>
                </div>
                {user.role === 'Student' && (
                  <div className="profile-info-group">
                    <strong>Index Number:</strong>
                    <span>{user.indexNumber || 'N/A'}</span>
                  </div>
                )}
                <button onClick={handleEditClick} className="edit-profile-btn">
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label htmlFor="name">Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nic">NIC Number:</label>
                  <input
                    type="text"
                    id="nic"
                    name="nic"
                    value={editFormData.nic}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role:</label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={editFormData.role}
                    disabled // Role is not editable by user
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department:</label>
                  <select
                    id="department"
                    name="department"
                    value={editFormData.department}
                    onChange={handleEditFormChange}
                    required
                  >
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
                    <input
                      type="text"
                      id="indexNumber"
                      name="indexNumber"
                      value={editFormData.indexNumber}
                      onChange={handleEditFormChange}
                      required
                    />
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
