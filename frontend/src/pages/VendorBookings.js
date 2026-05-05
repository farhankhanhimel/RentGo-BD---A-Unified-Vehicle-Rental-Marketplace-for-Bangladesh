import React, { useState, useEffect, useCallback } from 'react';
import vendorBookingService from '../services/vendorBookingService';
import BookingStatusBadge from '../components/BookingStatusBadge';
import BookingDetailModal from '../components/BookingDetailModal';
import './VendorBookings.css';

const VendorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    vehicleType: 'all',
    tripType: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vendorBookingService.getBookings(filters);
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await vendorBookingService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleViewBooking = async (booking) => {
    try {
      const detail = await vendorBookingService.getBookingDetail(booking._id);
      setSelectedBooking(detail);
      setShowDetail(true);
    } catch (err) {
      setError('Failed to load booking details');
    }
  };

  const handleStatusUpdate = async (id, data) => {
    try {
      const updated = await vendorBookingService.updateStatus(id, data);
      setSelectedBooking(updated);
      fetchBookings();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePaymentUpdate = async (id, data) => {
    try {
      const updated = await vendorBookingService.updatePayment(id, data);
      setSelectedBooking(updated);
      fetchBookings();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment');
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      if (format === 'pdf') {
        await vendorBookingService.exportPDF({
          status: filters.status,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        });
      } else {
        await vendorBookingService.exportCSV({
          status: filters.status,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        });
      }
    } catch (err) {
      setError('Failed to export bookings');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-BD', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `৳${(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="vendor-bookings-container">
      {/* Header */}
      <div className="vb-header">
        <div className="vb-header-text">
          <h1>📊 Booking Management</h1>
          <p>Track, manage, and respond to all your bookings</p>
        </div>
        <button className="btn btn-secondary vb-export-btn" onClick={() => handleExport('csv')}>
          📥 Export CSV
        </button>
        <button className="btn btn-secondary vb-export-btn" onClick={() => handleExport('pdf')}>
          📄 Export PDF
        </button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="vb-stats-row">
          <div className="vb-stat-card">
            <span className="vb-stat-icon">📋</span>
            <div>
              <div className="vb-stat-value">{stats.totalBookings}</div>
              <div className="vb-stat-label">Total Bookings</div>
            </div>
          </div>
          <div className="vb-stat-card highlight">
            <span className="vb-stat-icon">⏳</span>
            <div>
              <div className="vb-stat-value">{stats.pendingBookings}</div>
              <div className="vb-stat-label">Pending Action</div>
            </div>
          </div>
          <div className="vb-stat-card">
            <span className="vb-stat-icon">🚗</span>
            <div>
              <div className="vb-stat-value">{stats.activeBookings}</div>
              <div className="vb-stat-label">Active Trips</div>
            </div>
          </div>
          <div className="vb-stat-card">
            <span className="vb-stat-icon">💰</span>
            <div>
              <div className="vb-stat-value">{formatCurrency(stats.totalRevenue)}</div>
              <div className="vb-stat-label">Total Revenue</div>
            </div>
          </div>
          <div className="vb-stat-card">
            <span className="vb-stat-icon">✅</span>
            <div>
              <div className="vb-stat-value">{stats.completionRate}%</div>
              <div className="vb-stat-label">Completion Rate</div>
            </div>
          </div>
          <div className="vb-stat-card">
            <span className="vb-stat-icon">📅</span>
            <div>
              <div className="vb-stat-value">{stats.todayBookings}</div>
              <div className="vb-stat-label">Today</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="vb-filters-card">
        {/* Status Tabs with Count Badges */}
        <div className="vb-status-tabs">
          {[
            { key: 'all', label: 'All', icon: '📋' },
            { key: 'pending', label: 'Pending', icon: '⏳' },
            { key: 'confirmed', label: 'Confirmed', icon: '✅' },
            { key: 'vehicle_handed_over', label: 'Ready', icon: '🔑' },
            { key: 'trip_started', label: 'In Progress', icon: '🚗' },
            { key: 'trip_completed', label: 'Completed', icon: '🏁' },
            { key: 'cancelled', label: 'Cancelled', icon: '❌' },
            { key: 'declined', label: 'Declined', icon: '🚫' },
          ].map((tab) => {
            const count = tab.key === 'all'
              ? (stats?.totalBookings || 0)
              : (stats?.statusBreakdown?.[tab.key] || 0);
            return (
              <button
                key={tab.key}
                className={`vb-status-tab ${filters.status === tab.key ? 'active' : ''}`}
                onClick={() => handleFilterChange('status', tab.key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="vb-filters-top">
          <form className="vb-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search booking ID or customer..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="vb-search-input"
            />
            <button type="submit" className="btn btn-primary vb-search-btn">
              🔍 Search
            </button>
          </form>
        </div>
        <div className="vb-filters-row">
          <select
            value={filters.paymentStatus}
            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
          >
            <option value="all">All Payments</option>
            <option value="pending">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={filters.vehicleType}
            onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
          >
            <option value="all">All Vehicles</option>
            <option value="car">Car</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="microbus">Microbus</option>
            <option value="van">Van</option>
            <option value="pickup">Pickup</option>
            <option value="bus">Bus</option>
          </select>
          <select
            value={filters.tripType}
            onChange={(e) => handleFilterChange('tripType', e.target.value)}
          >
            <option value="all">All Trip Types</option>
            <option value="tourism">Tourism</option>
            <option value="airport">Airport</option>
            <option value="wedding">Wedding</option>
            <option value="office">Office</option>
            <option value="emergency">Emergency</option>
            <option value="other">Other</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            placeholder="From date"
            className="vb-date-input"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            placeholder="To date"
            className="vb-date-input"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="vb-error">
          {error}
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {/* Bookings Table */}
      <div className="vb-table-card">
        {loading ? (
          <div className="vb-loading">
            <div className="vb-spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="vb-empty">
            <span className="vb-empty-icon">📭</span>
            <h3>No Bookings Found</h3>
            <p>
              {filters.status !== 'all' || filters.search
                ? 'Try adjusting your filters or search term.'
                : 'You don\'t have any bookings yet. Your bookings will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="vb-table-wrapper">
              <table className="vb-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Trip Dates</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className={(booking.status === 'pending' || booking.status === 'pending_vendor_approval') ? 'pending-row' : ''}
                    >
                      <td className="booking-id-cell">
                        <strong>{booking.bookingId}</strong>
                        <span className="booking-mode-tag">{booking.bookingMode}</span>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{booking.customer?.name || 'N/A'}</span>
                          <span className="customer-phone">{booking.customer?.phone || ''}</span>
                        </div>
                      </td>
                      <td>
                        <div className="vehicle-cell">
                          <span className="vehicle-name">
                            {booking.vehicle
                              ? `${booking.vehicle.make} ${booking.vehicle.model}`
                              : 'N/A'}
                          </span>
                          <span className="vehicle-type-tag">
                            {booking.vehicle?.vehicleType || ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="dates-cell">
                          <span>{formatDate(booking.tripDetails?.pickupDate)}</span>
                          <span className="date-separator">→</span>
                          <span>{formatDate(booking.tripDetails?.returnDate)}</span>
                        </div>
                      </td>
                      <td className="amount-cell">
                        <strong>{formatCurrency(booking.pricing?.totalAmount)}</strong>
                      </td>
                      <td>
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td>
                        <BookingStatusBadge status={booking.paymentStatus} type="payment" />
                      </td>
                      <td>
                        <button
                          className="vb-view-btn"
                          onClick={() => handleViewBooking(booking)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="vb-pagination">
                <button
                  className="vb-page-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                >
                  ← Previous
                </button>
                <div className="vb-page-info">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} bookings)
                </div>
                <button
                  className="vb-page-btn"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetail(false);
            setSelectedBooking(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          onPaymentUpdate={handlePaymentUpdate}
        />
      )}
    </div>
  );
};

export default VendorBookings;
