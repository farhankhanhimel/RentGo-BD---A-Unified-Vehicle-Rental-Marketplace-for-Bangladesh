import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}! 👋</h1>
        <p className="dashboard-subtitle">Browse and book vehicles for your journey</p>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="action-cards">
            <div className="action-card browse-vehicles">
              <div className="icon">🚗</div>
              <h3>Browse Vehicles</h3>
              <p>Find & book vehicles</p>
            </div>

            <div className="action-card my-bookings">
              <div className="icon">📋</div>
              <h3>My Bookings</h3>
              <p>View your bookings</p>
            </div>

            <div className="action-card saved-vehicles">
              <div className="icon">❤️</div>
              <h3>Saved Vehicles</h3>
              <p>Your favorites</p>
            </div>

            <div className="action-card messages">
              <div className="icon">💬</div>
              <h3>Messages</h3>
              <p>Chat with vendors</p>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="recent-bookings-section">
          <h2>Recent Bookings</h2>
          <div className="empty-state">
            <p>No bookings yet. Start browsing vehicles now!</p>
          </div>
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
          <button className="btn btn-secondary">Edit Profile</button>
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
