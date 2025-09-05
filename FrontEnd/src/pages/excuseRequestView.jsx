import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProgressTracker from '../components/ProgressTracker';
import '../styles/pages/ExcuseRequestView.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

// --- APPROVAL STAGE DEFINITIONS (MUST BE CONSISTENT WITH BACKEND) ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Staff Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  { name: "Rejected", approverRole: null }
];
// --- END APPROVAL STAGE DEFINITIONS ---

const ExcuseRequestView = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [excuseRequest, setExcuseRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExcuseRequestDetails = async () => {
      if (!id) {
        setError("Excuse Request ID is missing from the URL.");
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
      setExcuseRequest(null);

      try {
        // Fetch the excuse request
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Excuse request not found with this ID.");
          }
          throw new Error(`Failed to fetch excuse request: HTTP status ${response.status}`);
        }
        const fetchedRequest = await response.json();

        if (!fetchedRequest) {
          throw new Error("Excuse request not found.");
        }

        // Authorization check
        const isApprover = approvalStages.some(stage => stage.approverRole === user.role);
        const isAdmin = user.role === 'Admin';
        const isOwner = fetchedRequest.studentId === user._id;

        if (!isOwner && !isAdmin && !isApprover) {
          setError("You are not authorized to view this excuse request.");
          setLoading(false);
          return;
        }

        setExcuseRequest(fetchedRequest);

        // Generate history from approvals array
        const generatedHistory = [];
        
        // Add initial submission
        generatedHistory.push({
          stage: 0,
          status: "Submitted",
          timestamp: fetchedRequest.submittedDate,
          updatedBy: fetchedRequest.studentName,
          comments: 'Initial submission'
        });

        // Add approval stages
        if (fetchedRequest.approvals && fetchedRequest.approvals.length > 0) {
          fetchedRequest.approvals.forEach((approval, index) => {
            if (approval.status !== 'pending') {
              generatedHistory.push({
                stage: index + 1,
                status: approval.status === 'approved' ? 'Approved' : 'Rejected',
                timestamp: approval.approvedAt || fetchedRequest.submittedDate,
                updatedBy: approval.approverRole || 'System',
                comments: approval.status === 'approved' 
                  ? `Approved by ${approval.approverRole}` 
                  : `Rejected by ${approval.approverRole}`
              });
            }
          });
        }

        // Add current status if not already in history
        if (fetchedRequest.status !== "Submitted" && 
            !generatedHistory.some(item => item.status === fetchedRequest.status)) {
          generatedHistory.push({
            stage: fetchedRequest.currentStageIndex,
            status: fetchedRequest.status,
            timestamp: new Date(),
            updatedBy: 'System',
            comments: `Current status: ${fetchedRequest.status}`
          });
        }

        setHistory(generatedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        setLoading(false);

      } catch (err) {
        console.error("Error fetching excuse request:", err);
        setError(`Error loading excuse request: ${err.message}`);
        setLoading(false);
      }
    };

    fetchExcuseRequestDetails();
  }, [id, user]);

  if (loading) {
    return (
      <div className="excuse-request-view-container">
        <Header user={user} />
        <div className="excuse-request-layout">
          <Sidebar />
          <main className="excuse-request-main-content">
            <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading excuse request details...</p>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="excuse-request-view-container">
        <Header user={user} />
        <div className="excuse-request-layout">
          <Sidebar />
          <main className="excuse-request-main-content">
            <div className="error-message" style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>{error}</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!excuseRequest) {
    return (
      <div className="excuse-request-view-container">
        <Header user={user} />
        <div className="excuse-request-layout">
          <Sidebar />
          <main className="excuse-request-main-content">
            <div className="error-message" style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Excuse request not found.</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="excuse-request-view-container">
      <Header user={user} />
      <div className="excuse-request-layout">
        <Sidebar />
        <main className="excuse-request-main-content">
          <div className="excuse-request-container">
            <div className="excuse-request-header-row">
              <h1>Excuse Request Details</h1>
            </div>
            
            <div className="excuse-request-info">
              <h3>Basic Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Request ID:</strong> {excuseRequest._id}
                </div>
                <div className="info-item">
                  <strong>Current Status:</strong> {excuseRequest.status}
                </div>
                <div className="info-item">
                  <strong>Student Name:</strong> {excuseRequest.studentName}
                </div>
                <div className="info-item">
                  <strong>Registration No:</strong> {excuseRequest.regNo}
                </div>
                <div className="info-item">
                  <strong>Email:</strong> {excuseRequest.email}
                </div>
                <div className="info-item">
                  <strong>Mobile:</strong> {excuseRequest.mobile}
                </div>
                <div className="info-item">
                  <strong>Address:</strong> {excuseRequest.address}
                </div>
                <div className="info-item">
                  <strong>Level of Study:</strong> {excuseRequest.levelOfStudy}
                </div>
                <div className="info-item">
                  <strong>Subject Combination:</strong> {excuseRequest.subjectCombo}
                </div>
                <div className="info-item">
                  <strong>Submitted Date:</strong> {new Date(excuseRequest.submittedDate).toLocaleDateString()}
                </div>
              </div>

              <h3>Absence Details</h3>
              <div className="info-grid">
                <div className="info-item full-width">
                  <strong>Reason for Absence:</strong> {excuseRequest.reason}
                </div>
                <div className="info-item full-width">
                  <strong>Reason Details:</strong> {excuseRequest.reasonDetails}
                </div>
                <div className="info-item full-width">
                  <strong>Lectures Missed:</strong> {excuseRequest.lectureAbsents}
                </div>
              </div>

              {excuseRequest.absences && excuseRequest.absences.length > 0 && (
                <>
                  <h3>Periods of Absence</h3>
                  <div className="absences-table">
                    <div className="absences-header">
                      <div>Course Code</div>
                      <div>Date</div>
                    </div>
                    {excuseRequest.absences.map((absence, idx) => (
                      <div key={idx} className="absences-row">
                        <div>{absence.courseCode}</div>
                        <div>{absence.date}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {excuseRequest.attachments && (
                <div className="info-item full-width">
                  <strong>Medical Form:</strong>{' '}
                  <a
                    href={`${process.env.REACT_APP_BACKEND_URL}/${excuseRequest.attachments}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Medical Form
                  </a>
                </div>
              )}
            </div>

            <div className="progress-section">
              <h3>Approval Progress</h3>
              <ProgressTracker
                stages={approvalStages.map(s => s.name)}
                currentStage={excuseRequest.currentStageIndex}
              />
            </div>

            <div className="history-section">
              <h3>Approval History</h3>
              {history.length === 0 ? (
                <p>No detailed history available for this excuse request.</p>
              ) : (
                <div className="history-table">
                  <div className="history-header">
                    <div>Stage</div>
                    <div>Status</div>
                    <div>Date</div>
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

export default ExcuseRequestView;