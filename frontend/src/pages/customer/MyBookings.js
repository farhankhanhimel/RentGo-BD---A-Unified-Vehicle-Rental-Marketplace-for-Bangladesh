import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import ReviewModal from '../../components/ReviewModal';
import '../../styles/BookingPages.css';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [reviewModal, setReviewModal] = useState(null);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const res = await api.get(`/bookings/my${params}`);
            setBookings(res.data.bookings);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, [filter]);

    const handleCancel = async (id) => {
        const reason = window.prompt('Reason for cancellation (optional):');
        try {
            await api.patch(`/bookings/${id}/cancel`, { reason: reason || 'Customer cancelled' });
            setToast({ type: 'success', msg: 'Booking cancelled' });
            setTimeout(() => setToast(null), 3000);
            fetchBookings();
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.message || 'Cancel failed' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const cancellableStatuses = ['pending_vendor_approval', 'vendor_approved', 'payment_awaited', 'confirmed'];
    const statuses = ['all', 'pending_vendor_approval', 'confirmed', 'completed', 'cancelled'];

    const getVehiclePhoto = (b) => {
        if (b.vehicleId?.media?.photos?.length > 0) return b.vehicleId.media.photos[0].url;
        return null;
    };

    const getVehicleName = (b) => {
        if (b.vehicleId?.specs) return `${b.vehicleId.specs.make} ${b.vehicleId.specs.model}`;
        return 'Vehicle';
    };

    return (
        <div className="bookings-container">
            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
            <h1>My Bookings</h1>

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
                <div className="empty-state-card"><div className="emoji">📋</div><h3>No bookings found</h3><p>Book a vehicle to get started!</p></div>
            ) : (
                <div className="booking-list">
                    {bookings.map((b) => (
                        <div key={b._id} className="booking-item">
                            {getVehiclePhoto(b) ? (
                                <img src={getVehiclePhoto(b)} alt="" className="booking-item-image" />
                            ) : (
                                <div className="booking-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🚗</div>
                            )}
                            <div className="booking-item-info">
                                <h3>{getVehicleName(b)}</h3>
                                <div className="booking-id">{b.bookingId}</div>
                                <div className="booking-dates">
                                    {b.tripDetails?.startDate && new Date(b.tripDetails.startDate).toLocaleDateString()} →{' '}
                                    {b.tripDetails?.endDate && new Date(b.tripDetails.endDate).toLocaleDateString()}
                                </div>
                                <span className={`status-badge ${b.status}`} style={{ marginTop: '0.3rem', display: 'inline-block' }}>
                                    {b.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="booking-item-actions">
                                <div className="booking-total">৳{b.pricing?.totalAmount?.toLocaleString()}</div>
                                {b.status === 'payment_awaited' && (
                                    <button
                                        className="btn-pay-booking"
                                        style={{ background: '#48bb78', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.5rem' }}
                                        onClick={async () => {
                                            try {
                                                await api.patch(`/bookings/${b._id}/pay`);
                                                setToast({ type: 'success', msg: 'Payment successful!' });
                                                setTimeout(() => setToast(null), 3000);
                                                fetchBookings();
                                            } catch (err) {
                                                setToast({ type: 'error', msg: err.response?.data?.message || 'Payment failed' });
                                                setTimeout(() => setToast(null), 3000);
                                            }
                                        }}
                                    >💳 Pay Now</button>
                                )}
                                {cancellableStatuses.includes(b.status) && (
                                    <button className="btn-cancel-booking" onClick={() => handleCancel(b._id)}>Cancel</button>
                                )}
                                {b.status === 'completed' && (
                                    <button
                                        className="btn-review-booking"
                                        onClick={() => setReviewModal({
                                            bookingId: b._id,
                                            vehicleId: b.vehicleId?._id,
                                            vehicleName: getVehicleName(b),
                                            withDriver: b.tripDetails?.withDriver,
                                        })}
                                    >
                                        ⭐ Rate Trip
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {reviewModal && (
                <ReviewModal
                    {...reviewModal}
                    onClose={() => { setReviewModal(null); fetchBookings(); }}
                />
            )}
        </div>
    );
};

export default MyBookings;
