import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Link සහ useNavigate import කරන්න
import '../../styles/common-dashboard/Sidebar.css';
import { AuthContext } from '../../context/AuthContext'; // AuthContext import කරන්න

function Sidebar() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate(); // useNavigate hook එක ගන්නවා

  // user.role මත පදනම්ව Dashboard path එක තීරණය කරන්න
  const getDashboardPath = () => {
    if (user && user.role === 'Admin') {
      return '/admin-dashboard';
    } else {
      return '/dashboard'; // Student හෝ වෙනත් default user සඳහා
    }
  };

  const handleNewLetterClick = () => {
    // New Letter Request modal එක Dashboard/SpecialDashboard තුළම handle කරන නිසා,
    // මෙතනින් කෙලින්ම page එකට navigate කරමු.
    // ඔබට මෙය වෙනම page එකක් ලෙස handle කිරීමට අවශ්‍ය නම්, වෙනස් කරන්න.
    if (user && user.role === 'Student') {
      // ඔබට Dashboard component එකේ `setModalOpen(true)` call කිරීමට ක්‍රමයක් අවශ්‍ය වේ
      // දැනට, අපි සරලව Dashboard එකට Navigate කරමු, එහිදී modal button එක ක්ලික් කළ හැක
      navigate('/dashboard'); 
      // ඔබට programmatic ලෙස modal එක open කිරීමට අවශ්‍ය නම්,
      // Shared state management (Redux/Zustand) හෝ Context API භාවිතා කළ හැකියි.
    } else {
      // අනෙකුත් users ට new letter request කිරීමට අවසර නැතැයි උපකල්පනය කරමු
      navigate(getDashboardPath());
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
        <li className="sidebar-item" onClick={handleNewLetterClick}> {/* New letter can be a modal on dashboard */}
          <span className="sidebar-link">New Letter Request</span>
        </li>
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
