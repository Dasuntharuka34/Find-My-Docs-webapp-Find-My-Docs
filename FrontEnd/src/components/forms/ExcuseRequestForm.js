import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/forms/ExcuseRequestForm.css';
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


const ExcuseRequestForm = () => {
  const { user } = useContext(AuthContext); // AuthContext එකෙන් user object එක ලබා ගන්න
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    regNo: '',
    mobile: '',
    email: '',
    address: '',
    levelOfStudy: '',
    subjectCombo: '',
    absences: [{ courseCode: '', date: '' }],
    reason: '',
    reasonDetails: '',
    lectureAbsents: '',
    date: '',
  });

  const [medicalForm, setMedicalForm] = useState(null);
  const [medicalFormError, setMedicalFormError] = useState('');

  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    if (name.startsWith('absence_')) {
      const updatedAbsences = [...formData.absences];
      const field = name.split('_')[1];
      updatedAbsences[index][field] = value;
      setFormData({ ...formData, absences: updatedAbsences });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addAbsenceRow = () => {
    setFormData({
      ...formData,
      absences: [...formData.absences, { courseCode: '', date: '' }],
    });
  };

  const handleMedicalFormUpload = (e) => {
    const file = e.target.files[0];
    setMedicalForm(file);
    setMedicalFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user._id || !user.name || !user.role) { // Ensure user is authenticated and has role
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated or role missing. Please log in again.', onConfirm: closeMessageModal });
      return;
    }

    if (formData.name.trim() === '' || formData.regNo.trim() === '' || formData.reason.trim() === '') {
      setMessageModal({ show: true, title: 'Validation Error', message: 'Please fill in all required fields (Name, Registration Number, Reason).', onConfirm: closeMessageModal });
      return;
    }

    try {
      const formDataToSend = new FormData();
      // Append all form data fields
      for (const key in formData) {
        if (key === 'absences') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      }
      // Append medical form file
      if (medicalForm) {
        formDataToSend.append('medicalForm', medicalForm);
      }
      // Append studentId, studentName, and studentRole from authenticated user
      formDataToSend.append('studentId', user._id);
      formDataToSend.append('studentName', user.name);
      formDataToSend.append('studentRole', user.role); // Pass user's role for initial stage calculation

      // Submit to the excuse-requests API endpoint, which now handles creating the Letter
      const response = await fetch('http://localhost:5000/api/excuse-requests', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setMessageModal({ show: true, title: 'Success', message: 'Medical Certificate submitted successfully!', onConfirm: () => {
        closeMessageModal();
        // Reset form after successful submission
        setFormData({
          name: '', regNo: '', mobile: '', email: '', address: '',
          levelOfStudy: '', subjectCombo: '', absences: [{ courseCode: '', date: '' }],
          reason: '', reasonDetails: '', lectureAbsents: '', date: '',
        });
        setMedicalForm(null);
        // Navigate to My Letters page after successful submission
        navigate('/my-letters'); 
      }});

    } catch (error) {
      console.error("Error submitting excuse request:", error);
      setMessageModal({ show: true, title: 'Error', message: `Failed to submit request: ${error.message}`, onConfirm: closeMessageModal });
    }
  };

  if (!user) {
    return <p style={{textAlign: 'center', marginTop: '50px', fontSize: '1.5rem'}}>Loading user data...</p>;
  }

  return (
    <div className="excuse-form-page-container">
      <form className="form-container" onSubmit={handleSubmit}>
        <h2 className="form-title">Faculty of Science - University of Jaffna</h2>
        <p className="form-subtitle">Application to Excuse Academic Absence</p>

        <div className="form-row">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Name with initials" required />
          <input name="regNo" value={formData.regNo} onChange={handleChange} placeholder="Registration Number" required />
        </div>

        <div className="form-row">
          <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile Number" />
          <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" />
        </div>

        <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Postal Address" />

        <div className="form-row">
          <select name="levelOfStudy" value={formData.levelOfStudy} onChange={handleChange}>
                <option value="">-- Select Level of Study --</option>
                <option value="1G">1G</option>
                <option value="1S">1S</option>
                <option value="2G">2G</option>
                <option value="2S">2S</option>
                <option value="3G">3G</option>
                <option value="3S">3S</option>
                <option value="3M">3M</option>
                <option value="4S">4S</option>
                <option value="4M">4M</option>
                <option value="4X">4X</option>
              </select>
        </div>

        <div className="form-row">
          <input name="subjectCombo" value={formData.subjectCombo} onChange={handleChange} placeholder="Subject Combination or Specialisation" />
        </div>

        <div className="absence-section">
          <label>Period of Absence:</label>
          {formData.absences.map((item, index) => (
            <div key={index} className="form-row">
              <input
                name="absence_courseCode"
                value={item.courseCode}
                onChange={(e) => handleChange(e, index)}
                placeholder="Course Code"
              />
              <input
                name="absence_date"
                value={item.date}
                onChange={(e) => handleChange(e, index)}
                placeholder="Date(s)"
              />
              {formData.absences.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => {
                    const updated = formData.absences.filter((_, i) => i !== index);
                    setFormData({ ...formData, absences: updated });
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addAbsenceRow} className="add-btn">
            + Add Course
          </button>
        </div>

        <div className="form-group">
          <label>Reason for Absence:</label>
          <select name="reason" value={formData.reason} onChange={handleChange} required>
            <option value="">-- Select Reason --</option>
            <option value="official">Official university assignment</option>
            <option value="wedding">Applicant’s wedding</option>
            <option value="illness">Sudden illness or hospitalization</option>
            <option value="death">Demise of a parent/guardian/sibling</option>
          </select>
          <textarea name="reasonDetails" value={formData.reasonDetails} onChange={handleChange} placeholder="Details of Reason" />
        </div>

        <input name="lectureAbsents" value={formData.lectureAbsents} onChange={handleChange} placeholder="No. of lectures/practicals missed" />

        <input name="date" type="date" value={formData.date} onChange={handleChange} />

        <div className="form-group">
          <label>Upload Medical Form:</label>
          <input type="file" onChange={handleMedicalFormUpload} />
          {medicalFormError && <p className="error-message">{medicalFormError}</p>}
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

export default ExcuseRequestForm;
