import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';


export default function ApprovedRequestsPage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="admin-dashboard">
      <section className="admin-section">
        <h3>Approved Requests</h3>
        <p>This page will display all approved requests.</p>
      </section>
    </div>
  );
}
