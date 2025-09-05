import React from 'react';
import '../styles/components/ProgressTracker.css';

function ProgressTracker({ stages, currentStage, isRejected = false }) {
  return (
    <div className="progress-tracker">
      <h2>Request Status Progress</h2>
      <div className="steps-container">
        {stages.map((stageName, idx) => {
          const isActive = idx === currentStage;
          const isCompleted = idx < currentStage;
          const isRejectedStage = isRejected && stageName === "Rejected";
          
          return (
            <div 
              key={idx} 
              className={`step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isRejectedStage ? 'rejected' : ''}`}
            >
              <div className="step-circle">{idx + 1}</div>
              <div className="step-label">{stageName}</div>
              {idx !== stages.length - 1 && <div className="step-line"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressTracker;