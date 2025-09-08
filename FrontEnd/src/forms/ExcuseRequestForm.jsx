import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/forms/ExcuseRequestForm.css';

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
            <button onClick={() => { }} className="submit-btn">
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ExcuseRequestForm = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    regNo: user?.indexNumber || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    address: '',
    levelOfStudy: '',
    subjectCombo: '',
    absences: [{ courseCode: '', date: '' }],
    reason: '',
    reasonDetails: '',
    lectureAbsents: '',
  });

  const [medicalForm, setMedicalForm] = useState(null);
  const [medicalFormError, setMedicalFormError] = useState('');
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setFormData({ ...formData, absences: [...formData.absences, { courseCode: '', date: '' }] });
  };

  const removeAbsenceRow = (index) => {
    const updated = formData.absences.filter((_, i) => i !== index);
    setFormData({ ...formData, absences: updated });
  };

  const handleMedicalFormUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setMedicalFormError('Please upload a valid file (JPEG, PNG, PDF)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setMedicalFormError('File size must be less than 10MB');
        return;
      }
    }
    setMedicalForm(file);
    setMedicalFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user || !user._id || !user.name || !user.role) {
      setMessageModal({ show: true, title: 'Error', message: 'User not authenticated or role missing. Please log in again.', onConfirm: closeMessageModal });
      setIsSubmitting(false);
      return;
    }

    // Validation
    if (!formData.name.trim() || !formData.regNo.trim() || !formData.reason.trim()) {
      setMessageModal({ show: true, title: 'Validation Error', message: 'Please fill in all the required fields.', onConfirm: closeMessageModal });
      setIsSubmitting(false);
      return;
    }

    if (formData.absences.some(item => !item.courseCode.trim() || !item.date)) {
      setMessageModal({ show: true, title: 'Validation Error', message: 'Please fill in all course codes and dates.', onConfirm: closeMessageModal });
      setIsSubmitting(false);
      return;
    }

    if (formData.reason === 'illness' && !medicalForm) {
      setMessageModal({ show: true, title: 'Validation Error', message: 'Medical form is required for illness reason.', onConfirm: closeMessageModal });
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'absences') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (medicalForm) {
        formDataToSend.append('medicalForm', medicalForm);
      }
      
      formDataToSend.append('studentId', user._id);
      formDataToSend.append('studentName', user.name);
      formDataToSend.append('studentRole', user.role);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/excuserequests`, {
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
        message: 'Excuse request submitted successfully!',
        onConfirm: () => {
          closeMessageModal();
          setFormData({
            name: user?.name || '',
            regNo: user?.indexNumber || '',
            mobile: user?.mobile || '',
            email: user?.email || '',
            address: '',
            levelOfStudy: '',
            subjectCombo: '',
            absences: [{ courseCode: '', date: '' }],
            reason: '',
            reasonDetails: '',
            lectureAbsents: '',
          });
          setMedicalForm(null);
          navigate('/my-letters');
        },
      });

    } catch (error) {
      console.error("Error submitting excuse request:", error);
      setMessageModal({ 
        show: true, 
        title: 'Error', 
        message: `Failed to submit request: ${error.message}`, 
        onConfirm: closeMessageModal 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="excuse-form-container">
      <h2 className="form-title">Faculty of Science - University of Jaffna</h2>
      <p className="form-subtitle">Application to Excuse Academic Absence</p>

      <form onSubmit={handleSubmit} className="form-grid">
        {/* Personal Information */}
        <div className="form-group">
          <label>Name with Initials *</label>
          <input 
            name="name" 
            value={formData.name} 
            onChange={(e) => handleChange(e)} 
            placeholder="Enter your full name" 
            required 
          />
        </div>

        <div className="form-group">
          <label>Registration Number *</label>
          <input 
            name="regNo" 
            value={formData.regNo} 
            onChange={(e) => handleChange(e)} 
            placeholder="Enter registration number" 
            required 
          />
        </div>

        <div className="form-group">
          <label>Mobile Number</label>
          <input 
            name="mobile" 
            value={formData.mobile} 
            onChange={(e) => handleChange(e)} 
            placeholder="Enter mobile number" 
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input 
            name="email" 
            type="email"
            value={formData.email} 
            onChange={(e) => handleChange(e)} 
            placeholder="Enter email address" 
          />
        </div>

        <div className="form-group form-group-full">
          <label>Postal Address</label>
          <textarea 
            name="address" 
            value={formData.address} 
            onChange={(e) => handleChange(e)} 
            placeholder="Enter your complete postal address" 
            rows="3"
          />
        </div>

        {/* Academic Information */}
        <div className="form-group">
          <label>Level of Study</label>
          <select name="levelOfStudy" value={formData.levelOfStudy} onChange={(e) => handleChange(e)}>
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

        <div className="form-group">
          <label>Subject Combination</label>
          <input 
            name="subjectCombo" 
            value={formData.subjectCombo} 
            onChange={(e) => handleChange(e)} 
            placeholder="Enter subject combination" 
          />
        </div>

        {/* Absence Section */}
        <div className="absence-section form-group-full">
          <h3>Period of Absence *</h3>
          {formData.absences.map((item, index) => (
            <div key={index} className="absence-item">
              <div className="form-group">
                <label>Course Code</label>
                <input
                  name="absence_courseCode"
                  value={item.courseCode}
                  onChange={(e) => handleChange(e, index)}
                  placeholder="Enter course code"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  name="absence_date"
                  type="date"
                  value={item.date}
                  onChange={(e) => handleChange(e, index)}
                  required
                />
              </div>
              {formData.absences.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeAbsenceRow(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addAbsenceRow} className="add-btn">
            + Add Another Course
          </button>
        </div>

        {/* Reason Section */}
        <div className="form-group form-group-full">
          <label>Reason for Absence *</label>
          <select name="reason" value={formData.reason} onChange={(e) => handleChange(e)} required>
            <option value="">-- Select Reason --</option>
            <option value="official">Official university assignment</option>
            <option value="wedding">Applicant's wedding</option>
            <option value="illness">Sudden illness or hospitalization</option>
            <option value="death">Demise of a parent/guardian/sibling</option>
          </select>
        </div>

        <div className="form-group form-group-full">
          <label>Details of Reason</label>
          <textarea 
            name="reasonDetails" 
            value={formData.reasonDetails} 
            onChange={(e) => handleChange(e)} 
            placeholder="Provide detailed explanation of the reason for absence"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>Lectures/Practicals Missed</label>
          <input 
            name="lectureAbsents" 
            value={formData.lectureAbsents} 
            onChange={(e) => handleChange(e)} 
            placeholder="Number of lectures/practicals missed" 
          />
        </div>

        {/* File Upload - Corrected */}
        <div className="file-upload form-group-full">
          <label htmlFor="medical-form-upload">Medical Form {formData.reason === 'illness' && '*'}</label>
          <div className="file-upload-label">
            <input 
              id="medical-form-upload"
              type="file" 
              className="file-upload-input"
              onChange={handleMedicalFormUpload} 
              accept=".jpg,.jpeg,.png,.pdf"
            />
          </div>
          {medicalFormError && <span className="error-message">{medicalFormError}</span>}
        </div>

        <div className="submit-btn-container">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>

      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={messageModal.onConfirm}
        onCancel={messageModal.onCancel}
      />
    </div>
  );
};

export default ExcuseRequestForm;