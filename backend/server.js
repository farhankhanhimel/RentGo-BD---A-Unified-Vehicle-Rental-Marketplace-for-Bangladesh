const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { registerSocketServer } = require('./services/socketService');


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to RentGo API' });
});

// Import and use routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/users');
const wishlistRoutes = require('./routes/wishlist');
const notificationRoutes = require('./routes/notifications');
const routeRoutes = require('./routes/routes');
const vendorBookingRoutes = require('./routes/vendorBookings');
const invoiceRoutes = require('./routes/invoices');
const couponRoutes = require('./routes/coupons');
const eventPackageRoutes = require('./routes/eventPackages');
const routePackageRoutes = require('./routes/routePackages');
const intercityRequestRoutes = require('./routes/intercityRequests');
const driverRoutes = require('./routes/drivers');
const paymentRoutes = require('./routes/payments');
const verificationRoutes = require('./routes/verification');
const vehicleRoutes = require('./routes/vehicles');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const { addVehicle } = require('./controllers/vehicleController');

// app.post('/api/inject-vehicle', addVehicle);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/vendor-bookings', vendorBookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/event-packages', eventPackageRoutes);
app.use('/api/route-packages', routePackageRoutes);
app.use('/api/intercity-requests', intercityRequestRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/advanced-search', require('./routes/advancedSearchRoutes'));
app.use('/api/vendor-compare', require('./routes/vendorCompareRoutes'));
app.use('/api/checkout-calculator', require('./routes/checkoutCalculatorRoutes'));

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
  },
});

registerSocketServer(io);
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('register', ({ role, userId } = {}) => {
    if (!userId) {
      return;
    }

    const id = String(userId);
    socket.join(`user:${id}`);
    socket.join(`user_${id}`); // legacy room compatibility

    if (role === 'vendor') {
      socket.join(`vendor:${id}`);
      socket.join(`vendor_${id}`); // legacy room compatibility
    }

    if (role === 'customer') {
      socket.join(`customer:${id}`);
      socket.join(`customer_${id}`); // legacy room compatibility
    }

    if (role === 'admin') {
      socket.join('role:admin');
      socket.join('admin');
    }
  });

  // Chat message handling
  socket.on('send_message', (data) => {
    const { senderId, recipientId, content, type = 'text' } = data;
    io.to(`user:${recipientId}`).emit('receive_message', {
      senderId,
      content,
      type,
      timestamp: new Date(),
    });
  });

  // Typing indicator
  socket.on('user_typing', (data) => {
    const { senderId, recipientId } = data;
    io.to(`user:${recipientId}`).emit('user_typing', { senderId });
  });

  socket.on('user_stopped_typing', (data) => {
    const { senderId, recipientId } = data;
    io.to(`user:${recipientId}`).emit('user_stopped_typing', { senderId });
  });

  // Offer handling
  socket.on('send_offer', (data) => {
    const { senderId, recipientId, price, details } = data;
    io.to(`user:${recipientId}`).emit('receive_offer', {
      senderId,
      price,
      details,
      timestamp: new Date(),
    });
  });
});


// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Auto-expire pending request-mode bookings every 15 minutes
  const { autoExpirePendingBookings } = require('./controllers/vendorBookingController');
  setInterval(autoExpirePendingBookings, 15 * 60 * 1000);
  // Run once on startup after a short delay
  setTimeout(autoExpirePendingBookings, 10000);
  console.log('Auto-expire scheduler active (checks every 15 min)');
});
