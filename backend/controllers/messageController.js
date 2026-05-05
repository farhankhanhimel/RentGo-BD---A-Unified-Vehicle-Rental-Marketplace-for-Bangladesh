const Message = require('../models/Message');
const User = require('../models/User');
const { emitToRoom } = require('../services/socketService');

/**
 * Send a message between customer and vendor
 */
exports.sendMessage = async (req, res) => {
  try {
    const {
      recipient,
      content,
      type = 'text',
      metadata = {},
      booking,
      routePackageBooking,
      intercityRequest,
    } = req.body;

    if (!recipient || !content.trim()) {
      return res.status(400).json({ message: 'Recipient and message content are required' });
    }

    // Verify recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient,
      content: content.trim(),
      type,
      metadata,
      booking,
      routePackageBooking,
      intercityRequest,
    });

    await message.save();
    await message.populate('sender', 'name email phone avatar role');
    await message.populate('recipient', 'name email phone avatar role');

    // Emit real-time notification
    emitToRoom(`user:${recipient}`, 'new_message', {
      message: message.toObject(),
      from: req.user._id,
    });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get chat history between two users
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { bookingId, routePackageBookingId, intercityRequestId, page = 1, limit = 50 } = req.query;

    // Build query
    const query = {
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id },
      ],
    };

    // Filter by context if provided
    if (bookingId) {
      query.booking = bookingId;
    } else if (routePackageBookingId) {
      query.routePackageBooking = routePackageBookingId;
    } else if (intercityRequestId) {
      query.intercityRequest = intercityRequestId;
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find(query)
      .populate('sender', 'name email phone avatar role')
      .populate('recipient', 'name email phone avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    // Mark messages as read
    await Message.updateMany(
      { ...query, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get all conversations (users with whom current user has messages)
 */
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { recipient: req.user._id }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$recipient',
              '$sender',
            ],
          },
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);

    // Populate user details
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await User.findById(conv._id).select(
          'name email phone avatar role vendorDetails.businessName'
        );
        return {
          _id: conv._id,
          user: otherUser,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount,
        };
      })
    );

    return res.json({ conversations: enrichedConversations });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Mark messages as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      { sender: userId, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.json({ message: 'Messages marked as read' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a message (soft delete)
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check ownership
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.deletedBySender = true;
    await message.save();

    return res.json({ message: 'Message deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Send an offer/proposal in chat
 */
exports.sendOffer = async (req, res) => {
  try {
    const {
      recipient,
      price,
      offerDetails,
      booking,
      routePackageBooking,
      intercityRequest,
    } = req.body;

    if (!recipient || !price) {
      return res.status(400).json({ message: 'Recipient and price are required' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient,
      content: `Sent an offer: ₳${price}`,
      type: 'offer',
      metadata: {
        price,
        offerDetails,
      },
      booking,
      routePackageBooking,
      intercityRequest,
    });

    await message.save();
    await message.populate('sender', 'name email phone avatar role');
    await message.populate('recipient', 'name email phone avatar role');

    emitToRoom(`user:${recipient}`, 'new_offer', {
      message: message.toObject(),
      from: req.user._id,
    });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get unread message count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.json({ unreadCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
