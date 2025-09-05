import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import '../styles/pages/MyLettersPage.css';
import { AuthContext } from '../context/AuthContext';

// Custom Message Modal Component (same as used in other dashboards)
const MessageModal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          {onConfirm && (
            <button onClick={onConfirm} className="submit-btn">
              Okay
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
          )}
          {(!onConfirm && !onCancel) && (
            <button onClick={() => { /* Close logic handled by parent */ }} className="submit-btn">
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Status colors consistent with RecentLetters component
const statusColors = {
  Submitted: '#808080',
  "Pending Lecturer Approval": '#5bc0de',
  "Pending HOD Approval": '#5bc0de',
  "Pending Dean Approval": '#5bc0de',
  "Pending VC Approval": '#5bc0de',
  Approved: '#5cb85c',
  Rejected: '#d9534f',
};

function MyLettersPage() {
  const { user } = useContext(AuthContext);
  const [letters, setLetters] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [excuseRequests, setExcuseRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  useEffect(() => {
    const fetchAllRequests = async () => {
      if (!user || !user._id) {
        setLoading(false);
        setMessageModal({ show: true, title: 'Error', message: 'User not authenticated. Please log in to view your requests.', onConfirm: closeMessageModal });
        return;
      }

      setLoading(true);
      try {
        // Fetch Letters
        const lettersResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/byUser/${user._id}`);
        if (!lettersResponse.ok) {
          throw new Error(`Failed to fetch letters: HTTP status ${lettersResponse.status}`);
        }
        const lettersData = await lettersResponse.json();
        setLetters(lettersData);
        
        // Fetch Leave Requests
        const leaveRequestsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leaverequests/byUser/${user._id}`);
        if (!leaveRequestsResponse.ok) {
          throw new Error(`Failed to fetch leave requests: HTTP status ${leaveRequestsResponse.status}`);
        }
        const leaveRequestsData = await leaveRequestsResponse.json();
        setLeaveRequests(leaveRequestsData);

        // Fetch Excuse Requests
        const excuseRequestsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests/byUser/${user._id}`);
        if (!excuseRequestsResponse.ok) {
          throw new Error(`Failed to fetch excuse requests: HTTP status ${excuseRequestsResponse.status}`);
        }
        const excuseRequestsData = await excuseRequestsResponse.json();
        setExcuseRequests(excuseRequestsData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
        setMessageModal({ show: true, title: 'Error', message: `Failed to load your data: ${error.message}`, onConfirm: closeMessageModal });
      }
    };

    fetchAllRequests();
  }, [user]);

  if (loading) {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading your requests...</p>;
  }

  return (
    <div className="dashboard-container">
      <Header user={user} />
      <Sidebar />
      <div className="approvals-layout">
        <main className="letter-content">
          <div className="letter-contenter">
            
            {/* --- Letters Table --- */}
            <div className="recent-letters">
              <h2>My Submitted Letters</h2>
              {letters.length === 0 ? (
                <p>You have not submitted any letters yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Submitted Date</th>
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {letters.map(letter => (
                      <tr key={letter._id}>
                        <td>{letter.type}</td>
                        <td>{new Date(letter.submittedDate).toLocaleDateString()}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: statusColors[letter.status] || '#777' }}
                          >
                            {letter.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/documents/${letter._id}`} className="view-details-btn">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* --- Leave Requests Table --- */}
            <div className="recent-letters" style={{ marginTop: '40px' }}>
              <h2>My Submitted Leave Requests</h2>
              {leaveRequests.length === 0 ? (
                <p>You have not submitted any leave requests yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Reason</th>
                      <th>Submitted Date</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map(request => (
                      <tr key={request._id}>
                        <td>{request.reason}</td>
                        <td>{new Date(request.submittedDate).toLocaleDateString()}</td>
                        <td>{new Date(request.startDate).toLocaleDateString()}</td>
                        <td>{new Date(request.endDate).toLocaleDateString()}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: statusColors[request.status] || '#777' }}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/leave-request/${request._id}`} className="view-details-btn">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* --- Excuse Requests Table --- */}
            <div className="recent-letters" style={{ marginTop: '40px' }}>
              <h2>My Submitted Excuse Requests</h2>
              {excuseRequests.length === 0 ? (
                <p>You have not submitted any excuse requests yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Registration No</th>
                      <th>Reason</th>
                      <th>Submitted Date</th>
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excuseRequests.map(request => (
                      <tr key={request._id}>
                        <td>{request.studentName}</td>
                        <td>{request.regNo}</td>
                        <td>{request.reason}</td>
                        <td>{new Date(request.submittedDate).toLocaleDateString()}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: statusColors[request.status] || '#777' }}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/excuse-request/${request._id}`} className="view-details-btn">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </main>
      </div>
      <Footer />
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

export default MyLettersPage;