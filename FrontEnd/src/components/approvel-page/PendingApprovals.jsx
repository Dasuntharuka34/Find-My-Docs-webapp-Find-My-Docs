import React, { useState, useEffect, useContext } from 'react';
import Header from '../common-dashboard/Header';
import Footer from '../common-dashboard/Footer';
import Sidebar from '../common-dashboard/Sidebar';
import '../../styles/approvel-page/PendingApprovals.css';
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

function PendingApprovals() {
  const { user } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // State for general message modal
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  // Function to close the message modal
  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const stages = [
    "Submitted",
    "Checked by Staff",
    "Lecturer Approval",
    "HOD",
    "Dean",
    "VC"
  ];

  // Fetch letters for approval from Node.js backend
  const fetchPendingRequests = async () => {
    if (!user || !user.role) return;

    try {
      const response = await fetch(`http://localhost:5000/api/letters/pendingApprovals/${user.role}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load pending requests: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  useEffect(() => {
    if (user && user.role) {
      fetchPendingRequests();
    }
  }, [user]);

  // Handle the approval/rejection of a letter
  const handleApproval = async (id, action, reason = '') => {
    if (!user || !user.name || !user.role) {
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated. Please log in again.', onConfirm: closeMessageModal });
      return;
    }

    try {
      const currentRequest = requests.find(req => req._id === id);

      if (!currentRequest) {
        setMessageModal({ show: true, title: 'Error', message: 'Request not found.', onConfirm: closeMessageModal });
        return;
      }

      let newStatus = currentRequest.status;
      let nextStageIndex = currentRequest.currentStageIndex || 0;

      if (action === 'approve') {
        nextStageIndex++;
        if (nextStageIndex < stages.length) {
          newStatus = stages[nextStageIndex];
          setMessageModal({ show: true, title: 'Success', message: `Request for ${currentRequest.student} approved. Moving to "${newStatus}" stage.`, onConfirm: closeMessageModal });
        } else {
          newStatus = 'Approved';
          setMessageModal({ show: true, title: 'Success', message: `Request for ${currentRequest.student} finally approved.`, onConfirm: closeMessageModal });
        }
      } else if (action === 'reject') {
        if (reason.trim() === '') {
          setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
          return;
        }
        newStatus = 'Rejected';
        setMessageModal({ show: true, title: 'Rejection', message: `Request for ${currentRequest.student} rejected. Reason: ${reason}`, onConfirm: closeMessageModal });
      }

      const response = await fetch(`http://localhost:5000/api/letters/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          currentStageIndex: nextStageIndex,
          rejectionReason: action === 'reject' ? reason : undefined,
          lastUpdated: new Date().toISOString().slice(0, 10),
          approver: user.name,
          approverRole: user.role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update letter status! status: ${response.status}`);
      }

      fetchPendingRequests();

      setSelectedRequest(null);
      setConfirmAction(null);
      setRejectionReason('');

    } catch (error) {
      console.error(`Error handling approval action (${action}):`, error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to ${action} request: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  // Open confirmation modal
  const confirmAndHandle = (req, action) => {
    setSelectedRequest(req);
    setConfirmAction(action);
  };

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="pending-approvals-container">
      <Header user={user} />

      <div className="approvals-layout">
        <Sidebar />

        <div className="approvals-content">
          <h2>Pending Approvals</h2>
          {requests.length === 0 ? (
            <p>No pending approval requests.</p>
          ) : (
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Student</th>
                  <th>Submitted On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request._id}>
                    <td>{request._id}</td>
                    <td>{request.type}</td>
                    <td>{request.student}</td>
                    <td>{request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {/* Check if the current user's role matches the current stage for approval */}
                      {(request.status === stages[request.currentStageIndex] && request.status !== 'Approved' && request.status !== 'Rejected' && stages[request.currentStageIndex].includes(user.role)) ? (
                           <>
                             <button onClick={() => confirmAndHandle(request, 'approve')} className="approve-btn">Approve</button>
                             <button onClick={() => confirmAndHandle(request, 'reject')} className="reject-btn">Reject</button>
                           </>
                         ) : (
                           <em style={{color: '#555'}}>No Action</em>
                         )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Footer />

      {selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}</h3>
            <p>
              Are you sure you want to <strong>{confirmAction}</strong> the request for{' '}
              <strong>{selectedRequest.type}</strong> submitted by <strong>{selectedRequest.student}</strong>?
            </p>
            {confirmAction === 'reject' && (
              <div>
                <label htmlFor="reason">Reason for Rejection:</label>
                <textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
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
                  handleApproval(selectedRequest._id, confirmAction, rejectionReason);
                }}
              >
                Yes
              </button>
              <button onClick={() => {
                setSelectedRequest(null);
                setConfirmAction(null);
                setRejectionReason('');
              }}>
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

export default PendingApprovals;
