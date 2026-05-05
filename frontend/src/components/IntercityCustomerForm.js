import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/IntercityCustomerForm.css';

const IntercityCustomerForm = ({ onRequestCreated, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pickupPoint: '',
    dropPoint: '',
    startDate: '',
    endDate: '',
    passengers: 1,
    vehicleType: '',
    budget: '',
    withDriver: true,
    returnTrip: false,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.origin || !formData.destination) {
      setError('Origin and destination are required');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Travel dates are required');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/intercity-requests', {
        origin: formData.origin,
        destination: formData.destination,
        pickupPoint: formData.pickupPoint,
        dropPoint: formData.dropPoint,
        startDate: formData.startDate,
        endDate: formData.endDate,
        passengers: parseInt(formData.passengers),
        vehicleType: formData.vehicleType,
        budget: formData.budget ? parseInt(formData.budget) : 0,
        withDriver: formData.withDriver,
        returnTrip: formData.returnTrip,
        notes: formData.notes,
      });

      setCreatedRequest(response.data);
      setSuccess(true);

      if (onRequestCreated) {
        onRequestCreated(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const citiesList = [
    'Dhaka',
    "Cox's Bazar",
    'Sylhet',
    'Chittagong',
    'Rajshahi',
    'Khulna',
    'Barisal',
    'Mymensingh',
  ];

  const vehicleTypes = [
    'Car',
    'Microbus',
    'Van',
    'SUV',
    'Sedan',
    'Hatchback',
  ];

  return (
    <div className="intercity-form-overlay">
      <div className="intercity-form-container">
        <button className="close-btn" onClick={onClose}>✕</button>

        {!success ? (
          <>
            <h2>Intercity Ride Request</h2>
            <p className="form-description">
              Tell vendors your travel requirements and they'll send you offers
            </p>

            <form onSubmit={handleSubmit} className="intercity-form">
              {/* Origin & Destination */}
              <div className="form-row">
                <div className="form-group">
                  <label>From (Origin) *</label>
                  <select
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select origin</option>
                    {citiesList.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>To (Destination) *</label>
                  <select
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select destination</option>
                    {citiesList.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pickup & Drop Points */}
              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Point (Specific Location)</label>
                  <input
                    type="text"
                    name="pickupPoint"
                    value={formData.pickupPoint}
                    onChange={handleInputChange}
                    placeholder="e.g., Motijheel, Gulshan"
                  />
                </div>

                <div className="form-group">
                  <label>Drop Point (Specific Location)</label>
                  <input
                    type="text"
                    name="dropPoint"
                    value={formData.dropPoint}
                    onChange={handleInputChange}
                    placeholder="e.g., Airport, Hotel"
                  />
                </div>
              </div>

              {/* Travel Dates */}
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate}
                    required
                  />
                </div>
              </div>

              {/* Passengers & Vehicle Type */}
              <div className="form-row">
                <div className="form-group">
                  <label>Number of Passengers *</label>
                  <input
                    type="number"
                    name="passengers"
                    value={formData.passengers}
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Preferred Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                  >
                    <option value="">Any</option>
                    {vehicleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label>Your Budget (Optional)</label>
                <div className="budget-input">
                  <span className="currency">₳</span>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <small>Vendors will see your budget range</small>
              </div>

              {/* Checkboxes */}
              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="withDriver"
                    checked={formData.withDriver}
                    onChange={handleInputChange}
                  />
                  <span>With Driver</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="returnTrip"
                    checked={formData.returnTrip}
                    onChange={handleInputChange}
                  />
                  <span>Return Trip Needed</span>
                </label>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special requirements or preferences?"
                  rows="3"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Creating Request...' : 'Create Request'}
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Request Created Successfully!</h3>
            <p>Vendors will see your request and send you offers soon.</p>

            <div className="request-summary">
              <div className="summary-item">
                <strong>Route:</strong>
                <span>
                  {createdRequest.origin} → {createdRequest.destination}
                </span>
              </div>
              <div className="summary-item">
                <strong>Travel Dates:</strong>
                <span>
                  {new Date(createdRequest.startDate).toLocaleDateString()} to{' '}
                  {new Date(createdRequest.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="summary-item">
                <strong>Passengers:</strong>
                <span>{createdRequest.passengers}</span>
              </div>
              {createdRequest.budget > 0 && (
                <div className="summary-item">
                  <strong>Budget:</strong>
                  <span>₳{createdRequest.budget}</span>
                </div>
              )}
            </div>

            <div className="info-box">
              <p>
                You'll receive notifications when vendors submit offers. You can
                negotiate prices, ask questions, or accept offers directly in the chat.
              </p>
            </div>

            <button onClick={onClose} className="close-success-btn">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntercityCustomerForm;
