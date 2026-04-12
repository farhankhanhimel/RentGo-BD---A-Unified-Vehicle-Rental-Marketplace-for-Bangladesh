import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  assignDriverToBooking,
  createDriver,
  deleteDriver,
  getVendorBookings,
  getVendorDrivers,
} from '../services/driverService';
import '../styles/Dashboard.css';

const VendorDashboard = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [driverForm, setDriverForm] = useState({
    fullName: '',
    photoUrl: '',
    nidNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    experienceYears: '',
    languages: '',
  });

  const refreshData = async () => {
    try {
      const [driverData, bookingData] = await Promise.all([
        getVendorDrivers(),
        getVendorBookings(),
      ]);
      setDrivers(driverData);
      setBookings(bookingData);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load driver data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const stats = useMemo(() => {
    const totalRatings = drivers.reduce((sum, driver) => sum + (driver.ratings?.length || 0), 0);
    const avgDriverRating =
      drivers.length > 0
        ? (drivers.reduce((sum, driver) => sum + (driver.averageRating || 0), 0) / drivers.length).toFixed(1)
        : '0.0';

    return {
      activeDrivers: drivers.filter((driver) => driver.isActive).length,
      bookingsWithDriver: bookings.filter((booking) => booking.withDriver).length,
      totalRatings,
      avgDriverRating,
    };
  }, [drivers, bookings]);

  const handleDriverInput = (event) => {
    const { name, value } = event.target;
    setDriverForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDriver = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createDriver({
        ...driverForm,
        experienceYears: Number(driverForm.experienceYears),
        languages: driverForm.languages,
      });

      setDriverForm({
        fullName: '',
        photoUrl: '',
        nidNumber: '',
        licenseNumber: '',
        licenseExpiry: '',
        experienceYears: '',
        languages: '',
      });

      setSuccess('Driver profile created successfully');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async (driverId) => {
    setError('');
    setSuccess('');

    try {
      await deleteDriver(driverId);
      setSuccess('Driver removed from roster');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove driver');
    }
  };

  const handleAssignDriver = async (bookingId, driverId) => {
    if (!driverId) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await assignDriverToBooking(bookingId, driverId);
      setSuccess('Driver assigned to booking');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign driver');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p className="dashboard-subtitle">Manage your drivers, ratings, and booking assignments</p>
      </div>

      {error && <div className="alert-message error">{error}</div>}
      {success && <div className="alert-message success">{success}</div>}

      <div className="dashboard-grid">
        <div className="stats-section">
          <h2>Driver Operations Snapshot</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.activeDrivers}</div>
              <div className="stat-label">Active Drivers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.bookingsWithDriver}</div>
              <div className="stat-label">With-Driver Bookings</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalRatings}</div>
              <div className="stat-label">Ratings Received</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.avgDriverRating}</div>
              <div className="stat-label">Average Driver Rating</div>
            </div>
          </div>
        </div>

        <div className="quick-actions-section">
          <h2>Add Driver To Roster</h2>
          <form className="driver-form" onSubmit={handleCreateDriver}>
            <div className="form-grid">
              <input
                name="fullName"
                value={driverForm.fullName}
                onChange={handleDriverInput}
                placeholder="Driver full name"
                required
              />
              <input
                name="photoUrl"
                value={driverForm.photoUrl}
                onChange={handleDriverInput}
                placeholder="Photo URL"
                required
              />
              <input
                name="nidNumber"
                value={driverForm.nidNumber}
                onChange={handleDriverInput}
                placeholder="NID number"
                required
              />
              <input
                name="licenseNumber"
                value={driverForm.licenseNumber}
                onChange={handleDriverInput}
                placeholder="License number"
                required
              />
              <input
                name="licenseExpiry"
                type="date"
                value={driverForm.licenseExpiry}
                onChange={handleDriverInput}
                required
              />
              <input
                name="experienceYears"
                type="number"
                min="0"
                value={driverForm.experienceYears}
                onChange={handleDriverInput}
                placeholder="Experience (years)"
                required
              />
            </div>
            <input
              name="languages"
              value={driverForm.languages}
              onChange={handleDriverInput}
              placeholder="Languages (comma separated)"
              required
            />
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving driver...' : 'Add Driver'}
            </button>
          </form>
        </div>

        <div className="recent-bookings-section">
          <h2>Driver Roster</h2>
          {loading ? (
            <div className="empty-state">
              <p>Loading driver roster...</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="empty-state">
              <p>No drivers added yet.</p>
            </div>
          ) : (
            <div className="driver-roster-list">
              {drivers.map((driver) => (
                <div className="driver-roster-item" key={driver._id}>
                  <img src={driver.photoUrl} alt={driver.fullName} />
                  <div className="driver-roster-meta">
                    <h3>{driver.fullName}</h3>
                    <p>License: {driver.licenseNumber} (exp {new Date(driver.licenseExpiry).toLocaleDateString()})</p>
                    <p>
                      Experience: {driver.experienceYears} years | Languages: {driver.languages?.join(', ') || 'N/A'}
                    </p>
                    <p>Rating: {Number(driver.averageRating || 0).toFixed(1)} ({driver.ratings?.length || 0} reviews)</p>
                  </div>
                  <button className="btn btn-danger" onClick={() => handleDeleteDriver(driver._id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="account-info-section">
          <h2>Assign Drivers To Bookings</h2>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings available for assignment.</p>
            </div>
          ) : (
            <div className="assignment-list">
              {bookings.map((booking) => (
                <div className="assignment-item" key={booking._id}>
                  <div>
                    <h3>{booking.vehicleName}</h3>
                    <p>Customer: {booking.customer?.name || 'N/A'}</p>
                    <p>Pickup: {new Date(booking.pickupDate).toLocaleDateString()}</p>
                    <p>Status: {booking.status}</p>
                    <p>
                      Assigned Driver:{' '}
                      {booking.assignedDriver ? booking.assignedDriver.fullName : 'Not assigned'}
                    </p>
                  </div>
                  <select
                    value={booking.assignedDriver?._id || ''}
                    onChange={(event) => handleAssignDriver(booking._id, event.target.value)}
                  >
                    <option value="">Select driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.fullName} ({Number(driver.averageRating || 0).toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="verification-section">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
