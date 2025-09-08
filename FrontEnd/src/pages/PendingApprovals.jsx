import React, { useState, useEffect, useContext } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import '../styles/pages/PendingApprovals.css';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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
            <button onClick={onConfirm} className="confirm-yes-btn">
              Yes
            </button>
          )}
          {onCancel && (
            <button className='no-btn' onClick={onCancel}>
              No
            </button>
          )}
          {(!onConfirm && !onCancel) && (
            <button className='okey-btn' onClick={() => { /* Close logic handled by parent */ }}>
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- APPROVAL STAGE DEFINITIONS ---
const approvalStages = {
  ExcuseRequest: [
    { name: "Submitted", approverRole: null },
    { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
    { name: "Pending HOD Approval", approverRole: "HOD" },
    { name: "Pending Dean Approval", approverRole: "Dean" },
    { name: "Pending VC Approval", approverRole: "VC" },
    { name: "Approved", approverRole: null }
  ],
  LeaveRequest: [
    { name: "Submitted", approverRole: null },
    { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
    { name: "Pending HOD Approval", approverRole: "HOD" },
    { name: "Pending Dean Approval", approverRole: "Dean" },
    { name: "Pending VC Approval", approverRole: "VC" },
    { name: "Approved", approverRole: null }
  ]
};

const approverRoleToStageIndex = {
  "Lecturer": 1,
  "HOD": 2,
  "Dean": 3,
  "VC": 4
};
// --- END APPROVAL STAGE DEFINITIONS ---

function PendingApprovals() {
  const { user } = useContext(AuthContext);

  const [excuseRequests, setExcuseRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const fetchPendingExcuseRequests = async () => {
    if (!user || !user.role) return;
    const targetStageIndex = approverRoleToStageIndex[user.role];
    if (targetStageIndex === undefined) {
      setExcuseRequests([]);
      return;
    }
    const targetStatusName = approvalStages.ExcuseRequest[targetStageIndex].name;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/pendingApprovals/${targetStatusName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setExcuseRequests(data);
    } catch (error) {
      console.error("Error fetching pending excuse requests:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load excuse requests: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  const fetchPendingLeaveRequests = async () => {
    if (!user || !user.role) return;
    const targetStageIndex = approverRoleToStageIndex[user.role];
    if (targetStageIndex === undefined) {
      setLeaveRequests([]);
      return;
    }
    const targetStatusName = approvalStages.LeaveRequest[targetStageIndex].name;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/pendingApprovals/${targetStatusName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeaveRequests(data);
    } catch (error) {
      console.error("Error fetching pending leave requests:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load leave requests: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  useEffect(() => {
    if (user && user.role) {
      fetchPendingExcuseRequests();
      fetchPendingLeaveRequests();
    }
  }, [user]);

  const handleApproval = async (request, action, reason = '') => {
    if (!user || !user.name || !user.role || !user._id) {
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated. Please log in again.', onConfirm: closeMessageModal });
      return;
    }

    try {
      const isLeaveRequest = request.type !== undefined;
      
      // --- FIX START: Include approverId in request body ---
      let apiEndpoint;
      let requestBody;

      if (isLeaveRequest) {
        if (action === 'approve') {
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/${request._id}/approve`;
          requestBody = { 
            approverRole: user.role,
            approverId: user._id // Added approverId
          };
        } else if (action === 'reject') {
          if (reason.trim() === '') {
            setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
            return;
          }
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/${request._id}/reject`;
          requestBody = { 
            approverRole: user.role,
            approverId: user._id, // Added approverId
            rejectionReason: reason 
          };
        }
      } else { 
        // For excuse requests
        if (action === 'approve') {
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/${request._id}/approve`;
          requestBody = { 
            approverRole: user.role,
            approverId: user._id // Added approverId
          };
        } else if (action === 'reject') {
          if (reason.trim() === '') {
            setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
            return;
          }
          apiEndpoint = `${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/${request._id}/reject`;
          requestBody = { 
            approverRole: user.role,
            approverId: user._id, // Added approverId
            comment: reason 
          };
        }
      }
      // --- FIX END ---

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update status! status: ${response.status}`);
      }

      if (isLeaveRequest) {
        fetchPendingLeaveRequests();
      } else {
        fetchPendingExcuseRequests();
      }

      // Show success message and reset state
      setMessageModal({ 
          show: true, 
          title: 'Success', 
          message: `Request for ${isLeaveRequest ? request.studentName : request.studentName} has been ${action}d successfully.`, 
          onConfirm: closeMessageModal 
      });

      setSelectedRequest(null);
      setConfirmAction(null);
      setRejectionReason('');

    } catch (error) {
      console.error(`Error handling approval action (${action}):`, error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to ${action} request: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  const confirmAndHandle = (req, action) => {
    setSelectedRequest(req);
    setConfirmAction(action);
  };

  if (!user) {
    return <p>Loading user data...</p>;
  }

  const isApproverRole = Object.keys(approverRoleToStageIndex).includes(user.role);
  if (!isApproverRole && user.role !== "Admin") {
    return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red' }}>Access Denied! You do not have permission to view pending approvals.</p>;
  }

  const allRequests = [...excuseRequests, ...leaveRequests];

  return (
    <div className="pending-approvals-container">
      <Header user={user} />
      <div className="approvals-layout">
        <Sidebar />
        <div className="approvals-content">
          <h2>Pending Approvals</h2>

          {/* --- Excuse Requests Table --- */}
          <div className="approvals-section">
            <h3>Excuse Requests</h3>
            {excuseRequests.length === 0 ? (
              <p>No pending excuse requests.</p>
            ) : (
              <table className="approvals-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    <th>View Details</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {excuseRequests.map(request => (
                    <tr key={request._id}>
                      <td>{request.studentName}</td>
                      <td>{request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/excuse-request/${request._id}`} className="view-details-btn">
                          View Details
                        </Link>
                      </td>
                      <td>
                        {request.status === approvalStages.ExcuseRequest[approverRoleToStageIndex[user.role]]?.name && (
                            <>
                              <button onClick={() => confirmAndHandle(request, 'approve')} className="approve-btn">Approve</button>
                              <button onClick={() => confirmAndHandle(request, 'reject')} className="reject-btn">Reject</button>
                            </>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <br />

          {/* --- Leave Requests Table --- */}
          <div className="approvals-section">
            <h3>Leave Requests</h3>
            {leaveRequests.length === 0 ? (
              <p>No pending leave requests.</p>
            ) : (
              <table className="approvals-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    <th>View Details</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map(request => (
                    <tr key={request._id}>
                      <td>{request.studentName}</td>
                      <td>{request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${request.status ? request.status.toLowerCase().replace(/\s/g, '-') : ''}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/leave-request/${request._id}`} className="view-details-btn">
                          View Details
                        </Link>
                      </td>
                      <td>
                        {request.status === approvalStages.LeaveRequest[approverRoleToStageIndex[user.role]]?.name && (
                            <>
                              <button onClick={() => confirmAndHandle({ ...request, type: "LeaveRequest" }, 'approve')} className="approve-btn">Approve</button>
                              <button onClick={() => confirmAndHandle({ ...request, type: "LeaveRequest" }, 'reject')} className="reject-btn">Reject</button>
                            </>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}</h3>
            <p>
              Are you sure you want to <strong>{confirmAction}</strong> the request for{' '}
              <strong>{selectedRequest.type || 'Excuse Request'}</strong> submitted by <strong>{selectedRequest.studentName}</strong>?
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
                  handleApproval(selectedRequest, confirmAction, rejectionReason);
                }}
                className="confirm-yes-btn"
              >
                Yes
              </button>
              <button onClick={() => {
                setSelectedRequest(null);
                setConfirmAction(null);
                setRejectionReason('');
              }} className="no-btn">
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