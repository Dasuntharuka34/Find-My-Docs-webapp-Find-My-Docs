import React from 'react';
import '../../styles/common-dashboard/ProgressTracker.css';

// --- NEW STAGE DEFINITIONS FOR SEQUENTIAL APPROVAL ---
// This needs to be consistent across Dashboard, SpecialDashboard, PendingApprovals too.
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Staff Approval", approverRole: "Staff" },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  { name: "Rejected", approverRole: null }
];
// --- END NEW STAGE DEFINITIONS ---

function ProgressTracker({ stages, currentStage }) { // stages prop now receives array of names
  return (
    <div className="progress-tracker">
      <h2>Letter Status Progress</h2>
      <div className="steps-container">
        {stages.map((stageName, idx) => { // Iterate through stage names
          const isActive = idx === currentStage;
          const isCompleted = idx < currentStage;
          return (
            <div key={idx} className={`step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
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
