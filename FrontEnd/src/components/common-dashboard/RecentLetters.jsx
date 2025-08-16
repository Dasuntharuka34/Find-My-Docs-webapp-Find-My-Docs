import React from 'react';
import '../../styles/common-dashboard/RecentLetters.css';

const statusColors = {
  Pending: '#f0ad4e',
  "In Review": '#5bc0de',
  Approved: '#5cb85c',
  Rejected: '#d9534f',
  Submitted: '#808080',
  "Checked by Staff": '#5bc0de',
  "Lecturer Approval": '#5bc0de',
  "HOD": '#5bc0de',
  "Dean": '#5bc0de',
  "VC": '#5bc0de'
};

function RecentLetters({ letters }) {
  return (
    <div className="recent-letters">
      <h2>Recent Letter Requests</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {letters.map(({ _id, type, status, lastUpdated }) => ( // Use _id for MongoDB documents
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentLetters;
