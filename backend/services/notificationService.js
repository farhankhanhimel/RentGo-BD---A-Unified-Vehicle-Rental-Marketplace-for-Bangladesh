const Notification = require('../models/Notification');
const { emitToRoom, emitToVendor, emitToCustomer, emitToAdmins } = require('./socketService');

const TYPE_MAP = {
  vendor_verification: 'booking_updated',
  new_booking: 'booking_updated',
  emergency: 'general',
  admin_alert: 'general',
};

const normalizeType = (type) => TYPE_MAP[type] || type || 'general';

const createNotification = async (userId, type, title, body, metadata = {}) => {
  try {
    const normalizedType = normalizeType(type);
    const notif = await Notification.create({
      user: userId,
      type: normalizedType,
      title,
      message: body,
      actionUrl: metadata.actionUrl || '',
      relatedBooking: metadata.bookingId || undefined,
      relatedVehicle: metadata.vehicleId || undefined,
      isRead: false,
    });

    // Emit to the user's personal room
    emitToRoom(`user:${userId}`, 'notification:new', {
      id: notif._id,
      type: normalizedType,
      title,
      message: notif.message,
      metadata,
      createdAt: notif.createdAt,
      isRead: notif.isRead,
    });

    // Also emit to role-specific rooms for common types
    if (type === 'new_booking' && metadata.vendorId) {
      emitToVendor(metadata.vendorId, 'notification:new', {
        id: notif._id,
        type: normalizedType,
        title,
        message: notif.message,
        metadata,
        createdAt: notif.createdAt,
        isRead: notif.isRead,
      });
    }

    if (type === 'payment_success' && metadata.customerId) {
      emitToCustomer(metadata.customerId, 'notification:new', {
        id: notif._id,
        type: normalizedType,
        title,
        message: notif.message,
        metadata,
        createdAt: notif.createdAt,
        isRead: notif.isRead,
      });
    }

    if (type === 'emergency' || type === 'admin_alert') {
      emitToAdmins('notification:new', {
        id: notif._id,
        type: normalizedType,
        title,
        message: notif.message,
        metadata,
        createdAt: notif.createdAt,
        isRead: notif.isRead,
      });
    }

    return notif;
  } catch (err) {
    console.error('createNotification error', err.message);
    return null;
  }
};

const markRead = async (notificationId, userId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
  return notif;
};

const listForUser = async (userId, limit = 50) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(Number(limit));
};

module.exports = { createNotification, markRead, listForUser };
