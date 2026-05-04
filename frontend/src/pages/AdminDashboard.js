import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../utils/socket';
import { getAdminEmergencyBookings } from '../services/driverService';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [emergencyBookings, setEmergencyBookings] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);

  const refreshEmergencyBookings = async () => {
    try {
      const data = await getAdminEmergencyBookings();
      setEmergencyBookings(data || []);
    } catch (error) {
      setEmergencyBookings([]);
    }
  };

  useEffect(() => {
    refreshEmergencyBookings();
  }, []);

  useEffect(() => {
    if (!user?._id) {
      return undefined;
    }

    const socket = connectSocket({ role: 'admin', userId: user._id });

    const pushAlert = (payload, label) => {
      setLiveAlerts((prev) => [
        {
          id: `${label}-${payload.bookingId}-${Date.now()}`,
          label,
          vehicleName: payload.vehicleName,
          pickupLocation: payload.pickupLocation,
          emergencyStatus: payload.emergencyStatus,
          message: payload.message || 'Emergency update received',
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 5));
      refreshEmergencyBookings();
    };

    const handleNew = (payload) => pushAlert(payload, 'New emergency request');
    const handleEscalated = (payload) => pushAlert(payload, 'Emergency escalated');
    const handleClaimed = (payload) => pushAlert(payload, 'Emergency claimed');

    socket.on('emergency:new', handleNew);
    socket.on('emergency:escalated', handleEscalated);
    socket.on('emergency:claimed', handleClaimed);

    return () => {
      socket.off('emergency:new', handleNew);
      socket.off('emergency:escalated', handleEscalated);
      socket.off('emergency:claimed', handleClaimed);
    };
  }, [user?._id]);

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
            <div className="stat-card emergency-stat">
              <div className="stat-value">{emergencyBookings.length}</div>
              <div className="stat-label">Emergency Alerts</div>
            </div>
          </div>
        </div>

        <div className="emergency-section">
          <h2>Emergency Monitoring</h2>
          <div className="live-alerts-list">
            {liveAlerts.length === 0 ? (
              <div className="empty-state">
                <p>No live emergency alerts yet.</p>
              </div>
            ) : (
              liveAlerts.map((alert) => (
                <div className="alert-item" key={alert.id}>
                  <div>
                    <h3>{alert.label}</h3>
                    <p>{alert.vehicleName}</p>
                    <p>{alert.pickupLocation || 'No pickup location provided'}</p>
                    <p>Status: {alert.emergencyStatus}</p>
                    <p>{alert.message}</p>
                  </div>
                  <span className="emergency-badge">Live</span>
                </div>
              ))
            )}
          </div>

          <div className="emergency-list">
            {emergencyBookings.length === 0 ? (
              <div className="empty-state">
                <p>No emergency bookings currently active.</p>
              </div>
            ) : (
              emergencyBookings.map((booking) => (
                <div className="emergency-card" key={booking._id}>
                  <div>
                    <h3>{booking.vehicleName}</h3>
                    <p>Customer: {booking.customer?.name || 'N/A'}</p>
                    <p>Vendor: {booking.vendor?.vendorDetails?.businessName || booking.vendor?.name || 'Broadcasting'}</p>
                    <p>Pickup: {booking.pickupLocation || 'N/A'}</p>
                    <p>Deadline: {booking.responseDueAt ? new Date(booking.responseDueAt).toLocaleString() : 'Pending'}</p>
                    <p>Status: {booking.emergencyStatus}</p>
                  </div>
                  <span className="emergency-badge">Monitoring</span>
                </div>
              ))
            )}
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
