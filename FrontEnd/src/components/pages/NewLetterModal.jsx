import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import '../../styles/pages/NewLetterModal.css';

const letterTypes = [
  "Medical Certificate", // Keep Medical Certificate as an option
  "Leave Request",
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
    // If "Medical Certificate" is selected, navigate to the excuse request form page
    if (formData.type === "Medical Certificate") {
      onClose(); // Close the current NewLetterModal
      navigate('/excuse-request'); // Navigate to the ExcuseRequestForm page
    } else {
      // Otherwise, proceed with submitting a regular letter
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

          {/* Reason, Date, and Attachments fields are shown only if not Medical Certificate */}
          {formData.type !== "Medical Certificate" && (
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
                  required // Attachments are required for regular letters
                />
              </label>
            </>
          )}
           {/* If Medical Certificate is selected, show a message instead of the other fields */}
           {formData.type === "Medical Certificate" && (
            <p className="medical-cert-note">
              Please click "Submit" to proceed to the Medical Excuse Request Form.
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
