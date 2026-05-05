import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name}! </h1>
          <p className="dashboard-subtitle">Manage your fleet and bookings</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/vendor/bookings')}>Open Bookings</button>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="action-cards">
            <div className="action-card add-vehicle" onClick={() => navigate('/vendor/verification')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/vendor/verification')}>
              <div className="icon">➕</div>
              <h3>Get Verified</h3>
              <p>Complete onboarding to list vehicles</p>
            </div>

            <div
              className="action-card manage-vehicles"
              onClick={() => navigate('/vendor/drivers')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/vendor/drivers')}
            >
              <div className="icon">🧑‍✈️</div>
              <h3>Drivers</h3>
              <p>Manage your roster</p>
            </div>

            <div className="action-card manage-vehicles" onClick={() => navigate('/search')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}>
              <div className="icon">🚗</div>
              <h3>Market View</h3>
              <p>View active listing market</p>
            </div>

            <div className="action-card bookings" onClick={() => navigate('/vendor/route-packages')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/vendor/route-packages')}>
              <div className="icon">Route</div>
              <h3>Route Offers</h3>
              <p>Create intercity packages</p>
            </div>

            <div className="action-card bookings" onClick={() => navigate('/vendor/bookings')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/vendor/bookings')}>
              <div className="icon">📊</div>
              <h3>Bookings</h3>
              <p>View all bookings</p>
            </div>

            <div
              className="action-card earnings"
              onClick={() => navigate('/vendor/coupons')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/vendor/coupons')}
            >
              <div className="icon">💰</div>
              <h3>Coupons</h3>
              <p>Boost conversions with offers</p>
            </div>
          </div>
        </div>

        {/* Business Stats */}
        <div className="stats-section">
          <h2>Business Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Active Vehicles</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Total Bookings</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">৳0</div>
              <div className="stat-label">Total Earnings</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">⭐ 0</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="recent-bookings-section">
          <h2>Recent Bookings</h2>
          <div className="empty-state">
            <p>No bookings yet. Add vehicles to start earning!</p>
          </div>
        </div>

        {/* Business Info */}
        <div className="account-info-section">
          <h2>Business Information</h2>
          <div className="info-box">
            <div className="info-row">
              <span className="label">Business Name:</span>
              <span className="value">{user?.vendorDetails?.businessName || 'Not set'}</span>
            </div>
            <div className="info-row">
              <span className="label">Business Type:</span>
              <span className="value">{user?.vendorDetails?.businessType || 'Not set'}</span>
            </div>
            <div className="info-row">
              <span className="label">Verification Status:</span>
              <span className="value status-pending">
                {user?.vendorDetails?.isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Account Status:</span>
              <span className="value status-active">Active</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>Edit Business Info</button>
        </div>

        {/* Verification Status */}
        {!user?.vendorDetails?.isVerified && (
          <div className="verification-section">
            <h2>⚠️ Verification Pending</h2>
            <p>Complete your business verification to start listing vehicles.</p>
            <div className="verification-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span className="step-text">Upload Trade License</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span className="step-text">Upload NID/Passport</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span className="step-text">Bank Details</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/vendor/verification')}>Complete Verification</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
