import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPaymentBookings,
  getReceipt,
  initiatePayment,
  retryPayment,
} from '../services/paymentService';
import '../styles/Dashboard.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [advancePercent, setAdvancePercent] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receipt, setReceipt] = useState(null);

  const refreshBookings = async () => {
    try {
      const response = await getPaymentBookings();
      setBookings(response.bookings || []);
      setAdvancePercent(response.advancePaymentPercent || 30);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load bookings for payment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBookings();
  }, []);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const amountSpent = bookings.reduce((sum, booking) => sum + Number(booking.paidAmount || 0), 0);
    const dueAmount = bookings.reduce((sum, booking) => sum + Number(booking.dueAmount || 0), 0);

    return {
      totalBookings,
      amountSpent,
      dueAmount,
    };
  }, [bookings]);

  const handlePay = async (bookingId, mode) => {
    setError('');
    setSuccess('');
    try {
      const response = await initiatePayment(bookingId, mode);
      setSuccess(`Redirecting to SSLCommerz (${response.paymentMode.toUpperCase()} payment)...`);
      window.location.href = response.gatewayUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Payment start failed. Please retry.');
    }
  };

  const handleRetry = async (transactionId) => {
    setError('');
    setSuccess('');
    try {
      const response = await retryPayment(transactionId);
      setSuccess('Retry initialized. Redirecting to SSLCommerz...');
      window.location.href = response.gatewayUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Retry could not be started.');
    }
  };

  const handleGetReceipt = async (transactionId) => {
    setError('');
    setSuccess('');
    try {
      const data = await getReceipt(transactionId);
      setReceipt(data);
      setSuccess('Digital receipt generated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load receipt');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p className="dashboard-subtitle">Secure SSLCommerz payments with full or advance options</p>
      </div>

      {error && <div className="alert-message error">{error}</div>}
      {success && <div className="alert-message success">{success}</div>}

      <div className="dashboard-grid">
        <div className="quick-actions-section">
          <h2>Payment Methods</h2>
          <div className="action-cards">
            <div className="action-card">
              <div className="icon">📱</div>
              <h3>bKash</h3>
              <p>Instant wallet payment</p>
            </div>
            <div className="action-card">
              <div className="icon">📲</div>
              <h3>Nagad</h3>
              <p>Fast checkout flow</p>
            </div>
            <div className="action-card">
              <div className="icon">🚀</div>
              <h3>Rocket</h3>
              <p>Secure gateway option</p>
            </div>
            <div className="action-card">
              <div className="icon">💳</div>
              <h3>Cards</h3>
              <p>Visa, MasterCard, Amex</p>
            </div>
          </div>
        </div>

        <div className="recent-bookings-section">
          <h2>Bookings & Payment Actions</h2>
          <p className="helper-note">Advance payment is configured at {advancePercent}% for first payment.</p>
          {loading ? (
            <div className="empty-state">
              <p>Loading booking payments...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings found yet.</p>
            </div>
          ) : (
            <div className="payment-booking-list">
              {bookings.map((booking) => (
                <div className="payment-booking-item" key={booking._id}>
                  <div>
                    <h3>{booking.vehicleName}</h3>
                    <p>Vendor: {booking.vendor?.vendorDetails?.businessName || booking.vendor?.name || 'N/A'}</p>
                    <p>Pickup: {new Date(booking.pickupDate).toLocaleDateString()}</p>
                    <p>Total: BDT {booking.totalAmount}</p>
                    <p>Paid: BDT {booking.paidAmount} | Due: BDT {booking.dueAmount}</p>
                    <p>Status: {booking.paymentStatus}</p>
                    {booking.latestTransaction && (
                      <p>
                        Last Txn: {booking.latestTransaction.transactionId} ({booking.latestTransaction.status})
                      </p>
                    )}
                  </div>

                  <div className="payment-actions">
                    {booking.paymentStatus !== 'paid' && (
                      <button className="btn btn-primary" onClick={() => handlePay(booking._id, 'full')}>
                        Pay Full
                      </button>
                    )}

                    {booking.paymentStatus === 'unpaid' && (
                      <button className="btn btn-secondary" onClick={() => handlePay(booking._id, 'advance')}>
                        Pay {advancePercent}% Advance
                      </button>
                    )}

                    {(booking.latestTransaction?.status === 'failed' || booking.latestTransaction?.status === 'cancelled') && (
                      <button className="btn btn-danger" onClick={() => handleRetry(booking.latestTransaction.transactionId)}>
                        Retry Payment
                      </button>
                    )}

                    {booking.latestTransaction?.status === 'success' && (
                      <button className="btn btn-secondary" onClick={() => handleGetReceipt(booking.latestTransaction.transactionId)}>
                        View Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
          {receipt && (
            <div className="receipt-panel">
              <h3>Digital Receipt</h3>
              <p>Receipt No: {receipt.receipt?.receiptNo}</p>
              <p>Transaction ID: {receipt.transactionId}</p>
              <p>Payment Method: {receipt.paymentMethod}</p>
              <p>Amount: BDT {receipt.amount}</p>
              <p>Issued At: {new Date(receipt.receipt?.issuedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="stats-section">
          <h2>Payment Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalBookings}</div>
              <div className="stat-label">Total Bookings</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">BDT {stats.amountSpent.toFixed(0)}</div>
              <div className="stat-label">Amount Paid</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">BDT {stats.dueAmount.toFixed(0)}</div>
              <div className="stat-label">Remaining Due</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
