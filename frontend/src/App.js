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
import VehicleApprovals from './pages/admin/VehicleApprovals';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Homyra's Feature Pages
import AddVehicle from './pages/vendor/AddVehicle';
import Fleet from './pages/vendor/Fleet';
import EditVehicle from './pages/vendor/EditVehicle';
import BookingRequests from './pages/vendor/BookingRequests';
import Earnings from './pages/vendor/Earnings';
import VehicleDetail from './pages/VehicleDetail';
import BookingForm from './pages/BookingForm';
import MyBookings from './pages/customer/MyBookings';

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

            <Route
              path="/admin/vehicles"
              element={
                <ProtectedRoute role="admin">
                  <VehicleApprovals />
                </ProtectedRoute>
              }
            />

            {/* ═══ Homyra's Feature Routes ═══ */}

            {/* Feature 2: Vehicle Listing by Vendors */}
            <Route
              path="/vendor/add-vehicle"
              element={
                <ProtectedRoute role="vendor">
                  <AddVehicle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/fleet"
              element={
                <ProtectedRoute role="vendor">
                  <Fleet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/fleet/edit/:id"
              element={
                <ProtectedRoute role="vendor">
                  <EditVehicle />
                </ProtectedRoute>
              }
            />

            {/* Feature 5: Vehicle Detail Page (Public) */}
            <Route path="/vehicles/:id" element={<VehicleDetail />} />

            {/* Feature 8: Booking System */}
            <Route
              path="/booking/:vehicleId"
              element={
                <ProtectedRoute role="customer">
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/bookings"
              element={
                <ProtectedRoute role="customer">
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/bookings"
              element={
                <ProtectedRoute role="vendor">
                  <BookingRequests />
                </ProtectedRoute>
              }
            />

            {/* Feature 19: Vendor Earnings */}
            <Route
              path="/vendor/earnings"
              element={
                <ProtectedRoute role="vendor">
                  <Earnings />
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
