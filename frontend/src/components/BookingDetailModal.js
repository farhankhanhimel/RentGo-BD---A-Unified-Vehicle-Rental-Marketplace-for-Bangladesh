import React, { useState } from 'react';
import BookingStatusBadge from './BookingStatusBadge';
import InvoiceButton from './InvoiceButton';
import './BookingDetailModal.css';

const BookingDetailModal = ({ booking, onClose, onStatusUpdate, onPaymentUpdate }) => {
  const [statusAction, setStatusAction] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  if (!booking) return null;

  const validTransitions = {
    pending: ['confirmed', 'declined'],
    confirmed: ['vehicle_handed_over', 'cancelled'],
    vehicle_handed_over: ['trip_started'],
    trip_started: ['trip_completed'],
  };

  const nextStatuses = validTransitions[booking.status] || [];

  const handleStatusUpdate = async () => {
    if (!statusAction) return;
    setUpdating(true);
    try {
      await onStatusUpdate(booking._id, {
        status: statusAction,
        note: actionNote,
        reason: declineReason,
      });
      setStatusAction('');
      setActionNote('');
      setDeclineReason('');
    } catch (err) {
      console.error(err);
    }
    setUpdating(false);
  };

  const handlePaymentUpdate = async () => {
    setUpdating(true);
    try {
      await onPaymentUpdate(booking._id, {
        paymentStatus: paymentStatus || undefined,
        advancePaid: advancePaid ? parseFloat(advancePaid) : undefined,
        transactionId: transactionId || undefined,
      });
      setPaymentStatus('');
      setAdvancePaid('');
      setTransactionId('');
    } catch (err) {
      console.error(err);
    }
    setUpdating(false);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    if (!booking.tripDetails?.pickupDate || !booking.tripDetails?.returnDate) return 'N/A';
    const start = new Date(booking.tripDetails.pickupDate);
    const end = new Date(booking.tripDetails.returnDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <h2>{booking.bookingId}</h2>
            <div className="modal-badges">
              <BookingStatusBadge status={booking.status} />
              <BookingStatusBadge status={booking.paymentStatus} type="payment" />
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {['details', 'payment', 'timeline', 'actions'].map((tab) => (
            <button
              key={tab}
              className={`modal-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {activeTab === 'details' && (
            <div className="tab-content">
              {/* Customer Info */}
              <div className="detail-section">
                <h3>👤 Customer Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{booking.customer?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{booking.customer?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{booking.customer?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="detail-section">
                <h3>🚗 Vehicle Details</h3>
                <div className="detail-vehicle-card">
                  {booking.vehicle?.photos?.[0] ? (
                    <img
                      src={booking.vehicle.photos[0]}
                      alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                      className="detail-vehicle-img"
                    />
                  ) : (
                    <div className="detail-vehicle-placeholder">🚗</div>
                  )}
                  <div className="detail-vehicle-info">
                    <h4>{booking.vehicle?.make} {booking.vehicle?.model} ({booking.vehicle?.year})</h4>
                    <p className="detail-vehicle-type">{booking.vehicle?.vehicleType}</p>
                    <div className="detail-vehicle-features">
                      {booking.vehicle?.features?.seats && (
                        <span>🪑 {booking.vehicle.features.seats} Seats</span>
                      )}
                      {booking.vehicle?.features?.ac && <span>❄️ AC</span>}
                      {booking.vehicle?.features?.transmission && (
                        <span>⚙️ {booking.vehicle.features.transmission}</span>
                      )}
                      {booking.vehicle?.features?.fuelType && (
                        <span>⛽ {booking.vehicle.features.fuelType}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="detail-section">
                <h3>📍 Trip Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Pickup Location</span>
                    <span className="detail-value">{booking.tripDetails?.pickupLocation || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Dropoff Location</span>
                    <span className="detail-value">{booking.tripDetails?.dropoffLocation || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Pickup Date</span>
                    <span className="detail-value">{formatDate(booking.tripDetails?.pickupDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Return Date</span>
                    <span className="detail-value">{formatDate(booking.tripDetails?.returnDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{getDuration()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Trip Type</span>
                    <span className="detail-value trip-type-badge">
                      {booking.tripDetails?.tripType || 'other'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Mode */}
              <div className="detail-section">
                <h3>📋 Booking Info</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Booking Mode</span>
                    <span className="detail-value">{booking.bookingMode}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{formatDate(booking.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="tab-content">
              <div className="detail-section">
                <h3>💰 Fare Breakdown</h3>
                <div className="fare-breakdown-table">
                  <div className="fare-row">
                    <span>Base Rate</span>
                    <span>৳{booking.pricing?.baseRate?.toLocaleString()}</span>
                  </div>
                  {booking.pricing?.driverFee > 0 && (
                    <div className="fare-row">
                      <span>Driver Fee</span>
                      <span>৳{booking.pricing.driverFee.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.pricing?.fuelCharge > 0 && (
                    <div className="fare-row">
                      <span>Fuel Charge</span>
                      <span>৳{booking.pricing.fuelCharge.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.pricing?.serviceFee > 0 && (
                    <div className="fare-row">
                      <span>Service Fee</span>
                      <span>৳{booking.pricing.serviceFee.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.pricing?.couponDiscount > 0 && (
                    <div className="fare-row discount-row">
                      <span>Coupon Discount ({booking.pricing.couponCode})</span>
                      <span>−৳{booking.pricing.couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="fare-row total-row">
                    <span>Total Amount</span>
                    <span>৳{booking.pricing?.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="fare-row">
                    <span>Advance Paid</span>
                    <span className="paid-amount">৳{booking.pricing?.advancePaid?.toLocaleString()}</span>
                  </div>
                  <div className="fare-row balance-row">
                    <span>Balance Due</span>
                    <span className={booking.pricing?.balanceDue > 0 ? 'due-amount' : 'paid-amount'}>
                      ৳{booking.pricing?.balanceDue?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Download */}
              {['confirmed', 'vehicle_handed_over', 'trip_started', 'trip_completed'].includes(booking.status) && (
                <div className="detail-section">
                  <h3>🧾 Invoice</h3>
                  <div className="invoice-download-section">
                    <p className="invoice-hint">Download or view the booking invoice as a PDF.</p>
                    <InvoiceButton bookingId={booking.bookingId} variant="default" size="medium" />
                  </div>
                </div>
              )}

              {/* Payment Update Form */}
              <div className="detail-section">
                <h3>💳 Update Payment</h3>
                <div className="payment-form">
                  <div className="form-row">
                    <label>Payment Status</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                      <option value="">No Change</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Advance Amount (৳)</label>
                    <input
                      type="number"
                      placeholder="Enter advance amount"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label>Transaction ID</label>
                    <input
                      type="text"
                      placeholder="bKash/Nagad reference"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handlePaymentUpdate}
                    disabled={updating || (!paymentStatus && !advancePaid && !transactionId)}
                  >
                    {updating ? 'Updating...' : 'Update Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="tab-content">
              <div className="detail-section">
                <h3>📜 Status Timeline</h3>
                <div className="timeline">
                  {booking.statusHistory && booking.statusHistory.length > 0 ? (
                    booking.statusHistory.map((entry, index) => (
                      <div
                        key={index}
                        className={`timeline-item ${index === booking.statusHistory.length - 1 ? 'current' : ''}`}
                      >
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-status">
                            <BookingStatusBadge status={entry.status} />
                          </div>
                          <p className="timeline-note">{entry.note}</p>
                          <span className="timeline-time">{formatDate(entry.timestamp)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-timeline">
                      <p>No status history available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="detail-section">
                <h3>📃 Cancellation Policy</h3>
                <p className="cancellation-policy">{booking.cancellationPolicy}</p>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="tab-content">
              <div className="detail-section">
                <h3>⚡ Quick Actions</h3>
                {nextStatuses.length > 0 ? (
                  <div className="action-form">
                    <div className="action-buttons-row">
                      {nextStatuses.map((nextStatus) => (
                        <button
                          key={nextStatus}
                          className={`action-status-btn ${statusAction === nextStatus ? 'selected' : ''} ${
                            nextStatus === 'declined' || nextStatus === 'cancelled' ? 'danger' : 'success'
                          }`}
                          onClick={() => setStatusAction(nextStatus)}
                        >
                          {nextStatus.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>

                    {statusAction === 'declined' && (
                      <div className="form-row">
                        <label>Reason for Declining</label>
                        <textarea
                          placeholder="Please provide a reason..."
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="form-row">
                      <label>Note (optional)</label>
                      <input
                        type="text"
                        placeholder="Add a note for the customer"
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                      />
                    </div>

                    <button
                      className={`btn ${
                        statusAction === 'declined' || statusAction === 'cancelled'
                          ? 'btn-danger'
                          : 'btn-primary'
                      }`}
                      onClick={handleStatusUpdate}
                      disabled={updating || !statusAction}
                    >
                      {updating ? 'Updating...' : `Update to ${statusAction?.replace(/_/g, ' ')}`}
                    </button>
                  </div>
                ) : (
                  <div className="no-actions">
                    <p>
                      No further status transitions available for <strong>{booking.status}</strong> bookings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
