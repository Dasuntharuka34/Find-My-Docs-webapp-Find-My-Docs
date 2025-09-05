import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProgressTracker from '../components/ProgressTracker';
import '../styles/pages/DocumentsView.css';
import Header from '../components/Header'
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

// --- APPROVAL STAGE DEFINITIONS (MUST BE CONSISTENT ACROSS ALL RELEVANT FILES) ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  // { name: "Rejected", approverRole: null }
];
// --- END APPROVAL STAGE DEFINITIONS ---

const DocumentsView = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [document, setDocument] = useState(null); // This will hold the Letter object (which might contain populated old excuseRequest)
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!id) {
        setError("Document ID is missing from the URL.");
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
      setDocument(null);

      try {
        // Fetch as a Letter first. Backend will populate excuseRequestId if it's an OLD Medical Certificate.
        const letterResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/${id}`);
        if (!letterResponse.ok) {
          if (letterResponse.status === 404) {
            throw new Error("Document not found with this ID.");
          }
          throw new Error(`Failed to fetch document: HTTP status ${letterResponse.status}`);
        }
        const fetchedLetter = await letterResponse.json();

        if (!fetchedLetter) {
            throw new Error("Document not found.");
        }

        // Authorization check
        const isApprover = approvalStages.some(stage => stage.approverRole === user.role);
        const isAdmin = user.role === 'Admin';
        const isOwner = fetchedLetter.studentId === user._id;

        if (!isOwner && !isAdmin && !isApprover) {
            setError("You are not authorized to view this document.");
            setLoading(false);
            return;
        }

        setDocument(fetchedLetter);

        // Generate history for all Letter types (including Medical Certificates)
        const generatedHistory = [];
        generatedHistory.push({
            stage: 0,
            status: approvalStages[0].name,
            timestamp: fetchedLetter.submittedDate,
            updatedBy: fetchedLetter.student,
            comments: 'Initial submission'
        });
        if (fetchedLetter.currentStageIndex > 0) {
            const currentStatusStage = approvalStages[fetchedLetter.currentStageIndex];
            if (currentStatusStage) {
                let comments = 'Status updated';
                if (currentStatusStage.name === approvalStages[approvalStages.findIndex(s => s.name === "Rejected")]?.name) {
                    comments = `Rejected: ${fetchedLetter.rejectionReason || 'No specific reason provided.'}`;
                } else if (currentStatusStage.name === approvalStages[approvalStages.findIndex(s => s.name === "Approved")]?.name) {
                    comments = 'Final approval received';
                } else {
                    comments = `Pending approval from ${currentStatusStage.approverRole}`;
                }
                generatedHistory.push({
                    stage: fetchedLetter.currentStageIndex,
                    status: fetchedLetter.status,
                    timestamp: fetchedLetter.lastUpdated || fetchedLetter.submittedDate,
                    updatedBy: fetchedLetter.approver || 'System',
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
  }, [id, user]);


  if (loading) {
    return (
      <div className="documents-view-container">
        <Header user={user} />
        <div className="documents-layout">
          <Sidebar />
          <main className="documents-main-content">
            <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading document details...</p>
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

  if (!document) {
    return (
      <div className="documents-view-container">
        <Header user={user} />
        <div className="documents-layout">
          <Sidebar />
          <main className="documents-main-content">
            <div className="error-message" style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem', color: 'red'}}>Document not found.</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // Determine if it's a Medical Certificate. For new ones, details are directly on 'document'.
  // For old ones, 'excuseRequestId' would be populated.
  const isMedicalCertificate = document.type === "Medical Certificate";
  const excuseRequestData = document.excuseRequestId || document; // Use populated data for old, or document itself for new

  return (
    <div className="documents-view-container">
      <Header user={user} />
      <div className="documents-layout">
        <Sidebar />
        <main className="documents-main-content">
          <div className="document-container">
            <div className="document-header-row">
              <h1>Document Details ({isMedicalCertificate ? 'Medical Certificate (Excuse Request)' : 'Letter'})</h1>
            </div>
            
            {/* Render fields common to all letters */}
            <div className="document-info">
              <p><strong>Document ID:</strong> {document._id}</p>
              <p><strong>Type:</strong> {document.type}</p>
              <p><strong>Current Status:</strong> {document.status}</p>
              <p><strong>Submitted By:</strong> {document.student}</p>
              <p><strong>Submitted Date:</strong> {new Date(document.submittedDate).toLocaleDateString()}</p>
              
              {isMedicalCertificate ? (
                // Display Medical Certificate specific fields from the document itself (or populated old data)
                <>
                  <h3>Excuse Request Details:</h3>
                  <p><strong>Student Name:</strong> {excuseRequestData.name || document.student}</p> {/* Use name from form, fallback to student from letter */}
                  <p><strong>Registration No:</strong> {excuseRequestData.regNo}</p>
                  <p><strong>Email:</strong> {excuseRequestData.email}</p>
                  <p><strong>Mobile:</strong> {excuseRequestData.mobile}</p>
                  <p><strong>Address:</strong> {excuseRequestData.address}</p>
                  <p><strong>Level of Study:</strong> {excuseRequestData.levelOfStudy}</p>
                  <p><strong>Subject Combination:</strong> {excuseRequestData.subjectCombo}</p>
                  <p><strong>Reason for Absence:</strong> {excuseRequestData.reason}</p>
                  <p><strong>Reason Details:</strong> {excuseRequestData.reasonDetails}</p>
                  <p><strong>Lectures Missed:</strong> {excuseRequestData.lectureAbsents}</p>
                  <p><strong>Application Date (Absence):</strong> {new Date(excuseRequestData.date).toLocaleDateString()}</p>
                  {excuseRequestData.absences && excuseRequestData.absences.length > 0 && (
                      <div>
                          <strong>Periods of Absence:</strong>
                          <ul>
                              {excuseRequestData.absences.map((abs, idx) => (
                                  <li key={idx}>Course Code: {abs.courseCode}, Date(s): {abs.date}</li>
                              ))}
                          </ul>
                      </div>
                  )}
                  {document.attachments && ( // Attachments field in Letter model holds medicalFormPath
                      <p>
                          <strong>Medical Form:</strong> {' '}
                          <a href={`${process.env.REACT_APP_BACKEND_URL}/${document.attachments}`} target="_blank" rel="noopener noreferrer">
                            View Medical Form
                          </a>
                      </p>
                  )}
                </>
              ) : (
                // Render fields for regular letters
                <>
                  <p><strong>Reason for Request:</strong> {document.reason}</p>
                  <p><strong>Date of Absence/Request:</strong> {new Date(document.date).toLocaleDateString()}</p>
                  {document.attachments && (
                      <p>
                        <strong>Attachments:</strong> {' '}
                        <a href={`${process.env.REACT_APP_BACKEND_URL}/${document.attachments}`} target="_blank" rel="noopener noreferrer">
                          View Attachment
                        </a>
                      </p>
                  )}
                  {document.rejectionReason && document.status === approvalStages[approvalStages.findIndex(s => s.name === "Rejected")]?.name && (
                      <p><strong>Rejection Reason:</strong> {document.rejectionReason}</p>
                  )}
                </>
              )}
            </div>

            <div className="progress-section">
              <h3>Approval Progress</h3>
              <ProgressTracker 
                stages={approvalStages.map(s => s.name)}
                currentStage={document.currentStageIndex}
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

export default DocumentsView;
