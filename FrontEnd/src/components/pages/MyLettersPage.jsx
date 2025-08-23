import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import '../../styles/pages/MyLettersPage.css'; // Make sure this CSS file is created and imported
import { AuthContext } from '../../context/AuthContext';

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
  "Pending Staff Approval": '#5bc0de',
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
  const [loading, setLoading] = useState(true);
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  useEffect(() => {
    const fetchMyLetters = async () => {
      if (!user || !user._id) {
        setLoading(false);
        setMessageModal({ show: true, title: 'Error', message: 'User not authenticated. Please log in to view your letters.', onConfirm: closeMessageModal });
        return;
      }

      try {
        // Fetch letters specific to the logged-in user
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/letters/byUser/${user._id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLetters(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching my letters:", error);
        setLoading(false);
        setMessageModal({ show: true, title: 'Error', message: `Failed to load your letters: ${error.message}`, onConfirm: closeMessageModal });
      }
    };

    fetchMyLetters();
  }, [user]); // Re-fetch when user object changes (e.g., after login)

  if (loading) {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading your letters...</p>;
  }

  return (
    <div className="dashboard-container"> {/* Using dashboard-container for overall layout from Dashboard.css */}
      <Header user={user} />
      <div className="approvals-layout"> {/* Reusing layout for sidebar + content from PendingApprovals.css or Dashboard.css */}
        <Sidebar />
        <main className="letter-content"> {/* Reusing main-content for styling */}
          <div className="letter-contenter">
          
          {letters.length === 0 ? (
            <div>
              <h2>My Submitted Letters</h2>
            <p>You have not submitted any letters yet.</p>
            </div>
          ) : (
            <div className="recent-letters"> {/* Reusing RecentLetters styling */}
            <h2>My Submitted Letters</h2>
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
                        {/* Link to a detailed view of the document/letter */}
                        <Link to={`/documents/${letter._id}`} className="view-details-btn">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
