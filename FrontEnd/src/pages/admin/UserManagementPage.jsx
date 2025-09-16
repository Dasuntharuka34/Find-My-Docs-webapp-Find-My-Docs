import React, { useState, useEffect, useContext } from 'react';

import { AuthContext } from '../../context/AuthContext';

const MessageModal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-buttons">
          {onConfirm && (
            <button onClick={onConfirm} className="modal-confirm-btn">
              Yes
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} className="modal-cancel-btn">
              No
            </button>
          )}
          {(!onConfirm && !onCancel) && (
            <button onClick={() => { /* Close logic handled by parent */ }} className="modal-okay-btn">
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function UserManagementPage() {
  const { user } = useContext(AuthContext);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const fetchApprovedUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users`);
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
    fetchApprovedUsers();
  }, []);

  const handleEditUser = async (userToEdit) => {
    const newName = prompt(`Edit name for ${userToEdit.name}:`, userToEdit.name);
    if (newName !== null && newName.trim() !== '') {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userToEdit._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim() }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update user! status: ${response.status}`);
        }
        fetchApprovedUsers();
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
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userIdToDelete}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to delete user! status: ${response.status}`);
          }
          fetchApprovedUsers();
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

  const handleResetPassword = async (userId, userName) => {
    setMessageModal({
      show: true,
      title: 'Confirm Password Reset',
      message: `Are you sure you want to reset the password for ${userName} to the default password ('password123')?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/reset-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await response.json();

          if (response.ok) {
            setMessageModal({ show: true, title: 'Success', message: data.message, onConfirm: closeMessageModal });
          } else {
            setMessageModal({ show: true, title: 'Error', message: data.message || 'Failed to reset password.' });
          }
        } catch (error) {
          console.error("Error resetting password:", error);
          setMessageModal({ show: true, title: 'Error', message: `Network error during password reset: ${error.message}`, onConfirm: closeMessageModal });
        } finally {
          closeMessageModal();
        }
      },
      onCancel: closeMessageModal
    });
  };

  if (!user || user.role !== 'Admin') {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Access Denied! You do not have administrator privileges.</p>;
  }

  return (
    <div className="admin-dashboard">

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
                      <button onClick={() => handleResetPassword(approvedUser._id, approvedUser.name)} className="reset-password-btn">Reset Password</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <MessageModal
          show={messageModal.show}
          title={messageModal.title}
          message={messageModal.message}
          onConfirm={messageModal.onConfirm}
        />
    </div>
  );
}
