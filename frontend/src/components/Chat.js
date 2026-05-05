import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import io from 'socket.io-client';
import '../styles/Chat.css';

const Chat = ({ recipientId, bookingContext = null }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.io
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('register', { userId: user._id, role: user.role });
    });

    socketRef.current.on('receive_message', (data) => {
      setMessages((prev) => [...prev, {
        _id: data.timestamp,
        sender: data.senderId,
        content: data.content,
        type: data.type,
        createdAt: new Date(data.timestamp),
        isRead: false,
      }]);
    });

    socketRef.current.on('user_typing', (data) => {
      setIsTyping(true);
    });

    socketRef.current.on('user_stopped_typing', () => {
      setIsTyping(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user._id, user.role]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadChatHistory(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await api.get('/messages');
      setConversations(response.data.conversations || []);
      setUnreadCount(response.data.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0));
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
  };

  const loadChatHistory = async (userId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 50,
        ...(bookingContext?.bookingId && { bookingId: bookingContext.bookingId }),
        ...(bookingContext?.routePackageBookingId && { routePackageBookingId: bookingContext.routePackageBookingId }),
        ...(bookingContext?.intercityRequestId && { intercityRequestId: bookingContext.intercityRequestId }),
      });

      const response = await api.get(`/messages/history/${userId}?${params}`);
      setMessages(response.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load chat history', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTyping = () => {
    if (selectedConversation && socketRef.current) {
      socketRef.current.emit('user_typing', {
        senderId: user._id,
        recipientId: selectedConversation,
      });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('user_stopped_typing', {
          senderId: user._id,
          recipientId: selectedConversation,
        });
      }, 3000);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage = {
      sender: user._id,
      recipient: selectedConversation,
      content: messageText,
      type: 'text',
      ...(bookingContext?.bookingId && { booking: bookingContext.bookingId }),
      ...(bookingContext?.routePackageBookingId && { routePackageBooking: bookingContext.routePackageBookingId }),
      ...(bookingContext?.intercityRequestId && { intercityRequest: bookingContext.intercityRequestId }),
    };

    try {
      const response = await api.post('/messages/send', newMessage);
      setMessages((prev) => [...prev, response.data]);
      setMessageText('');

      // Emit via socket for real-time update
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          senderId: user._id,
          recipientId: selectedConversation,
          content: messageText,
          type: 'text',
        });
      }
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const markAsRead = async (conversationUserId) => {
    try {
      await api.put(`/messages/${conversationUserId}/read`);
      loadConversations();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3>Conversations</h3>
        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className={`conversation-item ${selectedConversation === conv._id ? 'active' : ''}`}
              onClick={() => {
                setSelectedConversation(conv._id);
                if (conv.unreadCount > 0) {
                  markAsRead(conv._id);
                }
              }}
            >
              <div className="conv-header">
                <h4>{conv.user?.name || 'Unknown'}</h4>
                {conv.unreadCount > 0 && (
                  <span className="unread-badge">{conv.unreadCount}</span>
                )}
              </div>
              <p className="conv-preview">{conv.lastMessage}</p>
              <span className="conv-time">
                {new Date(conv.lastMessageTime).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <h3>
                {conversations.find((c) => c._id === selectedConversation)?.user?.name || 'Chat'}
              </h3>
            </div>

            <div className="chat-messages">
              {loading ? (
                <div className="loading">Loading messages...</div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${msg.sender === user._id ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{msg.content}</p>
                      {msg.type === 'offer' && msg.metadata?.price && (
                        <div className="offer-badge">
                          <strong>Offer: ₳{msg.metadata.price}</strong>
                          {msg.metadata.offerDetails && (
                            <p>{msg.metadata.offerDetails}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input-form">
              <input
                type="text"
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                placeholder="Type your message..."
                className="chat-input"
              />
              <button type="submit" className="send-btn">Send</button>
            </form>
          </>
        ) : (
          <div className="no-conversation">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
