import React, { useContext } from 'react';
import Header from './Header'; // Make sure path is correct
import Footer from './Footer'; // Make sure path is correct
import Sidebar from './Sidebar'; // Make sure path is correct
import { AuthContext } from '../../context/AuthContext'; // AuthContext to get user data
import '../../styles/common-dashboard/ProfilePage.css'; // New CSS file for styling

const ProfilePage = () => {
  const { user } = useContext(AuthContext); // Get the authenticated user from AuthContext

  // If user data is still loading or not available
  if (!user) {
    return (
      <div className="profile-container">
        <Header user={null} /> {/* Pass null or a loading state for user */}
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
      <Header user={user} /> {/* Pass the user object to the Header */}
      <div className="profile-layout">
        <Sidebar /> {/* Include Sidebar for navigation */}
        <main className="profile-content">
          <div className="profile-card">
            <h2>User Profile</h2>
            <div className="profile-info-group">
              <strong>Name:</strong>
              <span>{user.name}</span>
            </div>
            <div className="profile-info-group">
              <strong>Email:</strong>
              <span>{user.email}</span>
            </div>
            <div className="profile-info-group">
              <strong>Role:</strong>
              <span>{user.role}</span>
            </div>
            {/* Conditionally display department or index number based on role */}
            {user.role === 'Student' ? (
              <div className="profile-info-group">
                <strong>Index Number:</strong>
                <span>{user.indexNumber || 'N/A'}</span>
              </div>
            ) : (
              <div className="profile-info-group">
                <strong>Department:</strong>
                <span>{user.department || 'N/A'}</span>
              </div>
            )}
            {/* You can add more profile fields here if available in your user object */}
            {/* For example, for a real application, you might add an "Edit Profile" button here */}
            {/* <button className="edit-profile-btn">Edit Profile</button> */}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
