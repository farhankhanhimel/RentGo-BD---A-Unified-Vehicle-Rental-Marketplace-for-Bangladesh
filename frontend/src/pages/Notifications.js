import React, { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';
import './InfoPage.css';

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(1, 50);
      setItems(data.notifications || []);
    } catch (error) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id) => {
    await notificationService.markAsRead(id);
    await load();
  };

  const handleDelete = async (id) => {
    await notificationService.deleteNotification(id);
    await load();
  };

  return (
    <div className="info-page container">
      <h1>Notifications</h1>
      <p>Track all booking, payment, and account updates in one place.</p>

      {loading ? (
        <p>Loading notifications...</p>
      ) : items.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <div className="notification-list-page">
          {items.map((n) => (
            <article key={n._id} className={`notification-row ${n.isRead ? '' : 'is-unread'}`}>
              <div>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>
              <div className="notification-row-actions">
                {!n.isRead && <button onClick={() => handleMarkRead(n._id)}>Mark Read</button>}
                <button className="danger" onClick={() => handleDelete(n._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
