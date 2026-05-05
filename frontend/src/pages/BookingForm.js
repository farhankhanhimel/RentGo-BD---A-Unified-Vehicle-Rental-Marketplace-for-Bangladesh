import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/BookingPages.css';

const BookingForm = () => {
    const { vehicleId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        startDate: state.dates?.start || '',
        endDate: state.dates?.end || '',
        pickupAddress: state.pickupAddress || '',
        dropAddress: state.dropAddress || '',
        tripType: state.tripType || 'tourism',
        withDriver: state.withDriver || false,
        isEmergency: state.isEmergency || false,
        specialNotes: state.specialNotes || '',
        bookingMode: state.bookingMode || 'request',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.startDate || !formData.endDate) {
            setToast({ type: 'error', msg: 'Please select trip dates' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            setToast({ type: 'error', msg: 'End date must be after start date' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(formData.startDate) < today) {
            setToast({ type: 'error', msg: 'Start date cannot be in the past' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/bookings/', {
                vehicleId,
                bookingMode: formData.bookingMode,
                tripDetails: {
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    pickupLocation: { address: formData.pickupAddress },
                    dropLocation: { address: formData.dropAddress },
                    tripType: formData.tripType,
                    withDriver: formData.withDriver,
                    specialNotes: formData.specialNotes,
                },
                isEmergency: formData.isEmergency,
                emergencyNotes: formData.isEmergency ? formData.specialNotes : '',
                routePackage: state.routePackage,
            });

            setToast({ type: 'success', msg: res.data.message });
            setTimeout(() => navigate(`/checkout/${res.data.booking._id}`, { state: { booking: res.data.booking } }), 1200);
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.message || 'Booking failed' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const tripTypes = [
        { value: 'tourism', label: '🏖️ Tourism' },
        { value: 'airport', label: '✈️ Airport' },
        { value: 'wedding', label: '💒 Wedding' },
        { value: 'office', label: '🏢 Office' },
        { value: 'emergency', label: '🚨 Emergency' },
    ];

    return (
        <div className="booking-form-container">
            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

            <h1>Book {state.vehicleName || 'Vehicle'}</h1>

            {state.routePackage && (
                <div className="booking-card">
                    <h2>Intercity Package</h2>
                    <div className="cost-summary-card">
                        <div className="cost-row"><span>Route</span><span>{state.routePackage.routeName}</span></div>
                        <div className="cost-row"><span>From</span><span>{state.routePackage.origin}</span></div>
                        <div className="cost-row"><span>To</span><span>{state.routePackage.destination}</span></div>
                        <div className="cost-row"><span>Passengers</span><span>{state.routePackage.passengers}</span></div>
                        {state.routePackage.returnTrip && <div className="cost-row"><span>Return support</span><span>Requested</span></div>}
                    </div>
                </div>
            )}

            <span className={`booking-mode-badge ${formData.bookingMode}`}>
                {formData.bookingMode === 'instant' ? '⚡ Instant Booking' : '📨 Request Booking — vendor confirms within 24h'}
            </span>

            <form onSubmit={handleSubmit}>
                {/* Trip Dates */}
                <div className="booking-card">
                    <h2>📅 Trip Dates</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Start Date *</label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>End Date *</label>
                            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                        </div>
                    </div>
                </div>

                {/* Locations */}
                <div className="booking-card">
                    <h2>📍 Locations</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Pickup Location</label>
                            <input name="pickupAddress" placeholder="Enter pickup address" value={formData.pickupAddress} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Drop Location</label>
                            <input name="dropAddress" placeholder="Enter drop address" value={formData.dropAddress} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Trip Type */}
                <div className="booking-card">
                    <h2>🎯 Trip Type</h2>
                    <div className="trip-type-selector">
                        {tripTypes.map((t) => (
                            <div
                                key={t.value}
                                className={`trip-type-option ${formData.tripType === t.value ? 'active' : ''}`}
                                onClick={() => setFormData((prev) => ({ ...prev, tripType: t.value }))}
                            >
                                {t.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Options */}
                <div className="booking-card">
                    <h2>⚙️ Options</h2>
                    <div className="checkbox-group">
                        <input type="checkbox" name="withDriver" checked={formData.withDriver} onChange={handleChange} id="bk-driver" />
                        <label htmlFor="bk-driver">Include Driver</label>
                    </div>
                    <div className="checkbox-group" style={{ marginTop: '0.75rem' }}>
                        <input type="checkbox" name="isEmergency" checked={formData.isEmergency} onChange={handleChange} id="bk-emergency" />
                        <label htmlFor="bk-emergency">Emergency booking - notify nearby vendors immediately</label>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Special Notes</label>
                        <textarea
                            name="specialNotes"
                            placeholder={formData.isEmergency ? 'Describe the emergency and any priority instructions...' : 'Any special requirements...'}
                            value={formData.specialNotes}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Booking Mode */}
                <div className="booking-card">
                    <h2>📋 Booking Mode</h2>
                    <div className="form-grid">
                        <div
                            className={`trip-type-option ${formData.bookingMode === 'request' ? 'active' : ''}`}
                            onClick={() => setFormData((prev) => ({ ...prev, bookingMode: 'request' }))}
                        >
                            📨 Request
                        </div>
                        <div
                            className={`trip-type-option ${formData.bookingMode === 'instant' ? 'active' : ''}`}
                            onClick={() => setFormData((prev) => ({ ...prev, bookingMode: 'instant' }))}
                        >
                            ⚡ Instant
                        </div>
                    </div>
                </div>

                {/* Cost Summary */}
                {state.estimate && (
                    <div className="booking-card">
                        <h2>💰 Cost Summary</h2>
                        <div className="cost-summary-card">
                            <div className="cost-row"><span>Base Rate ({state.estimate.days} days)</span><span>৳{state.estimate.baseRate?.toLocaleString()}</span></div>
                            {state.estimate.driverFee > 0 && <div className="cost-row"><span>Driver Fee</span><span>৳{state.estimate.driverFee?.toLocaleString()}</span></div>}
                            <div className="cost-row"><span>Service Fee</span><span>৳{state.estimate.serviceFee?.toLocaleString()}</span></div>
                            {state.estimate.multiDayDiscount > 0 && <div className="cost-row" style={{ color: '#48bb78' }}><span>Discount</span><span>-৳{state.estimate.multiDayDiscount?.toLocaleString()}</span></div>}
                            <div className="cost-row total"><span>Total</span><span>৳{state.estimate.total?.toLocaleString()}</span></div>
                            <div className="cost-row advance"><span>Advance Payment (30%)</span><span>৳{state.estimate.advanceAmount?.toLocaleString()}</span></div>
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="button" className="btn-prev" onClick={() => navigate(-1)}>← Cancel</button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Submitting...' : '✅ Confirm Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BookingForm;
