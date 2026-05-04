const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to controllers via app
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User joins their personal room for notifications
  socket.on('join_user_room', ({ userId }) => {
    socket.join(`user_${userId}`);
  });

  // Admin joins admin room
  socket.on('join_admin_room', () => {
    socket.join('admin_room');
  });

  // User joins vehicle room for real-time calendar updates
  socket.on('join_vehicle_room', ({ vehicleId }) => {
    socket.join(`vehicle_${vehicleId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Start booking cron jobs AFTER DB is connected
    const { startBookingCronJobs } = require('./utils/bookingCron');
    startBookingCronJobs();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to RentGo API' });
});

// Import and use routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const earningsRoutes = require('./routes/earningsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vendor/earnings', earningsRoutes);
app.use('/api/reviews', reviewRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
