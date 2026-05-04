const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const { registerSocketServer } = require('./services/socketService');
const { bootstrapEmergencyAlerts } = require('./services/emergencyNotificationService');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

registerSocketServer(io);

io.on('connection', (socket) => {
  socket.on('register', ({ role, userId }) => {
    if (role) {
      socket.join(`role:${role}`);
    }

    if (userId) {
      socket.join(`${role || 'user'}:${userId}`);
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Running in degraded mode without MongoDB. Some features may be limited.');
  }
};

const startServer = async () => {
  await connectDB();
  await bootstrapEmergencyAlerts();
};

startServer();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to RentGo API' });
});

// Import and use auth routes
const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/drivers');
const paymentRoutes = require('./routes/payments');
const packageRoutes = require('./routes/packages');
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/packages', packageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
