import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }

  return socketInstance;
};

export const connectSocket = ({ role, userId }) => {
  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();
  }

  socket.emit('register', { role, userId });
  return socket;
};