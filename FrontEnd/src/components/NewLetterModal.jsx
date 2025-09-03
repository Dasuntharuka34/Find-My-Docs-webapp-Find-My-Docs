import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import '../styles/components/NewLetterModal.css';

const letterTypes = [
  "Medical Certificate",
  "Leave Request", // Added "Leave Request" as an option
  "Transcript Request",
  "Internship Letter",
  "Other"
];

function NewLetterModal({ onClose, onSubmit }) {
  const navigate = useNavigate(); 

  const [formData, setFormData] = useState({
    type: letterTypes[0],
    reason: '',
    date: '',
    attachments: null
   });

   const handleChange = e => {
     const { name, value, files } = e.target;
     if (name === 'attachments') {
       setFormData(prev => ({ ...prev, attachments: files[0] }));
     } else {
       setFormData(prev => ({ ...prev, [name]: value }));
     }
  };

   const handleSubmit = e => {
    e.preventDefault();
    if (formData.type === "Medical Certificate") {
      onClose(); 
      navigate('/excuse-request'); 
    } else if (formData.type === "Leave Request") { // Added condition for Leave Request
      onClose();
      navigate('/leave-request'); // Navigate to the LeaveRequestForm page
    } else {
      onSubmit({
        type: formData.type,
        reason: formData.reason,
        date: formData.date,
        attachments: formData.attachments
      });
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div className="modal">
        <h2 id="modalTitle">New Letter Request</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Letter Type
            <select name="type" value={formData.type} onChange={handleChange} required>
              {letterTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          {/* The following fields are now conditionally rendered based on selected type */}
          {formData.type !== "Medical Certificate" && formData.type !== "Leave Request" && (
            <>
              <label>
                Reason
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Attachments
                <input
                  type="file"
                  name="attachments"
                  accept=".pdf,.jpg,.png,.doc,.docx"
                  onChange={handleChange}
                  required
                />
              </label>
            </>
          )}

          {/* New message for Medical Certificate and Leave Request types */}
          {(formData.type === "Medical Certificate" || formData.type === "Leave Request") && (
            <p className="form-note">
              Please click "Next" to proceed to the specific {formData.type} Form.
            </p>
          )}

          <div className="modal-actions">
            <button type="submit" className="submit-btn">Next</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewLetterModal;
