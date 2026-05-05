import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import VendorReviewModal from '../../components/VendorReviewModal';
import '../../styles/BookingPages.css';

const BookingRequests = () => {
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState('pending_vendor_approval');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [declineId, setDeclineId] = useState(null);
    const [declineReason, setDeclineReason] = useState('');
    const [reviewModal, setReviewModal] = useState(null);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const res = await api.get(`/bookings/vendor${params}`);
            setBookings(res.data.bookings);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, [filter]);

    const handleRespond = async (id, action) => {
        try {
            const body = { action };
            if (action === 'decline') body.reason = declineReason || 'No reason provided';
            await api.patch(`/bookings/${id}/respond`, body);
            setToast({ type: 'success', msg: `Booking ${action}d` });
            setTimeout(() => setToast(null), 3000);
            setDeclineId(null);
            setDeclineReason('');
            fetchBookings();
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.message || 'Action failed' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.patch(`/bookings/${id}/status`, { status });
            setToast({ type: 'success', msg: `Booking marked as ${status}` });
            setTimeout(() => setToast(null), 3000);
            fetchBookings();
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.message || 'Update failed' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const getTimeLeft = (createdAt, expiresAt) => {
        if (!expiresAt) return null;
        const left = new Date(expiresAt) - new Date();
        if (left <= 0) return 'Expired';
        const hours = Math.floor(left / 3600000);
        const mins = Math.floor((left % 3600000) / 60000);
        return `${hours}h ${mins}m left`;
    };

    const getVehicleName = (b) => {
        if (b.vehicle?.make) return `${b.vehicle.make} ${b.vehicle.model}`;
        if (b.vehicleId?.make) return `${b.vehicleId.make} ${b.vehicleId.model}`;
        if (b.vehicleId?.specs) return `${b.vehicleId.specs.make} ${b.vehicleId.specs.model}`;
        if (b.vehicleIdLegacy?.specs) return `${b.vehicleIdLegacy.specs.make} ${b.vehicleIdLegacy.specs.model}`;
        return 'Vehicle';
    };

    const statuses = ['pending_vendor_approval', 'all', 'confirmed', 'ongoing', 'completed', 'cancelled'];

    return (
        <div className="bookings-container">
            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
            <h1>Booking Requests</h1>

            <div className="status-tabs">
                {statuses.map((s) => (
                    <button key={s} className={`status-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="empty-state-card"><div className="emoji">⏳</div><h3>Loading...</h3></div>
            ) : bookings.length === 0 ? (
                <div className="empty-state-card"><div className="emoji">📋</div><h3>No bookings found</h3></div>
            ) : (
                <div className="booking-list">
                    {bookings.map((b) => (
                        <div key={b._id} className="booking-item">
                            <div className="booking-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🚗</div>
                            <div className="booking-item-info">
                                <h3>{getVehicleName(b)}</h3>
                                <div className="booking-id">{b.bookingId}</div>
                                <div className="booking-dates">
                                    {new Date(b.tripDetails?.startDate).toLocaleDateString()} →{' '}
                                    {new Date(b.tripDetails?.endDate).toLocaleDateString()}
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '0.25rem' }}>
                                    Customer: {b.customerId?.name || 'Unknown'} • {b.tripDetails?.tripType || '—'}
                                </p>
                                <span className={`status-badge ${b.status}`} style={{ marginTop: '0.3rem', display: 'inline-block' }}>
                                    {b.status.replace(/_/g, ' ')}
                                </span>
                                {b.status === 'pending_vendor_approval' && b.expiresAt && (
                                    <span className="countdown-timer" style={{ marginLeft: '0.5rem' }}>
                                        ⏰ {getTimeLeft(b.createdAt, b.expiresAt)}
                                    </span>
                                )}
                            </div>
                            <div className="booking-item-actions">
                                <div className="booking-total">৳{b.pricing?.totalAmount?.toLocaleString()}</div>

                                {b.status === 'pending_vendor_approval' && (
                                    <div className="response-actions">
                                        <button className="btn-accept" onClick={() => handleRespond(b._id, 'approve')}>✅ Accept</button>
                                        <button className="btn-decline" onClick={() => setDeclineId(declineId === b._id ? null : b._id)}>
                                            ❌ Decline
                                        </button>
                                    </div>
                                )}

                                {b.status === 'confirmed' && (
                                    <button
                                        className="btn-accept"
                                        onClick={() => handleStatusUpdate(b._id, 'ongoing')}
                                    >
                                        ▶️ Start Trip
                                    </button>
                                )}

                                {b.status === 'ongoing' && (
                                    <button
                                        className="btn-accept"
                                        onClick={() => handleStatusUpdate(b._id, 'completed')}
                                    >
                                        ✅ Mark Completed
                                    </button>
                                )}

                                {b.status === 'completed' && (
                                    <button
                                        className="btn-review-booking"
                                        onClick={() => setReviewModal({
                                            bookingId: b._id,
                                            customerName: b.customerId?.name || 'Customer',
                                        })}
                                    >
                                        ⭐ Rate Customer
                                    </button>
                                )}

                                {declineId === b._id && (
                                    <div style={{ marginTop: '0.5rem', width: '100%' }}>
                                        <input
                                            className="decline-reason-input"
                                            placeholder="Reason for declining..."
                                            value={declineReason}
                                            onChange={(e) => setDeclineReason(e.target.value)}
                                            style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', width: '100%' }}
                                        />
                                        <button
                                            className="btn-decline"
                                            style={{ marginTop: '0.5rem', width: '100%' }}
                                            onClick={() => handleRespond(b._id, 'decline')}
                                        >
                                            Confirm Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {reviewModal && (
                <VendorReviewModal
                    {...reviewModal}
                    onClose={() => { setReviewModal(null); fetchBookings(); }}
                />
            )}
        </div>
    );
};

export default BookingRequests;
