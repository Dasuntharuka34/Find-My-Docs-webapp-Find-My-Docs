import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/forms/LeaveRequestForm.css';
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


const LeaveRequestForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    reasonDetails: '', // Added a new field for detailed reason
    contactDuringLeave: '',
    remarks: '',
  });

  const [leaveForm, setLeaveForm] = useState(null); // State for the uploaded file
  const [leaveFormError, setLeaveFormError] = useState('');

  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLeaveFormUpload = (e) => {
    const file = e.target.files[0];
    setLeaveForm(file);
    setLeaveFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user._id || !user.name || !user.role) {
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated or role missing. Please log in again.', onConfirm: closeMessageModal });
      return;
    }

    // --- UPDATED FRONTEND VALIDATION ---
    if (!formData.startDate.trim() || !formData.endDate.trim() || !formData.reason.trim() || !formData.reasonDetails.trim()) {
      setMessageModal({ show: true, title: 'Validation Error', message: 'Please fill in all the required fields.', onConfirm: closeMessageModal });
      return;
    }

    // You can add logic to require an attachment for certain leave reasons
    // For example, if the reason is 'illness', require a file
    if (formData.reason === 'illness' && !leaveForm) {
      setMessageModal({ show: true, title: 'Validation Error', message: 'Medical form is required for illness reason.', onConfirm: closeMessageModal });
      return;
    }
    // --- END UPDATED FRONTEND VALIDATION ---


    try {
      const formDataToSend = new FormData();
      
      // Append all form data fields
      // NOTE: This now correctly iterates over the state to append all fields
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }
      
      // Append leave form file
      if (leaveForm) {
        formDataToSend.append('leaveForm', leaveForm);
      }
      
      // Append user details from AuthContext
      formDataToSend.append('requesterId', user._id);
      formDataToSend.append('requesterName', user.name);
      formDataToSend.append('requesterRole', user.role);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/leaverequests`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setMessageModal({
        show: true,
        title: 'Success',
        message: 'Leave request submitted successfully!',
        onConfirm: () => {
          closeMessageModal();
          // Reset form after successful submission
          setFormData({
            startDate: '',
            endDate: '',
            reason: '',
            reasonDetails: '',
            contactDuringLeave: '',
            remarks: '',
          });
          setLeaveForm(null); // Reset the file state
          // Navigate to a confirmation or my-requests page
          navigate('/my-letters');
        },
      });

    } catch (error) {
      console.error("Error submitting leave request:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to submit request: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  if (!user) {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading user data...</p>;
  }

  // Role check
  const allowedRoles = ['Lecturer', 'HOD', 'Dean'];
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="unauthorized-container">
        <h2 className="unauthorized-title">Access Denied ⚠️</h2>
        <p className="unauthorized-message">You do not have permission to access this page.</p>
        <p className="unauthorized-message">This form is only for Lecturers, HODs, and Deans.</p>
      </div>
    );
  }

  return (
    <div className="leave-form-page-container">
      <form className="form-container" onSubmit={handleSubmit}>
        <h2 className="form-title">Faculty of Science - University of Jaffna</h2>
        <p className="form-subtitle">Application for Leave</p>

        <p className="form-info">
          Requesting from: <strong>{user.name}</strong> ({user.role})
        </p>

        <div className="form-group date-group">
          <label>Leave Period:</label>
          <div className="form-row">
            <label>Start Date:</label>
            <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>End Date:</label>
            <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Reason for Leave:</label>
          <select name="reason" value={formData.reason} onChange={handleChange} required>
            <option value="">-- Select Reason --</option>
            <option value="official">Official</option>
            <option value="personal">Personal</option>
            <option value="illness">Illness</option>
          </select>
          <textarea name="reasonDetails" value={formData.reasonDetails} onChange={handleChange} placeholder="Details of the reason for leave" required />
        </div>

        <input name="contactDuringLeave" value={formData.contactDuringLeave} onChange={handleChange} placeholder="Contact details during leave" />

        <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Any other remarks" />

        <div className="form-group">
          <label>Upload Supporting Document:</label>
          <input type="file" onChange={handleLeaveFormUpload} />
          {leaveFormError && <p className="error-message">{leaveFormError}</p>}
        </div>

        <button type="submit" className="submit-btn">Submit Application</button>

        <MessageModal
          show={messageModal.show}
          title={messageModal.title}
          message={messageModal.message}
          onConfirm={messageModal.onConfirm}
          onCancel={messageModal.onCancel}
        />
      </form>
    </div>
  );
};

export default LeaveRequestForm;
