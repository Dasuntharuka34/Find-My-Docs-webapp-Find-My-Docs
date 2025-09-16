import React from 'react';
import Header from '../components/Header';
import AdminSidebar from '../components/AdminSidebar';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import '../styles/layouts/AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { user } = React.useContext(AuthContext);

  return (
    <div className="admin-page-container">
      <Header user={user} />
      <div className="admin-content-wrapper">
        <AdminSidebar />
        <main className="admin-main-content">{children}</main>
      </div>
      <Footer />
    </div>
  );
};


export default AdminLayout;
