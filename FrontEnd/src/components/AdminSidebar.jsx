import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/components/AdminSidebar.css';

function AdminSidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="admin-sidebar">
      <ul>
        <li className={`admin-sidebar-item ${isActive('/admin-dashboard') ? 'active' : ''}`}>
          <Link to="/admin-dashboard" className="admin-sidebar-link">Dashboard</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/registration-approvals') ? 'active' : ''}`}>
          <Link to="/admin/registration-approvals" className="admin-sidebar-link">Registration Approvals</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/user-management') ? 'active' : ''}`}>
          <Link to="/admin/user-management" className="admin-sidebar-link">User Management</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/all-requests') ? 'active' : ''}`}>
          <Link to="/admin/all-requests" className="admin-sidebar-link">All Requests</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/admin/approved-requests') ? 'active' : ''}`}>
          <Link to="/admin/approved-requests" className="admin-sidebar-link">Approved Requests</Link>
        </li>
        <li className={`admin-sidebar-item ${isActive('/profile') ? 'active' : ''}`}>
          <Link to="/profile" className="admin-sidebar-link">Profile</Link>
        </li>
      </ul>
    </nav>
  );
}

export default AdminSidebar;
