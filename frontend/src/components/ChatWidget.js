import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import messageService from '../services/messageService';
import '../styles/ChatWidget.css';

const ChatWidget = ({ bookingContext = null, recipientId = null, vendorName = '' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && recipientId) {
      loadMessages();
    }
  }, [isOpen, recipientId]);

  const loadMessages = async () => {
    if (!recipientId) return;
    setLoading(true);
    try {
      const response = await messageService.getChatHistory(recipientId, {
        limit: 30,
        ...bookingContext,
      });
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !recipientId) return;

    try {
      const response = await messageService.sendMessage(
        recipientId,
        messageText,
        'text',
        {},
        bookingContext || {}
      );
      setMessages((prev) => [...prev, response]);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  if (!user || !recipientId) {
    return null;
  }

  return (
    <>
      {/* Chat Widget Button */}
      <button
        className="chat-widget-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        <svg
          className="chat-widget-icon"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="widget-label">Chat</span>
      </button>

      {/* Chat Widget Panel */}
      {isOpen && (
        <div className="chat-widget-panel">
          <div className="chat-widget-header">
            <h4>{vendorName || 'Vendor'}</h4>
            <button
              className="close-widget-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-widget-messages">
            {loading ? (
              <div className="loading-messages">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="no-messages">
                <p>Start a conversation with the vendor</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`widget-message ${
                    msg.sender === user._id ? 'sent' : 'received'
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.type === 'offer' && msg.metadata?.price && (
                    <div className="offer-badge">
                      <strong>Offer: ₳{msg.metadata.price}</strong>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendMessage} className="chat-widget-input">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type message..."
              className="widget-input-field"
            />
            <button type="submit" className="widget-send-btn">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
