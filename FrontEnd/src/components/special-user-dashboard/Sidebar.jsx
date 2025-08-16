import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Link සහ useNavigate import කරන්න
import '../../styles/common-dashboard/Sidebar.css';
import { AuthContext } from '../../context/AuthContext'; // AuthContext import කරන්න

function Sidebar() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (user && user.role === 'Admin') {
      return '/admin-dashboard';
    } else {
      return '/dashboard'; // Student හෝ වෙනත් default user සඳහා
    }
  };

  const handleNewLetterClick = () => {
    if (user && user.role === 'Student') {
      navigate('/dashboard'); // Student dashboard එකට navigate කරමු
    } else {
      navigate(getDashboardPath()); // වෙනත් users සඳහා default dashboard
    }
  };

  return (
    <nav className="sidebar">
      <ul>
        <li className="sidebar-item">
          <Link to={getDashboardPath()} className="sidebar-link">Dashboard</Link>
        </li>
        <li className="sidebar-item">
          <Link to="/my-letters" className="sidebar-link">My Letters</Link>
        </li>
        <li className="sidebar-item" onClick={handleNewLetterClick}>
          <span className="sidebar-link">New Letter Request</span>
        </li>
        {/* Pending Approvals link එක role මත පදනම්ව පෙන්විය හැක */}
        {user && (user.role === 'Lecturer' || user.role === 'HOD' || user.role === 'Dean' || user.role === 'VC' || user.role === 'Staff') && (
          <li className="sidebar-item">
            <Link to="/pending-approvals" className="sidebar-link">Pending Approvals</Link>
          </li>
        )}
        <li className="sidebar-item">
          <Link to="/notifications" className="sidebar-link">Notifications</Link>
        </li>
        <li className="sidebar-item">
          <Link to="/profile" className="sidebar-link">Profile</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;
