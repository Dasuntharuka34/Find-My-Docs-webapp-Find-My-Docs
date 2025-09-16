import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';


export default function AllRequestsPage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="admin-dashboard">
      <section className="admin-section">
        <h3>All Requests</h3>
        <p>This page will display all requests.</p>
      </section>
    </div>
  );

}
