import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProgressTracker from '../components/ProgressTracker';
import '../styles/pages/DocumentsView.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

// --- APPROVAL STAGE DEFINITIONS ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  { name: "Rejected", approverRole: null }
];

const LeaveRequestView = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [leaveRequest, setLeaveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaveRequestDetails = async () => {
      if (!id) {
        setError("Leave Request ID is missing from the URL.");
        setLoading(false);
        return;
      }
      if (!user || !user._id || !user.role) {
        setError("User not authenticated or role missing. Please log in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setLeaveRequest(null);

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Leave request not found with this ID.");
          }
          throw new Error(`Failed to fetch leave request: HTTP status ${response.status}`);
        }
        
        const fetchedRequest = await response.json();

        // Authorization check
        const isApprover = approvalStages.some(stage => stage.approverRole === user.role);
        const isAdmin = user.role === 'Admin';
        const isOwner = fetchedRequest.studentId === user._id;

        if (!isOwner && !isAdmin && !isApprover) {
          setError("You are not authorized to view this leave request.");
          setLoading(false);
          return;
        }

        setLeaveRequest(fetchedRequest);
        setLoading(false);

      } catch (err) {
        console.error("Error fetching leave request:", err);
        setError(`Error loading leave request: ${err.message}`);
        setLoading(false);
      }
    };

    fetchLeaveRequestDetails();
  }, [id, user]);

  if (loading) {
    return (
      <div className="documents-view-container">
        <Header user={user} />
        <div className="documents-layout">
          <Sidebar />
          <main className="documents-main-content">
            <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading leave request details...</p>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="documents-view-container">
        <Header user={user} />
        <div className="documents-layout">
          <Sidebar />
          <main className="documents-main-content">
            <div className="error-message" style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>{error}</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="documents-view-container">
        <Header user={user} />
        <div className="documents-layout">
          <Sidebar />
          <main className="documents-main-content">
            <div className="error-message" style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Leave request not found.</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const history = leaveRequest.approvals.map(approval => {
    return {
      stage: approvalStages.findIndex(stage => stage.approverRole === approval.approverRole),
      status: approval.status,
      timestamp: approval.approvedAt || leaveRequest.submittedDate,
      updatedBy: approval.approverRole || 'Requester',
      comments: approval.status === 'approved' ? `Approved by ${approval.approverRole}` : `Rejected by ${approval.approverRole}`
    };
  });
  
  history.unshift({
    stage: 0,
    status: 'Submitted',
    timestamp: leaveRequest.submittedDate,
    updatedBy: leaveRequest.studentName,
    comments: 'Initial submission'
  });
  
  return (
    <div className="documents-view-container">
      <Header user={user} />
      <div className="documents-layout">
        <Sidebar />
        <main className="documents-main-content">
          <div className="document-container">
            <div className="document-header-row">
              <h1>Leave Request Details</h1>
            </div>
            
            <div className="document-info">
              <p><strong>Request ID:</strong> {leaveRequest._id}</p>
              <p><strong>Current Status:</strong> {leaveRequest.status}</p>
              <p><strong>Submitted By:</strong> {leaveRequest.studentName}</p>
              <p><strong>Submitted Date:</strong> {new Date(leaveRequest.submittedDate).toLocaleString()}</p>
              <p><strong>Reason for Leave:</strong> {leaveRequest.reason}</p>
              <p><strong>Reason Details:</strong> {leaveRequest.reasonDetails}</p>
              <p><strong>Leave Period:</strong> {new Date(leaveRequest.startDate).toLocaleDateString()} to {new Date(leaveRequest.endDate).toLocaleDateString()}</p>
              <p><strong>Contact during Leave:</strong> {leaveRequest.contactDuringLeave}</p>
              <p><strong>Remarks:</strong> {leaveRequest.remarks || 'N/A'}</p>
              
              {leaveRequest.attachments && (
                <p>
                  <strong>Attachments:</strong> {' '}
                  <a href={`${process.env.REACT_APP_BACKEND_URL}/${leaveRequest.attachments}`} target="_blank" rel="noopener noreferrer">
                    View Attachment
                  </a>
                </p>
              )}
            </div>

            <div className="progress-section">
              <h3>Approval Progress</h3>
              <ProgressTracker 
                stages={approvalStages.map(s => s.name)}
                currentStage={leaveRequest.currentStageIndex}
              />
            </div>

            <div className="history-section">
              <h3>Approval History</h3>
              {history.length <= 1 ? (
                <p>No detailed history available for this leave request.</p>
              ) : (
                <div className="history-table">
                  <div className="history-header">
                    <div>Stage</div>
                    <div>Status</div>
                    <div>Date & Time</div>
                    <div>Updated By</div>
                    <div>Comments</div>
                  </div>
                  {history.map((item, index) => (
                    <div key={index} className="history-row">
                      <div>{item.stage === 0 ? 'Submitted' : approvalStages[item.stage]?.name || `Stage ${item.stage}`}</div>
                      <div>{item.status}</div>
                      <div>{new Date(item.timestamp).toLocaleString()}</div>
                      <div>{item.updatedBy}</div>
                      <div>{item.comments}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default LeaveRequestView;