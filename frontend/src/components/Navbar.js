import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../utils/socket';
import { getNotifications, markRead } from '../services/notificationService';

const Navbar = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    if (!user?._id) return;
    try {
      const notifs = await getNotifications();
      setNotifications(notifs || []);
      setUnreadCount((notifs || []).filter((n) => !n.read).length);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return undefined;
    const socket = connectSocket({ role: user.role || 'user', userId: user._id });
    const handleNotif = (payload) => {
      setNotifications((prev) => [payload, ...prev]);
      setUnreadCount((c) => c + 1);
    };
    socket.on('notification:new', handleNotif);
    return () => {
      socket.off('notification:new', handleNotif);
    };
  }, [user?._id]);

  const openMenu = () => {
    setOpen((s) => !s);
    if (!open) {
      // mark all visible as read when opening
      notifications.slice(0, 10).forEach(async (n) => {
        if (!n.read) {
          try {
            await markRead(n._id);
          } catch (e) {}
        }
      });
      setNotifications((prev) => prev.map((n, i) => (i < 10 ? { ...n, read: true } : n)));
      setUnreadCount(0);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="logo">
            RentGo
          </Link>
          <ul className="nav-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/rentals">Rentals</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </li>
            <li className="nav-notification">
              <button className="notif-btn" onClick={openMenu} aria-label="Notifications">
                🔔
                {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
              </button>
              {open && (
                <div className="notif-dropdown">
                  {notifications.length === 0 ? (
                    <div className="empty-state">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n._id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-body">{n.body}</div>
                        <div className="notif-meta">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
