import React, { useState, useEffect, useContext } from 'react';
import Header from '../common-dashboard/Header';
import Footer from '../common-dashboard/Footer';
import '../../styles/admin-dashboard/AdminDashboard.css';
import { AuthContext } from '../../context/AuthContext';

// Custom Message Modal Component
const MessageModal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-buttons">
          {onConfirm && (
            <button onClick={onConfirm}>
              Yes
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel}>
              No
            </button>
          )}
          {(!onConfirm && !onCancel) && (
            <button onClick={() => { /* Close logic handled by parent */ }}>
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


export default function AdminDashboard() {
  const { user } = useContext(AuthContext); // Get authenticated user from AuthContext

  const [pendingRegistrations, setPendingRegistrations] = useState([]); // New state for pending registrations
  const [approvedUsers, setApprovedUsers] = useState([]); // Existing state for approved users

  // States for confirmation modals and messages
  const [viewingRegistration, setViewingRegistration] = useState(null); // For viewing full details
  const [confirmationRequest, setConfirmationRequest] = useState(null); // For approve/reject confirmation
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  // --- Fetching Data ---
  const fetchPendingRegistrations = async () => {
    try {
      // Backend API to get pending registrations
      const response = await fetch('http://localhost:5000/api/users/registrations/pending');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPendingRegistrations(data);
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load pending registrations: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  const fetchApprovedUsers = async () => { // Renamed from fetchUsers for clarity
    try {
      // Backend API to get all approved users
      const response = await fetch('http://localhost:5000/api/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setApprovedUsers(data);
    } catch (error) {
      console.error("Error fetching approved users:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load approved users: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  useEffect(() => {
    // Fetch both pending registrations and approved users on component mount
    fetchPendingRegistrations();
    fetchApprovedUsers();
  }, []); // Empty dependency array means this runs once on mount

  // --- Handling Registration Actions (Approve/Reject) ---
  const handleRegistrationAction = async (registrationId, action, reason = '') => {
    try {
      let response;
      if (action === 'approve') {
        response = await fetch(`http://localhost:5000/api/users/registrations/${registrationId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (action === 'reject') {
        if (reason.trim() === '') {
          setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
          return;
        }
        response = await fetch(`http://localhost:5000/api/users/registrations/${registrationId}/reject`, {
          method: 'DELETE',
        });
      } else {
        return; // Should not happen
      }

      const data = await response.json();

      if (response.ok) {
        setMessageModal({ show: true, title: 'Success', message: data.message, onConfirm: closeMessageModal });
        // Refresh both lists after action
        fetchPendingRegistrations();
        fetchApprovedUsers();
      } else {
        setMessageModal({ show: true, title: 'Error', message: data.message || `Failed to ${action} registration.` });
      }

      // Clear confirmation modal state
      setConfirmationRequest(null);
      setConfirmAction(null);
      setRejectionReason('');

    } catch (error) {
      console.error(`Error handling registration ${action}:`, error);
      setMessageModal({ show: true, title: 'Error', message: `Network error during ${action} registration.`, onConfirm: closeMessageModal });
    }
  };

  // --- Handling Approved User Management (Edit/Delete) ---
  const handleEditUser = async (userToEdit) => {
    const newName = prompt(`Edit name for ${userToEdit.name}:`, userToEdit.name);
    if (newName !== null && newName.trim() !== '') {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userToEdit._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim() }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update user! status: ${response.status}`);
        }
        fetchApprovedUsers(); // Refresh approved users list
        setMessageModal({ show: true, title: 'Success', message: `User ${userToEdit.name} updated to ${newName}.`, onConfirm: closeMessageModal });
      } catch (error) {
        console.error("Error editing user:", error);
        setMessageModal({ show: true, title: 'Error', message: `Failed to edit user: ${error.message}`, onConfirm: closeMessageModal });
      }
    }
  };

  const handleDeleteUser = async (userIdToDelete, userName) => {
    setMessageModal({
      show: true,
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete user ${userName}?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/users/${userIdToDelete}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to delete user! status: ${response.status}`);
          }
          fetchApprovedUsers(); // Refresh approved users list
          setMessageModal({ show: true, title: 'Success', message: `User ${userName} deleted successfully.`, onConfirm: closeMessageModal });
        } catch (error) {
          console.error("Error deleting user:", error);
          setMessageModal({ show: true, title: 'Error', message: `Failed to delete user: ${error.message}`, onConfirm: closeMessageModal });
        } finally {
          closeMessageModal();
        }
      },
      onCancel: closeMessageModal
    });
  };

  // --- Modal Control Functions ---
  const openViewingModal = (reg) => {
    setViewingRegistration(reg);
  };

  const openConfirmationModal = (req, action) => {
    setConfirmationRequest(req);
    setConfirmAction(action);
    setViewingRegistration(null); // Close viewing modal if open
  };

  // --- Access Control for Admin Dashboard ---
  if (!user || user.role !== 'Admin') {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Access Denied! You do not have administrator privileges.</p>;
  }

  return (
    <div className="admin-dashboard">
      <Header user={user} /> {/* Pass authenticated user */}
      <h2>Admin Dashboard</h2>

      <section className="admin-section">
        <h3>📥 Pending Registrations ({pendingRegistrations.length})</h3>
        {pendingRegistrations.length === 0 ? (
          <p>No new registration requests pending approval.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Submitted At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRegistrations.map(reg => (
                <tr key={reg._id}>
                  <td>{reg.name}</td>
                  <td>{reg.email}</td>
                  <td>{reg.role}</td>
                  <td>{new Date(reg.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => openViewingModal(reg)} className="view-btn">View</button>
                    <button onClick={() => openConfirmationModal(reg, 'approve')} className="approve-btn">Approve</button>
                    <button onClick={() => openConfirmationModal(reg, 'reject')} className="reject-btn">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-section">
        <h3>👥 Approved Users ({approvedUsers.length})</h3>
        {approvedUsers.length === 0 ? (
          <p>No approved users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.map(approvedUser => (
                <tr key={approvedUser._id}>
                  <td>{approvedUser.name}</td>
                  <td>{approvedUser.email}</td>
                  <td>{approvedUser.role}</td>
                  <td>
                    <button onClick={() => handleEditUser(approvedUser)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDeleteUser(approvedUser._id, approvedUser.name)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Footer />

      {/* Viewing Registration Details Modal */}
      {viewingRegistration && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Registration Request Details</h3>
            <p><strong>Name:</strong> {viewingRegistration.name}</p>
            <p><strong>Email:</strong> {viewingRegistration.email}</p>
            <p><strong>NIC:</strong> {viewingRegistration.nic}</p>
            <p><strong>Role:</strong> {viewingRegistration.role}</p>
            <p><strong>Index Number:</strong> {viewingRegistration.indexNumber || 'N/A'}</p>
            <p><strong>Department:</strong> {viewingRegistration.department || 'N/A'}</p>
            <p><strong>Submitted At:</strong> {new Date(viewingRegistration.submittedAt).toLocaleString()}</p>
            <div className="modal-buttons">
              <button onClick={() => openConfirmationModal(viewingRegistration, 'approve')} className="approve-btn">Approve</button>
              <button onClick={() => openConfirmationModal(viewingRegistration, 'reject')} className="reject-btn">Reject</button>
              <button onClick={() => setViewingRegistration(null)} className="cancel-btn">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approve/Reject */}
      {confirmationRequest && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}</h3>
            <p>
              Are you sure you want to <strong>{confirmAction}</strong> the registration request for <strong>{confirmationRequest.name}</strong> ({confirmationRequest.email})?
            </p>
            {confirmAction === 'reject' && (
              <div>
                <label htmlFor="rejectionReason">Reason for Rejection (optional):</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  className="modal-textarea"
                />
              </div>
            )}
            <div className="modal-buttons">
              <button
                onClick={() => handleRegistrationAction(confirmationRequest._id, confirmAction, rejectionReason)}
                className={confirmAction === 'approve' ? 'approve-btn' : 'reject-btn'}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setConfirmationRequest(null);
                  setConfirmAction(null);
                  setRejectionReason('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={messageModal.onConfirm}
      />
    </div>
  );
}
