import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/common-dashboard/Dashboard';
import AdminDashboard from './components/admin-dashboard/AdminDashboard';
import SpecialDashboard from './components/special-user-dashboard/SpecialDashboard';
import ExcuseRequestForm from './components/ExcuseRequestForm';
import PendingApprovals from './components/approvel-page/PendingApprovals';
import LoginPage from './components/auth/LoginPage';
import DocumentsView from './components/common-dashboard/DocumentsView'; // <-- DocumentsView import කරන්න
import MyLettersPage from './components/common-dashboard/MyLettersPage'; 
// import RegisterPage from './components/auth/RegisterPage';
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
        {/* <Route path="/register" element={<RegisterPage />} /> */}
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

        {/* Pending Approvals (Lecturer, HOD, Dean, VC, Staff) */}
        <Route path="/pending-approvals" element={
          <PrivateRoute allowedRoles={['Lecturer', 'HOD', 'Dean', 'VC', 'Staff']}>
            <PendingApprovals />
          </PrivateRoute>
        } />

        {/* Excuse Request Form (Student) */}
        <Route path="/excuse-request" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC', 'Staff']}>
            <ExcuseRequestForm />
          </PrivateRoute>
        } />



        {/* My Letters - (This is where students can view their submitted letters) */}
        {/* This path will render a list of letters, each clickable to DocumentsView */}
        <Route path="/my-letters" element={
          <PrivateRoute allowedRoles={['Student','Lecturer', 'HOD', 'Dean', 'VC', 'Staff']}>
            {/* You'll need a component here that lists letters and provides links to DocumentsView */}
            {/* <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>My Letters List Page Under Construction</p> */}
            {/* For demonstration, you might temporarily navigate directly to a document: */}
            {/* <DocumentsView /> */}
          </PrivateRoute>
        } />

        {/* Document View (for a specific letter by ID) */}
        <Route path="/documents/:id" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Staff', 'Admin']}>
            <DocumentsView />
          </PrivateRoute>
        } />

        {/* Notifications */}
        <Route path="/notifications" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Staff', 'Admin']}>
             <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Notifications Page Under Construction</p>
          </PrivateRoute>
        } />

        {/* Profile */}
        <Route path="/profile" element={
          <PrivateRoute allowedRoles={['Student', 'Lecturer', 'HOD', 'Dean', 'VC', 'Staff', 'Admin']}>
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
