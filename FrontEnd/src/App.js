import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/common-dashboard/Dashboard';
import AdminDashboard from './components/admin-dashboard/AdminDashboard';
// import SpecialDashboard from './components/special-user-dashboard/SpecialDashboard';
import ExcuseRequestForm from './components/forms/ExcuseRequestForm';
import PendingApprovals from './components/approvel-page/PendingApprovals';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import DocumentsView from './components/common-dashboard/DocumentsView';
import MyLettersPage from './components/common-dashboard/MyLettersPage';
import ProfilePage from './components/common-dashboard/ProfilePage'; // <-- ProfilePage import කරන්න
import { AuthContext } from './context/AuthContext';

// PrivateRoute component
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Access Denied! You do not have permission to view this page.</p>;
  }

  return children;
};

function App() {
  const { isLoggedIn, user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isLoggedIn ? <Navigate to={user?.role === 'Admin' ? "/admin-dashboard" : "/dashboard"} /> : <LoginPage />} />
        
        <Route path="/register" element={isLoggedIn ? <Navigate to={user?.role === 'Admin' ? "/admin-dashboard" : "/dashboard"} /> : <RegisterPage />} />
        
        <Route path="/" element={isLoggedIn ? <Navigate to={user?.role === 'Admin' ? "/admin-dashboard" : "/dashboard"} /> : <Navigate to="/login" />} />


        {/* Private Routes (Login වී සිටින අයට පමණයි) */}
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC']}>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/admin-dashboard" element={
          <PrivateRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </PrivateRoute>
        } />

        <Route path="/pending-approvals" element={
          <PrivateRoute allowedRoles={['Lecturer', 'HOD', 'Dean', 'VC']}>
            <PendingApprovals />
          </PrivateRoute>
        } />

        <Route path="/excuse-request" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC']}>
            <ExcuseRequestForm />
          </PrivateRoute>
        } />

        <Route path="/my-letters" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC']}>
            <MyLettersPage />
          </PrivateRoute>
        } />

        <Route path="/documents/:id" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            <DocumentsView />
          </PrivateRoute>
        } />

        <Route path="/notifications" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
             <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Notifications Page Under Construction</p>
          </PrivateRoute>
        } />

        {/* Profile Page */}
        <Route path="/profile" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin']}>
            <ProfilePage />
          </PrivateRoute>
        } />

        {/* Catch-all route for 404 - Not Found */}
        <Route path="*" element={<p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>404 - Page Not Found</p>} />

      </Routes>
    </Router>
  );
}

export default App;
