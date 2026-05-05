import React from 'react';
import './BookingStatusBadge.css';

const statusConfig = {
  pending: { label: 'Pending', color: '#ff9800', bg: '#fff3e0', icon: '⏳' },
  pending_vendor_approval: { label: 'Pending Approval', color: '#ff9800', bg: '#fff3e0', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#2196f3', bg: '#e3f2fd', icon: '✅' },
  vendor_approved: { label: 'Vendor Approved', color: '#2196f3', bg: '#e3f2fd', icon: '✅' },
  vehicle_handed_over: { label: 'Vehicle Ready', color: '#9c27b0', bg: '#f3e5f5', icon: '🔑' },
  trip_started: { label: 'In Progress', color: '#ff9800', bg: '#fff3e0', icon: '🚗' },
  trip_completed: { label: 'Completed', color: '#4caf50', bg: '#e8f5e9', icon: '🏁' },
  cancelled: { label: 'Cancelled', color: '#f44336', bg: '#ffebee', icon: '❌' },
  declined: { label: 'Declined', color: '#9e9e9e', bg: '#f5f5f5', icon: '🚫' },
  expired: { label: 'Expired', color: '#999', bg: '#f5f5f5', icon: '⌛' },
  payment_awaited: { label: 'Payment Awaiting', color: '#ff9800', bg: '#fff3e0', icon: '💳' },
};

const paymentConfig = {
  pending: { label: 'Unpaid', color: '#ff9800', bg: '#fff3e0' },
  partial: { label: 'Partial', color: '#2196f3', bg: '#e3f2fd' },
  paid: { label: 'Paid', color: '#4caf50', bg: '#e8f5e9' },
  refunded: { label: 'Refunded', color: '#9c27b0', bg: '#f3e5f5' },
};

const BookingStatusBadge = ({ status, type = 'booking' }) => {
  const config = type === 'payment' ? paymentConfig[status] : statusConfig[status];
  if (!config) return <span className="status-badge-unknown">{status}</span>;

  return (
    <span
      className="booking-status-badge"
      style={{
        color: config.color,
        background: config.bg,
        borderColor: config.color,
      }}
    >
      {type === 'booking' && config.icon && <span className="badge-icon">{config.icon}</span>}
      {config.label}
    </span>
  );
};

export default BookingStatusBadge;
export { statusConfig, paymentConfig };
