const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getChatHistory,
  getConversations,
  markAsRead,
  deleteMessage,
  sendOffer,
  getUnreadCount,
} = require('../controllers/messageController');

// All routes require authentication
router.use(protect);

// Send message
router.post('/send', sendMessage);

// Send offer
router.post('/offer', sendOffer);

// Get chat history with a user
router.get('/history/:userId', getChatHistory);

// Get all conversations
router.get('/', getConversations);

// Mark messages as read
router.put('/:userId/read', markAsRead);

// Delete a message
router.delete('/:messageId', deleteMessage);

// Get unread count
router.get('/unread/count', getUnreadCount);

module.exports = router;
