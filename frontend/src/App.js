import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CustomerDashboard from './pages/CustomerDashboard';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FareEstimator from './pages/FareEstimator';
import Wishlist from './pages/Wishlist';
import VendorBookings from './pages/VendorBookings';
import ManageCoupons from './pages/ManageCoupons';
import EventPackages from './pages/EventPackages';
import ManageEventPackages from './pages/ManageEventPackages';
import VendorVerification from './pages/VendorVerification';
import AdminVerificationQueue from './pages/AdminVerificationQueue';
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
            <Route path="/event-packages" element={<EventPackages />} />

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
