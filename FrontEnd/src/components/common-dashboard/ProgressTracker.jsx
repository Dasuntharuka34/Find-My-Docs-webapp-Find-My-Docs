import React from 'react';
import '../../styles/common-dashboard/ProgressTracker.css';

function ProgressTracker({ stages, currentStage }) {
  return (
    <div className="progress-tracker">
      <h2>Letter Status Progress</h2>
      <div className="steps-container">
        {stages.map((stage, idx) => {
          const isActive = idx === currentStage;
          const isCompleted = idx < currentStage;
          return (
            <div key={stage} className={`step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
              <div className="step-circle">{idx + 1}</div>
              <div className="step-label">{stage}</div>
              {idx !== stages.length - 1 && <div className="step-line"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressTracker;
