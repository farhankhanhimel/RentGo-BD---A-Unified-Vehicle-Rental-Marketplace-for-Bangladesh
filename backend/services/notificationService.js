const Notification = require('../models/Notification');
const { emitToRoom, emitToVendor, emitToCustomer, emitToAdmins } = require('./socketService');

const createNotification = async (userId, type, title, body, metadata = {}) => {
  try {
    const notif = await Notification.create({ user: userId, type, title, body, metadata, read: false });

    // Emit to the user's personal room
    emitToRoom(`user:${userId}`, 'notification:new', {
      id: notif._id,
      type,
      title,
      body,
      metadata,
      createdAt: notif.createdAt,
    });

    // Also emit to role-specific rooms for common types
    if (type === 'new_booking' && metadata.vendorId) {
      emitToVendor(metadata.vendorId, 'notification:new', { id: notif._id, type, title, body, metadata, createdAt: notif.createdAt });
    }

    if (type === 'payment_success' && metadata.customerId) {
      emitToCustomer(metadata.customerId, 'notification:new', { id: notif._id, type, title, body, metadata, createdAt: notif.createdAt });
    }

    if (type === 'emergency' || type === 'admin_alert') {
      emitToAdmins('notification:new', { id: notif._id, type, title, body, metadata, createdAt: notif.createdAt });
    }

    return notif;
  } catch (err) {
    console.error('createNotification error', err.message);
    return null;
  }
};

const markRead = async (notificationId, userId) => {
  const notif = await Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true }, { new: true });
  return notif;
};

const listForUser = async (userId, limit = 50) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(Number(limit));
};

module.exports = { createNotification, markRead, listForUser };
