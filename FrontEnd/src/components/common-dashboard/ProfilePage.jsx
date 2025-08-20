import React, { useContext } from 'react';
import Header from './Header'; 
import Footer from './Footer'; 
import Sidebar from './Sidebar'; // Ensure this imports the correct Sidebar component
import { AuthContext } from '../../context/AuthContext';
import '../../styles/common-dashboard/ProfilePage.css'; 

const ProfilePage = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="profile-container">
        <Header user={null} />
        <div className="profile-layout">
          <Sidebar /> {/* Sidebar will be empty if no user */}
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
        <Sidebar /> {/* Use the shared Sidebar component */}
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
              <strong>NIC:</strong> {/* Display NIC */}
              <span>{user.nic || 'N/A'}</span>
            </div>
            <div className="profile-info-group">
              <strong>Role:</strong>
              <span>{user.role}</span>
            </div>
            <div className="profile-info-group"> {/* Department is always shown now */}
              <strong>Department:</strong>
              <span>{user.department || 'N/A'}</span>
            </div>
            {user.role === 'Student' && (
              <div className="profile-info-group">
                <strong>Index Number:</strong>
                <span>{user.indexNumber || 'N/A'}</span>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
