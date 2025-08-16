import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProgressTracker from './ProgressTracker';
import '../../styles/common-dashboard/DocumentsView.css'; // Make sure this CSS file exists
import Header from './Header';
import Footer from './Footer';
import { AuthContext } from '../../context/AuthContext';

// --- APPROVAL STAGE DEFINITIONS (MUST BE CONSISTENT ACROSS ALL RELEVANT FILES) ---
// Dashboard, SpecialDashboard, PendingApprovals, ProgressTracker, RecentLetters, MyLettersPage
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Staff Approval", approverRole: "Staff" },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  { name: "Rejected", approverRole: null }
];
// --- END APPROVAL STAGE DEFINITIONS ---

const DocumentsView = () => {
  const { id } = useParams(); // URL parameter එකෙන් document ID එක ලබා ගන්න
  const { user } = useContext(AuthContext); // AuthContext එකෙන් login වී සිටින user ලබා ගන්න

  const [document, setDocument] = useState(null);
  const [history, setHistory] = useState([]); // Document history state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!id) {
        setError("Document ID is missing from the URL.");
        setLoading(false);
        return;
      }
      if (!user || !user._id || !user.role) { // User login check
        setError("User not authenticated or role missing. Please log in.");
        setLoading(false);
        return;
      }

      try {
        // Backend API: GET /api/letters/:id - Fetches a single letter by its ID
        const letterResponse = await fetch(`http://localhost:5000/api/letters/${id}`);
        if (!letterResponse.ok) {
          throw new Error(`Failed to fetch letter: HTTP status ${letterResponse.status}`);
        }
        const letterData = await letterResponse.json();

        // Authorization check: Ensure only authorized users can view documents.
        // - The student who submitted the letter
        // - Admin users
        // - Any approver whose role is part of the approval flow (Staff, Lecturer, etc.)
        const isApprover = approvalStages.some(stage => stage.approverRole === user.role);
        if (letterData.studentId !== user._id && user.role !== 'Admin' && !isApprover) {
            setError("You are not authorized to view this document.");
            setLoading(false);
            return;
        }

        setDocument(letterData);

        // --- DYNAMICALLY GENERATE HISTORY ---
        // This generates a simplified history based on the current state of the letter.
        // For a comprehensive history, you would typically have a separate 'history' array
        // on the Letter model, storing each status change with timestamp and approver.
        const generatedHistory = [];

        // 1. Add the initial submission history entry
        generatedHistory.push({
            stage: 0,
            status: approvalStages[0].name, // "Submitted"
            timestamp: letterData.submittedDate,
            updatedBy: letterData.student,
            comments: 'Initial submission'
        });

        // 2. Add the current/final status as a history entry if it's beyond the submitted stage.
        // This effectively represents the last action taken on the letter.
        if (letterData.currentStageIndex > 0) {
            const currentStatusStage = approvalStages[letterData.currentStageIndex];
            if (currentStatusStage) {
                let comments = 'Status updated';
                if (currentStatusStage.name === approvalStages[approvalStages.findIndex(s => s.name === "Rejected")]?.name) {
                    comments = `Rejected: ${letterData.rejectionReason || 'No specific reason provided.'}`;
                } else if (currentStatusStage.name === approvalStages[approvalStages.findIndex(s => s.name === "Approved")]?.name) {
                    comments = 'Final approval received';
                } else {
                    comments = `Pending approval from ${currentStatusStage.approverRole}`;
                }

                generatedHistory.push({
                    stage: letterData.currentStageIndex,
                    status: letterData.status,
                    timestamp: letterData.lastUpdated || letterData.submittedDate, // Use lastUpdated or submittedDate if lastUpdated isn't set yet
                    updatedBy: letterData.approver || 'System', // Use approver name if available
                    comments: comments
                });
            }
        }
        setHistory(generatedHistory);
        setLoading(false);

      } catch (err) {
        console.error("Error fetching document:", err);
        setError(`Error loading document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [id, user]); // Re-run effect if ID or user changes

  if (loading) {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading document details...</p>;
  }

  if (error) {
    return <div className="error-message" style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>{error}</div>;
  }

  // If document is null after loading and no error, it means document was not found
  if (!document) {
    return <div className="error-message" style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Document not found.</div>;
  }

  return (
    <>
      <div className="documents-view">
        <Header user={user} /> {/* Pass authenticated user to Header */}
        <div className="document-container">
          <div className="document-info">
            <h1>Document Details</h1>
            <p><strong>Document ID:</strong> {document._id}</p> {/* Use _id for MongoDB ID */}
            <p><strong>Letter Type:</strong> {document.type}</p>
            <p><strong>Current Status:</strong> {document.status}</p>
            <p><strong>Submitted By:</strong> {document.student}</p> {/* Name of the submitting student */}
            <p><strong>Submitted Date:</strong> {new Date(document.submittedDate).toLocaleDateString()}</p>
            <p><strong>Reason for Request:</strong> {document.reason}</p>
            <p><strong>Date of Absence/Request:</strong> {new Date(document.date).toLocaleDateString()}</p>
            {document.attachments && (
                <p><strong>Attachments:</strong> <a href={document.attachments} target="_blank" rel="noopener noreferrer">View Attachment</a></p>
            )}
            {document.rejectionReason && document.status === approvalStages[approvalStages.findIndex(s => s.name === "Rejected")]?.name && (
                <p><strong>Rejection Reason:</strong> {document.rejectionReason}</p>
            )}
          </div>

          <div className="progress-section">
            <h3>Approval Progress</h3>
            <ProgressTracker 
              stages={approvalStages.map(s => s.name)} // Pass only stage names to ProgressTracker
              currentStage={document.currentStageIndex}
              // documentHistory={history} // You can pass this if ProgressTracker needs detailed history
            />
          </div>

          <div className="history-section">
            <h3>Approval History</h3>
            {history.length === 0 ? (
                <p>No detailed history available for this document.</p>
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
                            <div>{item.stage === 0 ? 'Submitted' : approvalStages[item.stage]?.name || `Stage ${item.stage}`}</div> {/* Display stage name */}
                            <div>{item.status}</div>
                            <div>{new Date(item.timestamp).toLocaleString()}</div> {/* Use toLocaleString for time too */}
                            <div>{item.updatedBy}</div>
                            <div>{item.comments}</div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      <Footer />
      </div>
    </>
  );
};

export default DocumentsView;
