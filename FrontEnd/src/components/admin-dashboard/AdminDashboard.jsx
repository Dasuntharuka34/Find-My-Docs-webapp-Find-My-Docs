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
  const { user } = useContext(AuthContext); // AuthContext එකෙන් user object එක ලබා ගන්න

  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);

  // State for viewing registration details
  const [viewingRegistration, setViewingRegistration] = useState(null);

  // State for confirmation modal
  const [confirmationRegistration, setConfirmationRegistration] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // State for general message modal
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  // Function to close the message modal
  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  // Fetch data from Node.js backend
  const fetchRegistrations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/registrations/pending');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load pending registrations: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load users: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchUsers();
  }, []);

  // Handle the final registration approval/rejection
  const handleRegistration = async (id, action, reason = '') => {
    try {
      if (action === 'approve') {
        const approvedReg = registrations.find(r => r._id === id);
        if (approvedReg) {
          const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // Note: approvedReg.password will be the hashed password. Ensure backend `createUser` handles this correctly.
            body: JSON.stringify({
              name: approvedReg.name,
              email: approvedReg.email,
              password: approvedReg.password, // This needs to be the HASHED password from registration!
              role: approvedReg.role,
              phone: approvedReg.phone,
              department: approvedReg.department,
              indexNumber: approvedReg.role === 'Student' ? approvedReg.indexNumber : undefined
            }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to add user! status: ${response.status}`);
          }
          setMessageModal({ show: true, title: 'Success', message: `Registration for ${approvedReg.name} approved and added to users.`, onConfirm: closeMessageModal });
        }
      } else if (action === 'reject') {
        if (reason.trim() === '') {
          setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
          return;
        }
        setMessageModal({ show: true, title: 'Rejection', message: `Registration rejected. Reason: ${reason}`, onConfirm: closeMessageModal });
      }

      const deleteResponse = await fetch(`http://localhost:5000/api/registrations/${id}`, {
        method: 'DELETE',
      });
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.message || `Failed to delete registration! status: ${deleteResponse.status}`);
      }

      fetchRegistrations();
      fetchUsers();

      setConfirmationRegistration(null);
      setConfirmAction(null);
      setRejectionReason('');

    } catch (error) {
      console.error(`Error handling registration ${action}:`, error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to ${action} registration: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  // Handle editing a user
  const handleEditUser = async (userToEdit) => {
    const newName = prompt(`Edit name for ${userToEdit.name}:`, userToEdit.name);
    if (newName !== null && newName.trim() !== '') {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userToEdit._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName.trim() }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update user! status: ${response.status}`);
        }
        fetchUsers();
        setMessageModal({ show: true, title: 'Success', message: `User ${userToEdit.name} updated to ${newName}.`, onConfirm: closeMessageModal });
      } catch (error) {
        console.error("Error editing user:", error);
        setMessageModal({ show: true, title: 'Error', message: `Failed to edit user: ${error.message}`, onConfirm: closeMessageModal });
      }
    }
  };

  // Handle deleting a user
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
          fetchUsers();
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

  // Open confirmation modal and close view modal
  const openConfirmationModal = (registration, action) => {
    setConfirmationRegistration(registration);
    setConfirmAction(action);
    setViewingRegistration(null);
  };

  if (!user || user.role !== 'Admin') {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Access Denied! You do not have administrator privileges.</p>;
  }

  return (
    <div className="admin-dashboard">
      <Header user={user} />
      <h2>Admin Dashboard</h2>

      <section>
        <h3>📥 Pending Registrations</h3>
        {registrations.length === 0 ? (
          <p>No pending registrations.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => (
                <tr key={reg._id}>
                  <td>{reg.name}</td>
                  <td>{reg.email}</td>
                  <td>{reg.role}</td>
                  <td>
                    <button onClick={() => setViewingRegistration(reg)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3>👥 Manage Users</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Action</th>
            </tr>
          </thead>
            <tbody>
              {users.map(userItem => (
                <tr key={userItem._id}>
                  <td>{userItem.name}</td>
                  <td>{userItem.email}</td>
                  <td>{userItem.role}</td>
                  <td>
                    <button onClick={() => handleEditUser(userItem)}>Edit</button>
                    <button onClick={() => handleDeleteUser(userItem._id, userItem.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </section>

      <Footer />

      {viewingRegistration && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Registration Details</h3>
            <p><strong>Name:</strong> {viewingRegistration.name}</p>
            <p><strong>Email:</strong> {viewingRegistration.email}</p>
            <p><strong>Phone:</strong> {viewingRegistration.phone || 'N/A'}</p>
            <p><strong>Department:</strong> {viewingRegistration.department || 'N/A'}</p>
            <p><strong>Role:</strong> {viewingRegistration.role}</p>
            {viewingRegistration.indexNumber && (
              <p><strong>Index No:</strong> {viewingRegistration.indexNumber}</p>
            )}

            <div className="modal-buttons">
              <button onClick={() => openConfirmationModal(viewingRegistration, 'approve')}>Approve</button>
              <button onClick={() => openConfirmationModal(viewingRegistration, 'reject')}>Reject</button>
              <button onClick={() => setViewingRegistration(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {confirmationRegistration && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}</h3>
            <p>
              Are you sure you want to <strong>{confirmAction}</strong> the registration for <strong>{confirmationRegistration.name}</strong>?
            </p>
            {confirmAction === 'reject' && (
              <div>
                <label htmlFor="rejectionReason">Reason for Rejection:</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>
            )}
            <div className="modal-buttons">
              <button
                onClick={() => {
                  if (confirmAction === 'reject' && rejectionReason.trim() === '') {
                    setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
                    return;
                  }
                  handleRegistration(confirmationRegistration._id, confirmAction, rejectionReason);
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setConfirmationRegistration(null);
                  setConfirmAction(null);
                  setRejectionReason('');
                }}
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
        onCancel={messageModal.onCancel}
      />
    </div>
  );
}
