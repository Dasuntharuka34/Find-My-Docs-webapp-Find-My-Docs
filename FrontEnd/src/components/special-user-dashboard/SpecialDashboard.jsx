import React, { useState, useEffect, useContext } from 'react';
import Header from '../common-dashboard/Header';
import ProgressTracker from '../common-dashboard/ProgressTracker';
import RecentLetters from '../common-dashboard/RecentLetters';
import Notifications from '../common-dashboard/Notifications';
import NewLetterModal from '../common-dashboard/NewLetterModal';
import Footer from '../common-dashboard/Footer';
import Sidebar from './Sidebar'; // Specific sidebar for special dashboard
import '../../styles/common-dashboard/Dashboard.css';
import '../../styles/common-dashboard/ProgressTracker.css';
import '../../styles/common-dashboard/RecentLetters.css';
import '../../styles/common-dashboard/Notifications.css';
import '../../styles/common-dashboard/NewLetterModal.css';
import '../../styles/common-dashboard/Header.css';
import '../../styles/common-dashboard/Footer.css';
import '../../styles/common-dashboard/Sidebar.css';
import { AuthContext } from '../../context/AuthContext';


// Custom Message Modal Component
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
              Yes
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} className="cancel-btn">
              No
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

const stages = [
  "Submitted",
  "Checked by Staff",
  "Lecturer Approval",
  "HOD",
  "Dean",
  "VC"
];

function SpecialDashboard() {
  const { user } = useContext(AuthContext); // AuthContext එකෙන් user object එක ලබා ගන්න

  const [currentStage, setCurrentStage] = useState(0);
  const [letters, setLetters] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // State for general message modal
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  // Function to close the message modal
  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  // Fetch letters for the current user from Node.js backend
  const fetchLetters = async () => {
    if (!user || !user._id) return; // <-- user._id භාවිත කරන්න

    try {
      const response = await fetch(`http://localhost:5000/api/letters/byUser/${user._id}`); // <-- user._id භාවිත කරන්න
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLetters(data);

      if (data.length > 0) {
        const latestLetter = data.reduce((prev, current) => 
          (prev.currentStageIndex > current.currentStageIndex) ? prev : current
        );
        setCurrentStage(Math.min(latestLetter.currentStageIndex || 0, stages.length - 1));
      } else {
        setCurrentStage(0);
      }

    } catch (error) {
      console.error("Error fetching letters:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load letters: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  // Fetch notifications for the current user from Node.js backend
  const fetchNotifications = async () => {
    if (!user || !user._id) return; // <-- user._id භාවිත කරන්න

    try {
      const response = await fetch(`http://localhost:5000/api/notifications/byUser/${user._id}`); // <-- user._id භාවිත කරන්න
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load notifications: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  useEffect(() => {
    if (user && user._id) { // <-- user._id භාවිත කරන්න
      fetchLetters();
      fetchNotifications();
    }
  }, [user]);

  // Handle new letter submit
  const addLetter = async (newLetterData) => {
    if (!user || !user._id || !user.name) { // <-- user._id භාවිත කරන්න
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated. Please log in again.', onConfirm: closeMessageModal });
      return;
    }

    try {
      const letterToSend = {
        ...newLetterData,
        studentId: user._id, // <-- user._id භාවිත කරන්න
        student: user.name,
        status: 'Submitted',
        currentStageIndex: 0,
        submittedDate: new Date().toISOString().slice(0, 10)
      };

      const response = await fetch('http://localhost:5000/api/letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(letterToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit letter! status: ${response.status}`);
      }

      fetchLetters();
      
      await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id, // <-- user._id භාවිත කරන්න
          message: `New letter request submitted: ${newLetterData.type}`,
          type: 'info',
          timestamp: new Date().toISOString()
        }),
      });
      fetchNotifications();

      setModalOpen(false);
      setMessageModal({ show: true, title: 'Success', message: 'New letter request submitted successfully!', onConfirm: closeMessageModal });

    } catch (error) {
      console.error("Error submitting new letter:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to submit letter: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="dashboard-container">
      <Header user={user} />
      <Sidebar />
      <main className="main-content">
        <section className="top-widgets">
          <ProgressTracker stages={stages} currentStage={currentStage} />
          <Notifications notifications={notifications} />
        </section>

        <section className="bottom-widgets">
          <RecentLetters letters={letters} />
          <div className="new-letter-button-container">
            <button
              className="new-letter-btn"
              onClick={() => setModalOpen(true)}
              aria-label="Submit a New Letter"
            >
              + Submit a New Letter
            </button>
          </div>
        </section>
      </main>
      {modalOpen && <NewLetterModal onClose={() => setModalOpen(false)} onSubmit={addLetter} />}
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

export default SpecialDashboard;
