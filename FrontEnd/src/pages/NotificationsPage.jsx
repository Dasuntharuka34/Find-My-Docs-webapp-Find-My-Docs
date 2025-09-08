import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/NotificationsPage.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Define these constants at the top of the file
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

const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!user || !user._id) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/byUser/${user._id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || !user._id) return;
    
    try {
      // Get all unread notifications
      const unreadNotifications = notifications.filter(notification => !notification.read);
      
      // Mark each unread notification as read
      const markPromises = unreadNotifications.map(notification => 
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/${notification._id}/read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      // Wait for all requests to complete
      await Promise.all(markPromises);
      
      // Refresh notifications after marking all as read
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete a single notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Refresh notifications after deletion
      fetchNotifications();
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (!user || !user._id) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/byUser/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }

      // Refresh notifications after deletion
      fetchNotifications();
      setShowDeleteAllConfirm(false);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  // Confirm delete for a single notification
  const confirmDelete = (notification) => {
    setNotificationToDelete(notification);
    setShowDeleteConfirm(true);
  };

  // Confirm delete all notifications
  const confirmDeleteAll = () => {
    setShowDeleteAllConfirm(true);
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setShowDeleteAllConfirm(false);
    setNotificationToDelete(null);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  if (isLoading) {
    return (
      <div className="notifications-page-container">
        <Header user={user}/>
        <Sidebar />
        <div className="notifications-page-content">
          <div className="loading">Loading notifications...</div>
        </div>
        <Footer />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page-container">
      <Header user={user}/>
      <Sidebar />
      <div className="notifications-page-content">
        <div className="page-header">
          <h1>Notifications</h1>
          <div className="notification-actions">
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                Mark All as Read
              </button>
            )}
            {notifications.length > 0 && (
              <button className="delete-all-btn" onClick={confirmDeleteAll}>
                Delete All
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <p className="no-notifications">No notifications</p>
        ) : (
          <div className="notifications-container">
            <div className="notifications-summary">
              <p>You have {notifications.length} notifications ({unreadCount} unread)</p>
            </div>
            
            <ul className="notifications-list">
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  style={{
                    backgroundColor: alertColors[notification.type] || '#eee',
                    color: alertTextColors[notification.type] || '#333'
                  }}
                >
                  <div 
                    className="notification-content"
                    onClick={() => !notification.read && markAsRead(notification._id)}
                  >
                    {!notification.read && <span className="unread-dot"></span>}
                    <div className="notification-message">{notification.message}</div>
                    {notification.createdAt && (
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button 
                    className="delete-notification-btn"
                    onClick={() => confirmDelete(notification)}
                    title="Delete notification"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Footer />

      {/* Delete Single Notification Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Notification</h3>
            <p>Are you sure you want to delete this notification?</p>
            <div className="modal-actions">
              <button 
                className="confirm-delete-btn"
                onClick={() => deleteNotification(notificationToDelete._id)}
              >
                Yes, Delete
              </button>
              <button 
                className="cancel-delete-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Notifications Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete All Notifications</h3>
            <p>Are you sure you want to delete all {notifications.length} notifications? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="confirm-delete-all-btn"
                onClick={deleteAllNotifications}
              >
                Yes, Delete All
              </button>
              <button 
                className="cancel-delete-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;