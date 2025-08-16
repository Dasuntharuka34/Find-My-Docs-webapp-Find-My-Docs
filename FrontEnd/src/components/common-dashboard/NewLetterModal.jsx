import React, { useState } from 'react';
import '../../styles/common-dashboard/NewLetterModal.css';

const letterTypes = [
  "Medical Certificate",
  "Leave Request",
  "Transcript Request",
  "Internship Letter",
  "Other"
];

function NewLetterModal({ onClose, onSubmit }) {
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
    // Normally form validation here
    // The parent component (Dashboard/SpecialDashboard) will handle the actual API submission
    onSubmit({
      type: formData.type,
      reason: formData.reason,
      date: formData.date,
      attachments: formData.attachments
    });
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
            />
          </label>

          <div className="modal-actions">
            <button type="submit" className="submit-btn">Submit</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewLetterModal;
