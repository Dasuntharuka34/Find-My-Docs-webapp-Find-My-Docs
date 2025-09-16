import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);

  // The main layout component will handle the header, footer, and sidebar.
  // This component now only needs to render the overview content.

  // Access control is handled by PrivateRoute in App.js, but an extra check is good practice.
  if (!user || user.role !== 'Admin') {
    return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>
      Access Denied! You do not have administrator privileges.
    </p>;
  }

  return (
    <div className="admin-dashboard-overview">
      <h2>Welcome, {user?.name || 'Admin'}!</h2>
    </div>
  );
}
