import React, { useState, useEffect, useContext } from 'react';
import Header from '../pages/Header';
import Footer from '../pages/Footer';
import Sidebar from '../pages/Sidebar';
import '../../styles/approvel-page/PendingApprovals.css';
import { AuthContext } from '../../context/AuthContext';
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
            // Added 'confirm-yes-btn' class for the 'Yes' button
            <button onClick={onConfirm} className="confirm-yes-btn"> 
              Yes
            </button>
          )}
          {onCancel && (
            // Retained 'no-btn' class for the 'No' button
            <button className='no-btn' onClick={onCancel}>
              No
            </button>
          )}
          {(!onConfirm && !onCancel) && (
            // Retained 'okey-btn' class for the 'Okay' button
            <button className='okey-btn' onClick={() => { /* Close logic handled by parent */ }}>
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- NEW STAGE DEFINITIONS FOR SEQUENTIAL APPROVAL ---
const approvalStages = [
  { name: "Submitted", approverRole: null }, 
  // { name: "Pending Staff Approval", approverRole: "Staff" }, 
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" }, 
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" }, 
  { name: "Approved", approverRole: null }, 
  { name: "Rejected", approverRole: null } 
];

const approverRoleToStageIndex = {
    // "Staff": 1,
    "Lecturer": 1,
    "HOD": 2,
    "Dean": 3,
    "VC": 4
};
// --- END NEW STAGE DEFINITIONS ---


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

  // Fetch letters for approval from Node.js backend
  const fetchPendingRequests = async () => {
    if (!user || !user.role) return;

    // Determine which stage this user's role is responsible for
    const targetStageIndex = approverRoleToStageIndex[user.role];
    if (targetStageIndex === undefined) {
      // If user's role doesn't have an approval stage, they shouldn't see anything here.
      setRequests([]);
      return;
    }
    const targetStatusName = approvalStages[targetStageIndex].name;

    try {
      // Backend API should filter by status (which maps to the stage name)
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/pendingApprovals/${targetStatusName}`);
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

      let newStatus;
      let nextStageIndex;

      if (action === 'approve') {
        nextStageIndex = currentRequest.currentStageIndex + 1;
        if (nextStageIndex < approvalStages.length - 2) { // -2 because last two are 'Approved' and 'Rejected'
          newStatus = approvalStages[nextStageIndex].name;
          setMessageModal({ show: true, title: 'Success', message: `Request for ${currentRequest.student} approved. Moving to "${newStatus}" stage.`, onConfirm: closeMessageModal });
        } else {
          newStatus = approvalStages[approvalStages.findIndex(s => s.name === "Approved")].name; // Final Approved state
          nextStageIndex = approvalStages.findIndex(s => s.name === "Approved");
          setMessageModal({ show: true, title: 'Success', message: `Request for ${currentRequest.student} finally approved.`, onConfirm: closeMessageModal });
        }
      } else if (action === 'reject') {
        if (reason.trim() === '') {
          setMessageModal({ show: true, title: 'Input Required', message: 'Please provide a reason for rejection.', onConfirm: closeMessageModal });
          return;
        }
        newStatus = approvalStages[approvalStages.findIndex(s => s.name === "Rejected")].name; // Final Rejected state
        nextStageIndex = approvalStages.findIndex(s => s.name === "Rejected");
        setMessageModal({ show: true, title: 'Rejection', message: `Request for ${currentRequest.student} rejected. Reason: ${reason}`, onConfirm: closeMessageModal });
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${user.token}` // If letters API is protected
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

  const confirmAndHandle = (req, action) => {
    setSelectedRequest(req);
    setConfirmAction(action);
  };

  if (!user) {
    return <p>Loading user data...</p>;
  }

  const isApproverRole = Object.keys(approverRoleToStageIndex).includes(user.role); // Check if user's role is in the approver map
  if (!isApproverRole && user.role !== "Admin") { // Allow Admin to see all, or restrict to specific approver stages
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Access Denied! You do not have permission to view pending approvals.</p>;
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
                  <th>View Details</th> {/* <-- New table header */}
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
                    <td> {/* <-- New table data cell for the View Details button */}
                      <Link
                        to={`/documents/${request._id}`}
                        className="view-details-btn" 
                      >
                        View Details
                      </Link>
                    </td>
                    <td>
                      {/* Show buttons ONLY if the letter's status is the one current user's role is responsible for */}
                      {request.status === approvalStages[approverRoleToStageIndex[user.role]]?.name &&
                       request.status !== approvalStages[approvalStages.findIndex(s => s.name === "Approved")]?.name &&
                       request.status !== approvalStages[approvalStages.findIndex(s => s.name === "Rejected")]?.name ? (
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
                className="confirm-yes-btn" // Added class for 'Yes' button in confirmation modal
              >
                Yes
              </button>
              <button onClick={() => {
                setSelectedRequest(null);
                setConfirmAction(null);
                setRejectionReason('');
              }} className="no-btn"> {/* Added class for 'No' button in confirmation modal */}
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
