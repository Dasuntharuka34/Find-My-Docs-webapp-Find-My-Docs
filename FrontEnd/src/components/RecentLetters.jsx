import React from 'react';
import { Link } from 'react-router-dom'; 
import '../styles/components/RecentLetters.css';

// --- APPROVAL STAGE DEFINITIONS (MUST BE CONSISTENT ACROSS ALL RELEVANT FILES) ---
// Dashboard, SpecialDashboard, PendingApprovals, ProgressTracker, DocumentsView, MyLettersPage, letterController.js
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
// --- END APPROVAL STAGE DEFINITIONS ---

const statusColors = {
  [approvalStages[0].name]: '#808080', // Submitted (Grey)
  [approvalStages[1].name]: '#5bc0de', // Pending Staff Approval (Info Blue)
  [approvalStages[2].name]: '#5bc0de', // Pending Lecturer Approval (Info Blue)
  [approvalStages[3].name]: '#5bc0de', // Pending HOD Approval (Info Blue)
  [approvalStages[4].name]: '#5bc0de', // Pending Dean Approval (Info Blue)
  [approvalStages[5].name]: '#5bc0de', // Pending VC Approval (Info Blue)
  [approvalStages[6].name]: '#5cb85c', // Approved (Success Green)
  [approvalStages[7].name]: '#d9534f'  // Rejected (Danger Red)
};

function RecentLetters({ letters }) {
  return (
    <div className="recent-letters">
      <h2>Recent Letter Requests</h2>
      {letters.length === 0 ? (
        <p>No recent letters to display.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <td>ID</td>
              <td>Type</td>
              <td>Status</td>
              <td>Last Updated</td>
              <td>Action</td> {/* <-- New table header for the button */}
            </tr>
          </thead>
          <tbody>
            {letters.map(({ _id, type, status, lastUpdated }) => (
              <tr key={_id}>
                <td>{_id}</td>
                <td>{type}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: statusColors[status] || '#777' }}
                  >
                    {status}
                  </span>
                </td>
                <td>{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <Link
                    to={`/documents/${_id}`} // <-- Link to the DocumentsView page
                    className="view-details-btn"
                    style={{ /* Inline styles for the button, you can move this to CSS */
                        backgroundColor: '#007bff', /* Example blue */
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '5px',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease'
                    }}
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RecentLetters;
