const { listForUser, markRead } = require('../services/notificationService');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await listForUser(req.user._id, 100);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notif = await markRead(req.params.id, req.user._id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification: notif });
  } catch (err) {
    next(err);
  }
};
