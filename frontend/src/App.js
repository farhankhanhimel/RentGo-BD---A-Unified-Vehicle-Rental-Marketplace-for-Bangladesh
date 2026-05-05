import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import BookingForm from './pages/BookingForm';
import CustomerDashboard from './pages/CustomerDashboard';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FareEstimator from './pages/FareEstimator';
import VehicleComparison from './pages/VehicleComparison';
import Wishlist from './pages/Wishlist';
import Search from './pages/Search';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import VendorBookings from './pages/VendorBookings';
import ManageCoupons from './pages/ManageCoupons';
import EventPackages from './pages/EventPackages';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Notifications from './pages/Notifications';
import ManageEventPackages from './pages/ManageEventPackages';
import VendorVerification from './pages/VendorVerification';
import AdminVerificationQueue from './pages/AdminVerificationQueue';
import VehicleDetail from './pages/VehicleDetail';
import RoutePackages from './pages/RoutePackages';
import VendorDrivers from './pages/vendor/Drivers';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Protected Route Component
const ProtectedRoute = ({ children, role = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/booking/:vehicleId" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Dashboard Routes */}
            <Route 
              path="/dashboard/customer" 
              element={
                <ProtectedRoute role="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/dashboard/vendor" 
              element={
                <ProtectedRoute role="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Feature Pages */}
            <Route path="/fare-estimator" element={<FareEstimator />} />
            <Route path="/vehicle-comparison" element={<VehicleComparison />} />
            <Route path="/search" element={<Search />} />
            <Route path="/route-packages" element={<RoutePackages />} />
            <Route path="/checkout/:bookingId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/payment-result" element={<PaymentResult />} />
            <Route path="/event-packages" element={<EventPackages />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

            <Route 
              path="/wishlist" 
              element={
                <ProtectedRoute role="customer">
                  <Wishlist />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/vendor/bookings" 
              element={
                <ProtectedRoute role="vendor">
                  <VendorBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/drivers"
              element={
                <ProtectedRoute role="vendor">
                  <VendorDrivers />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/vendor/coupons" 
              element={
                <ProtectedRoute role="vendor">
                  <ManageCoupons />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/vendor/event-packages" 
              element={
                <ProtectedRoute role="vendor">
                  <ManageEventPackages />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/vendor/verification" 
              element={
                <ProtectedRoute role="vendor">
                  <VendorVerification />
                </ProtectedRoute>
              }
            />

            <Route 
              path="/admin/verifications" 
              element={
                <ProtectedRoute role="admin">
                  <AdminVerificationQueue />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
