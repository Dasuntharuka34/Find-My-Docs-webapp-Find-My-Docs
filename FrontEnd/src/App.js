import React, { useContext, useEffect} from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Dashboard from "./components/common-dashboard/Dashboard";
import ExcuseRequestForm from "./components/ExcuseRequestForm";
import SpecialDashboard from "./components/special-user-dashboard/SpecialDashboard";
import PendingApprovals from "./components/approvel-page/PendingApprovals";
import AdminDashboard from "./components/admin-dashboard/AdminDashboard";
import LoginPage from './components/auth/LoginPage'; // Login page
import { AuthContext } from './context/AuthContext'; 

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login'); // Login වී නොමැති නම් login page එකට යොමු කරයි
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null; // Redirecting in useEffect, so return null temporarily
  }

  // Role based access control
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <p>Access Denied! You do not have permission to view this page.</p>; // නැතහත් වෙනත් error page එකකට යොමු කරන්න
  }

  return children;
};

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Dashboard />} />
//         <Route path="/excuse-request" element={<ExcuseRequestForm />} />
//         <Route path="/special-dashboard" element={<SpecialDashboard />} />
//         <Route path="/pending-approvals" element={<PendingApprovals />} />
//         <Route path="/admin-dashboard" element={<AdminDashboard />} />
//       </Routes>
//     </Router>
//   );
// }

function App() {
  const { isLoggedIn, user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isLoggedIn ? <Navigate to={user?.role === 'Admin' ? "/admin-dashboard" : "/dashboard"} /> : <LoginPage />} />
        {/* <Route path="/register" element={<RegisterPage />} /> {/* Register Page එකක් තිබේ නම් */}
        <Route path="/" element={isLoggedIn ? <Navigate to={user?.role === 'Admin' ? "/admin-dashboard" : "/dashboard"} /> : <Navigate to="/login" />} />


        {/* Private Routes (Login වී සිටින අයට පමණයි) */}
        {/* Student Dashboard */}
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC', 'Staff']}>
            <SpecialDashboard />
          </PrivateRoute>
        } />

        {/* Admin Dashboard */}
        <Route path="/admin-dashboard" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </PrivateRoute>
        } />

        {/* Pending Approvals (Lecturer, HOD, Dean, VC) */}
        <Route path="/pending-approvals" element={
          <PrivateRoute allowedRoles={['Lecturer', 'HOD', 'Dean', 'VC', 'Staff']}> {/* Staff is for checking initial submission */}
            <PendingApprovals />
          </PrivateRoute>
        } />

        {/* Excuse Request Form (Student) */}
        <Route path="/excuse-request" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'Staff']}>
            <ExcuseRequestForm />
          </PrivateRoute>
        } />

        {/* My Letters - (Can be part of Dashboard or separate. For now, we'll keep it as a separate page) */}
        {/* මෙම පිටුවට අදාළ component එකක් ඔබ සතුව තිබිය යුතුයි. උදාහරණයක් ලෙස 'MyLettersPage.jsx' */}
        <Route path="/my-letters" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'Staff']}>
            {/* <MyLettersPage /> */} {/* ඔබට මෙම component එක හදන්න වෙනවා */}
            <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>My Letters Page Under Construction</p>
          </PrivateRoute>
        } />

        {/* Notifications (All roles who receive notifications) */}
        {/* මෙය dashboard/special-dashboard/admin-dashboard තුලම පවතී. නමුත් වෙනම page එකක් අවශ්‍ය නම් මෙලෙස එකතු කළ හැක */}
        <Route path="/notifications" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Staff', 'Admin']}>
             {/* <NotificationsPage /> */} {/* ඔබට මෙම component එක හදන්න වෙනවා */}
             <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Notifications Page Under Construction</p>
          </PrivateRoute>
        } />

        {/* Profile (All roles) */}
        {/* ඔබට Profile page එකක් අවශ්‍ය නම් මෙහි add කළ හැක. */}
        <Route path="/profile" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Staff', 'Admin']}>
             {/* <ProfilePage /> */} {/* ඔබට මෙම component එක හදන්න වෙනවා */}
             <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Profile Page Under Construction</p>
          </PrivateRoute>
        } />

        {/* Catch-all route for 404 - Not Found */}
        <Route path="*" element={<p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>404 - Page Not Found</p>} />

      </Routes>
    </Router>
  );
}

export default App;
