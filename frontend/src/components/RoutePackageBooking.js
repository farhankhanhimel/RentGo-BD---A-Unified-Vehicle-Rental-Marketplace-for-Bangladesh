import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/RoutePackageBooking.css';

const RoutePackageBooking = ({ packageId, packageDetails, onClose, onBookingSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    travelDate: '',
    passengers: 1,
    specialRequests: '',
  });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'passengers' ? parseInt(value) : value,
    }));
  };

  const calculatePrice = () => {
    if (!packageDetails) return 0;
    return packageDetails.priceMin * formData.passengers;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.travelDate) {
      setError('Please select a travel date');
      setLoading(false);
      return;
    }

    if (formData.passengers < 1 || formData.passengers > (packageDetails?.maxPassengers || 4)) {
      setError(`Passengers must be between 1 and ${packageDetails?.maxPassengers || 4}`);
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/route-packages/bookings/create', {
        packageId,
        travelDate: formData.travelDate,
        passengers: formData.passengers,
        specialRequests: formData.specialRequests,
      });

      setBooking(response.data);
      setSuccess(true);

      if (onBookingSuccess) {
        onBookingSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="route-package-booking">
      <div className="booking-container">
        <button className="close-btn" onClick={onClose}>✕</button>

        {!success ? (
          <>
            <h2>Book Route Package</h2>
            {packageDetails && (
              <div className="package-info">
                <div className="info-row">
                  <span className="label">Route:</span>
                  <span className="value">{packageDetails.routeName}</span>
                </div>
                <div className="info-row">
                  <span className="label">From:</span>
                  <span className="value">{packageDetails.origin}</span>
                </div>
                <div className="info-row">
                  <span className="label">To:</span>
                  <span className="value">{packageDetails.destination}</span>
                </div>
                <div className="info-row">
                  <span className="label">Price Range:</span>
                  <span className="value">
                    ₳{packageDetails.priceMin} - ₳{packageDetails.priceMax}
                  </span>
                </div>
                {packageDetails.inclusions && packageDetails.inclusions.length > 0 && (
                  <div className="info-row">
                    <span className="label">Inclusions:</span>
                    <ul className="value">
                      {packageDetails.inclusions.map((inc, idx) => (
                        <li key={idx}>{inc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label>Travel Date *</label>
                <input
                  type="date"
                  name="travelDate"
                  value={formData.travelDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Number of Passengers *</label>
                  <input
                    type="number"
                    name="passengers"
                    value={formData.passengers}
                    onChange={handleInputChange}
                    min="1"
                    max={packageDetails?.maxPassengers || 4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Max Passengers</label>
                  <input
                    type="text"
                    disabled
                    value={packageDetails?.maxPassengers || 4}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Special Requests</label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  placeholder="Any special requirements or requests?"
                  rows="3"
                />
              </div>

              <div className="price-summary">
                <div className="summary-row">
                  <span>Base Price:</span>
                  <span>₳{packageDetails?.priceMin || 0} × {formData.passengers}</span>
                </div>
                <div className="summary-row">
                  <span>Total Amount:</span>
                  <span className="total">₳{calculatePrice()}</span>
                </div>
                <div className="summary-row deposit">
                  <span>Deposit (20%):</span>
                  <span className="deposit-amount">₳{Math.ceil(calculatePrice() * 0.2)}</span>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Booking Confirmed!</h3>
            <p>Your booking request has been sent to the vendor.</p>
            <div className="booking-details">
              <p><strong>Booking ID:</strong> {booking.bookingId}</p>
              <p><strong>Status:</strong> <span className="status-badge pending">{booking.status}</span></p>
              <p><strong>Total Amount:</strong> ₳{booking.pricing.totalAmount}</p>
            </div>
            <p className="info-text">
              The vendor will review your booking and confirm it within 24 hours.
              You'll receive a notification once they respond.
            </p>
            <button onClick={onClose} className="close-success-btn">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutePackageBooking;
