import React from 'react';
import '../styles/components/Notifications.css';

const alertColors = {
  success: '#d4edda',
  error: '#f8d7da',
  info: '#d1ecf1'
};

const alertTextColors = {
  success: '#155724',
  error: '#721c24',
  info: '#0c5460'
};

function Notifications({ notifications }) {
  return (
    <div className="notifications-panel">
      <h2>Notifications</h2>
      {notifications.length === 0 && <p>No notifications</p>}
      <ul>
        {notifications.map(({ _id, message, type }) => ( // Use _id for MongoDB documents
          <li
            key={_id} // <-- මෙහි _id එක key prop එක ලෙස එකතු කර ඇත.
            className="notification-item"
            style={{
              backgroundColor: alertColors[type] || '#eee',
              color: alertTextColors[type] || '#333'
            }}
          >
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
