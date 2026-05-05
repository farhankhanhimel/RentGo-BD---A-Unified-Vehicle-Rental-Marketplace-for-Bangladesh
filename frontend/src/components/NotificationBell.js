import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import { connectSocket, getSocket } from '../utils/socket';
import './NotificationBell.css';

const NotificationBell = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      return undefined;
    }

    const socket = connectSocket({ role: user.role, userId: user._id });

    const onNewNotification = (incoming) => {
      const normalized = {
        _id: incoming.id || incoming._id,
        title: incoming.title,
        message: incoming.message || incoming.body,
        type: incoming.type || 'general',
        isRead: Boolean(incoming.isRead),
        createdAt: incoming.createdAt || new Date().toISOString(),
        actionUrl: incoming?.metadata?.actionUrl || incoming.actionUrl || '',
      };

      setNotifications((prev) => [normalized, ...prev.filter((n) => n._id !== normalized._id)].slice(0, 10));
      setUnreadCount((prev) => prev + (normalized.isRead ? 0 : 1));
    };

    const legacyToNotification = (eventName) => (payload = {}) => {
      const eventMap = {
        new_booking_request: { type: 'booking_updated', title: 'New booking request' },
        booking_approved: { type: 'booking_confirmed', title: 'Booking approved' },
        booking_declined: { type: 'booking_cancelled', title: 'Booking declined' },
        booking_paid: { type: 'payment_success', title: 'Payment successful' },
        booking_status_updated: { type: 'booking_updated', title: 'Trip status updated' },
        booking_cancelled: { type: 'booking_cancelled', title: 'Booking cancelled' },
        'vendor:verification': { type: 'verification_approved', title: 'Vendor verification update' },
      };

      const mapped = eventMap[eventName] || { type: 'general', title: 'Platform update' };
      onNewNotification({
        id: `${eventName}-${Date.now()}`,
        type: mapped.type,
        title: payload.title || mapped.title,
        message: payload.message || payload.note || 'You have a new update.',
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    };

    const legacyEvents = [
      'new_booking_request',
      'booking_approved',
      'booking_declined',
      'booking_paid',
      'booking_status_updated',
      'booking_cancelled',
      'vendor:verification',
    ];

    socket.on('notification:new', onNewNotification);
    legacyEvents.forEach((eventName) => socket.on(eventName, legacyToNotification(eventName)));

    return () => {
      getSocket().off('notification:new', onNewNotification);
      legacyEvents.forEach((eventName) => getSocket().off(eventName));
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      // Silently fail
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(1, 10);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification._id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'price_drop': return '💰';
      case 'vehicle_available': return '🚗';
      case 'booking_confirmed': return '✅';
      case 'booking_cancelled': return '❌';
      case 'booking_updated': return '📋';
      case 'verification_approved': return '🏆';
      case 'verification_rejected': return '⚠️';
      case 'coupon_available': return '🎟️';
      case 'payment_success': return '💳';
      case 'new_review': return '⭐';
      default: return '🔔';
    }
  };

  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button className="notification-bell-btn" onClick={toggleDropdown}>
        <svg
          className="bell-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span>🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="notification-type-icon">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && <span className="unread-dot" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button onClick={() => { navigate('/notifications'); setIsOpen(false); }}>
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
