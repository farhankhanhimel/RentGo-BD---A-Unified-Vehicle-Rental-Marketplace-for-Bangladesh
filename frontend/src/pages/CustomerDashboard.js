import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import BookingStatusBadge from '../components/BookingStatusBadge';
import '../styles/Dashboard.css';
import '../styles/BookingPages.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    let isActive = true;

    const loadRecentBookings = async () => {
      setRecentLoading(true);
      setRecentError('');
      try {
        const res = await api.get('/bookings/my');
        const list = Array.isArray(res.data.bookings) ? res.data.bookings : [];
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (isActive) {
          setRecentBookings(list);
        }
      } catch (err) {
        if (isActive) {
          setRecentError(err.response?.data?.message || 'Failed to load recent bookings');
        }
      } finally {
        if (isActive) {
          setRecentLoading(false);
        }
      }
    };

    loadRecentBookings();

    return () => {
      isActive = false;
    };
  }, [user?._id]);

  const recentItems = useMemo(() => recentBookings.slice(0, 3), [recentBookings]);

  const getVehiclePhoto = (b) => {
    if (b.vehicle?.photos?.length > 0) return typeof b.vehicle.photos[0] === 'string' ? b.vehicle.photos[0] : b.vehicle.photos[0].url;
    if (b.vehicleId?.photos?.length > 0) return typeof b.vehicleId.photos[0] === 'string' ? b.vehicleId.photos[0] : b.vehicleId.photos[0].url;
    if (b.vehicleIdLegacy?.media?.photos?.length > 0) return b.vehicleIdLegacy.media.photos[0].url;
    return null;
  };

  const getVehicleName = (b) => {
    if (b.vehicle?.make) return `${b.vehicle.make} ${b.vehicle.model}`;
    if (b.vehicleId?.make) return `${b.vehicleId.make} ${b.vehicleId.model}`;
    if (b.vehicleId?.specs) return `${b.vehicleId.specs.make} ${b.vehicleId.specs.model}`;
    if (b.vehicleIdLegacy?.specs) return `${b.vehicleIdLegacy.specs.make} ${b.vehicleIdLegacy.specs.model}`;
    return 'Vehicle';
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name}! 👋</h1>
          <p className="dashboard-subtitle">Browse and book vehicles for your journey</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/search')}>Find Vehicles</button>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="action-cards">
            <button className="action-card browse-vehicles" onClick={() => navigate('/search')}>
              <div className="icon">🚗</div>
              <h3>Browse Vehicles</h3>
              <p>Find & book vehicles</p>
            </button>

            <button className="action-card my-bookings" onClick={() => navigate('/fare-estimator')}>
              <div className="icon">📋</div>
              <h3>Plan a Trip</h3>
              <p>Estimate routes and fares</p>
            </button>

            <button className="action-card saved-vehicles" onClick={() => navigate('/wishlist')}>
              <div className="icon">❤️</div>
              <h3>Saved Vehicles</h3>
              <p>Your favorites</p>
            </button>

            <button className="action-card messages" onClick={() => navigate('/notifications')}>
              <div className="icon">💬</div>
              <h3>Notifications</h3>
              <p>Booking and payment updates</p>
            </button>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="recent-bookings-section">
          <h2>Recent Bookings</h2>
          {recentLoading ? (
            <div className="empty-state">
              <p>Loading recent bookings...</p>
            </div>
          ) : recentError ? (
            <div className="empty-state">
              <p>{recentError}</p>
            </div>
          ) : recentItems.length === 0 ? (
            <div className="empty-state">
              <p>No bookings yet. Start browsing vehicles now!</p>
            </div>
          ) : (
            <div className="booking-list">
              {recentItems.map((booking) => (
                <div key={booking._id} className="booking-item">
                  {getVehiclePhoto(booking) ? (
                    <img src={getVehiclePhoto(booking)} alt="" className="booking-item-image" />
                  ) : (
                    <div className="booking-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🚗</div>
                  )}
                  <div className="booking-item-info">
                    <h3>{getVehicleName(booking)}</h3>
                    <div className="booking-id">{booking.bookingId}</div>
                    <div className="booking-dates">
                      {formatDate(booking.tripDetails?.startDate)} → {formatDate(booking.tripDetails?.endDate)}
                    </div>
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <BookingStatusBadge status={booking.status} />
                      <BookingStatusBadge status={booking.paymentStatus} type="payment" />
                    </div>
                  </div>
                  <div className="booking-item-actions">
                    <div className="booking-total">৳{booking.pricing?.totalAmount?.toLocaleString()}</div>
                    {(booking.status === 'payment_awaited' || booking.paymentStatus === 'pending' || booking.paymentStatus === 'partial_paid') && (
                      <button
                        className="btn-pay-booking"
                        style={{ background: '#48bb78', color: 'white', padding: '0.45rem 0.9rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.5rem' }}
                        onClick={() => navigate(`/checkout/${booking._id}`, { state: { booking, payFull: true } })}
                      >💳 Pay Now</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="account-info-section">
          <h2>Account Information</h2>
          <div className="info-box">
            <div className="info-row">
              <span className="label">Name:</span>
              <span className="value">{user?.name}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="label">Phone:</span>
              <span className="value">{user?.phone}</span>
            </div>
            <div className="info-row">
              <span className="label">Account Status:</span>
              <span className="value status-active">Active</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>Edit Profile</button>
        </div>

        {/* Statistics */}
        <div className="stats-section">
          <h2>Your Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Total Bookings</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Amount Spent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Favorite Vendors</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">⭐ 0</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
