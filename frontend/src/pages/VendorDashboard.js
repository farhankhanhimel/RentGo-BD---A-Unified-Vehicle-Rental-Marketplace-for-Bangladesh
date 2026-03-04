import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const VendorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}! 🏢</h1>
        <p className="dashboard-subtitle">Manage your fleet and bookings</p>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="action-cards">
            <div className="action-card add-vehicle">
              <div className="icon">➕</div>
              <h3>Add Vehicle</h3>
              <p>List a new vehicle</p>
            </div>

            <div className="action-card manage-vehicles">
              <div className="icon">🚗</div>
              <h3>My Vehicles</h3>
              <p>Manage your fleet</p>
            </div>

            <div className="action-card bookings">
              <div className="icon">📊</div>
              <h3>Bookings</h3>
              <p>View all bookings</p>
            </div>

            <div className="action-card earnings">
              <div className="icon">💰</div>
              <h3>Earnings</h3>
              <p>Check your income</p>
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
          <button className="btn btn-secondary">Edit Business Info</button>
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
            <button className="btn btn-primary">Complete Verification</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
