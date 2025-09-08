// MessageModal.js
import React from 'react';
// import '../styles/components/MessageModal.css';

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
            <button onClick={onConfirm || onCancel} className="submit-btn">
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageModal;