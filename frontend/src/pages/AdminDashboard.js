import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard 👨‍💼</h1>
        <p className="dashboard-subtitle">Manage the platform and monitor activities</p>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Management Tools</h2>
          <div className="action-cards">
            <div className="action-card users">
              <div className="icon">👥</div>
              <h3>Manage Users</h3>
              <p>User accounts & roles</p>
            </div>

            <div className="action-card vendors">
              <div className="icon">🏢</div>
              <h3>Verify Vendors</h3>
              <p>Review vendor documents</p>
            </div>

            <div className="action-card reports">
              <div className="icon">📈</div>
              <h3>Reports</h3>
              <p>Platform analytics</p>
            </div>

            <div className="action-card disputes">
              <div className="icon">⚖️</div>
              <h3>Disputes</h3>
              <p>Handle complaints</p>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="stats-section">
          <h2>Platform Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Active Vendors</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">৳0</div>
              <div className="stat-label">Total Commission</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Total Bookings</div>
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="pending-section">
          <h2>⏳ Pending Actions</h2>
          <div className="pending-list">
            <div className="pending-item">
              <span className="badge vendor-badge">Vendor</span>
              <span className="pending-text">3 vendors awaiting verification</span>
              <button className="btn-small">Review</button>
            </div>
            <div className="pending-item">
              <span className="badge dispute-badge">Dispute</span>
              <span className="pending-text">1 active dispute</span>
              <button className="btn-small">Check</button>
            </div>
            <div className="pending-item">
              <span className="badge report-badge">Report</span>
              <span className="pending-text">5 user reports</span>
              <button className="btn-small">View</button>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="activities-section">
          <h2>Recent Activities</h2>
          <div className="activities-list">
            <div className="empty-state">
              <p>No recent activities to display</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
