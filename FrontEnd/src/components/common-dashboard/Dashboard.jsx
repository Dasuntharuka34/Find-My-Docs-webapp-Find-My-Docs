import React, { useState, useEffect, useContext } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
// import ProgressTracker from './ProgressTracker';
import RecentLetters from './RecentLetters';
import Notifications from './Notifications';
import NewLetterModal from './NewLetterModal';
import Footer from './Footer';
import ExcuseRequestForm from '../forms/ExcuseRequestForm'; // Import ExcuseRequestForm
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

// --- NEW STAGE DEFINITIONS FOR SEQUENTIAL APPROVAL ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  { name: "Rejected", approverRole: null }
];

const submitterRoleToInitialStageIndex = {
  "Student": 0,
  "Lecturer": 1,
  "HOD": 2,
  "Dean": 3,
  "VC": 4
};
// --- END NEW STAGE DEFINITIONS ---


function Dashboard() {
  const { user } = useContext(AuthContext);
  
  const [currentStage, setCurrentStage] = useState(0);
  const [letters, setLetters] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false); // For NewLetterModal
  const [showExcuseRequestModal, setShowExcuseRequestModal] = useState(false); // For ExcuseRequestForm

  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const fetchLetters = async () => {
    if (!user || !user._id) return;

    try {
      const response = await fetch(`http://localhost:5000/api/letters/byUser/${user._id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLetters(data);

      if (data.length > 0) {
        const latestLetter = data.reduce((prev, current) => 
          (prev.currentStageIndex > current.currentStageIndex) ? prev : current
        );
        setCurrentStage(Math.min(latestLetter.currentStageIndex || 0, approvalStages.length - 1));
      } else {
        setCurrentStage(0);
      }

    } catch (error) {
      console.error("Error fetching letters:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to load letters: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  const fetchNotifications = async () => {
    if (!user || !user._id) return;

    try {
      const response = await fetch(`http://localhost:5000/api/notifications/byUser/${user._id}`);
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
    if (user && user._id) {
      fetchLetters();
      fetchNotifications();
    }
  }, [user]);

  // Handle new letter submit (for non-Medical Certificate letters)
  const addLetter = async (newLetterData) => {
    if (!user || !user._id || !user.name || !user.role) {
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated or role missing. Please log in again.', onConfirm: closeMessageModal });
      return;
    }

    // Determine initial stage based on submitter's role
    const initialStageIndex = submitterRoleToInitialStageIndex[user.role] || 0;
    const initialStatus = approvalStages[initialStageIndex].name;

    try {
      const formData = new FormData();
      formData.append('type', newLetterData.type);
      formData.append('reason', newLetterData.reason);
      formData.append('date', newLetterData.date);
      formData.append('studentId', user._id);
      formData.append('student', user.name);
      formData.append('submitterRole', user.role);
      formData.append('status', initialStatus);
      formData.append('currentStageIndex', initialStageIndex);
      formData.append('submittedDate', new Date().toISOString().slice(0, 10));

      if (newLetterData.attachments) {
        formData.append('attachments', newLetterData.attachments);
      }

      const response = await fetch('http://localhost:5000/api/letters', {
        method: 'POST',
        body: formData,
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
          userId: user._id,
          message: `New letter request submitted: ${newLetterData.type} and sent for ${approvalStages[initialStageIndex + 1]?.name || 'final approval'}.`,
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

  // Function to open Excuse Request Modal
  const openExcuseRequestFormModal = () => {
    setShowExcuseRequestModal(true);
  };

  // Function to close Excuse Request Modal (and refresh data if needed)
  const closeExcuseRequestFormModal = () => {
    setShowExcuseRequestModal(false);
    fetchLetters(); // Refresh letters, as excuse requests are now "documents" that might appear
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
          {/* <ProgressTracker stages={approvalStages.map(s => s.name)} currentStage={currentStage} /> */}
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
      {modalOpen && <NewLetterModal onClose={() => setModalOpen(false)} onSubmit={addLetter} onOpenExcuseRequestForm={openExcuseRequestFormModal} />}
      {showExcuseRequestModal && <ExcuseRequestForm onClose={closeExcuseRequestFormModal} />}
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

export default Dashboard;
