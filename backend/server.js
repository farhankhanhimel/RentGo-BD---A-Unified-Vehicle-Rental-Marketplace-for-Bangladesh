const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

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
const userRoutes = require('./routes/users');
const wishlistRoutes = require('./routes/wishlist');
const notificationRoutes = require('./routes/notifications');
const routeRoutes = require('./routes/routes');
const vendorBookingRoutes = require('./routes/vendorBookings');
const invoiceRoutes = require('./routes/invoices');
const couponRoutes = require('./routes/coupons');
const eventPackageRoutes = require('./routes/eventPackages');
const verificationRoutes = require('./routes/verification');
const vehicleRoutes = require('./routes/vehicles');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/vendor-bookings', vendorBookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/event-packages', eventPackageRoutes);
app.use('/api/verification', verificationRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Auto-expire pending request-mode bookings every 15 minutes
  const { autoExpirePendingBookings } = require('./controllers/vendorBookingController');
  setInterval(autoExpirePendingBookings, 15 * 60 * 1000);
  // Run once on startup after a short delay
  setTimeout(autoExpirePendingBookings, 10000);
  console.log('Auto-expire scheduler active (checks every 15 min)');
});
