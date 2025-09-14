import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/components/Notifications.css';

const alertColors = {
  success: '#d4edda',
  error: '#f8d7da',
  info: '#d1ecf1',
  warning: '#fff3cd'
};

const alertTextColors = {
  success: '#155724',
  error: '#721c24',
  info: '#0c5460',
  warning: '#856404'
};

const NotificationsWidget = ({ notifications, onNotificationUpdate }) => {
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Update recent notifications when notifications prop changes
  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setRecentNotifications([]);
      return;
    }

    // Sort notifications by timestamp in descending order and take first 5
    const sorted = [...notifications].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const timeB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return timeB - timeA;
    });

    setRecentNotifications(sorted.slice(0, 5));
  }, [notifications]);

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Refresh notifications after marking as read
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Check if there are any unread notifications
  const hasUnreadNotifications = notifications.some(notification => !notification.read);

  return (
    <div className="notifications-widget">
      <h2>Recent Notifications</h2>
      {notifications.length === 0 ? (
        <p className="no-notifications">No notifications</p>
      ) : (
        <ul className="notifications-list">
          {recentNotifications.map((notification) => (
            <li
              key={notification._id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              style={{
                backgroundColor: alertColors[notification.type] || '#eee',
                color: alertTextColors[notification.type] || '#333'
              }}
              onClick={() => !notification.read && markAsRead(notification._id)}
            >
              <div className="notification-content">
                {!notification.read && <span className="unread-dot"></span>}
                {notification.message}
                {notification.createdAt && (
                  <div className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {hasUnreadNotifications && (
        <div className="notifications-summary">
          <p>
            {notifications.filter(n => !n.read).length} unread notifications • 
            <Link to="/notifications"> View all</Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsWidget;