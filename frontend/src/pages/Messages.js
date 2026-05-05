import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Chat from '../components/Chat';
import '../styles/Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    // Refresh chat component when userId changes
    setChatKey(prev => prev + 1);
  }, [userId]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        <Chat key={chatKey} />
      </div>
    </div>
  );
};

export default Messages;
