import React, { useMemo, useState } from 'react';
import routeService from '../services/routeService';
import '../styles/VehicleComparison.css';

const rentalModes = [
  { value: 'with_driver', label: 'With Driver' },
  { value: 'self_drive', label: 'Self Drive' },
];

const vehicleTypes = [
  { value: '', label: 'All Types' },
  { value: 'car', label: 'Car' },
  { value: 'microbus', label: 'Microbus' },
  { value: 'van', label: 'Van' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bus', label: 'Bus' },
];

const compareMetricLabels = {
  estimatedFare: 'Estimated Fare',
  dailyRate: 'Daily Rate',
  rating: 'Rating',
  seats: 'Seats',
  driverAvailability: 'Driver Availability',
  bookingMode: 'Booking Mode',
  isVerified: 'Vendor Badge',
  cancellationPolicy: 'Cancellation Policy',
};

const VehicleComparison = () => {
  const [form, setForm] = useState({
    pickupAddress: '',
    destinationAddress: '',
    rentalMode: 'with_driver',
    vehicleType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [routeMeta, setRouteMeta] = useState(null);
  const [offers, setOffers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedOffers = useMemo(
    () => offers.filter((offer) => selectedIds.includes(String(offer.vehicleId))).slice(0, 4),
    [offers, selectedIds]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEstimate = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        pickup: { address: form.pickupAddress },
        destination: { address: form.destinationAddress },
        rentalMode: form.rentalMode,
      };

      if (form.vehicleType) {
        payload.vehicleType = form.vehicleType;
      }

      const response = await routeService.estimateFare(payload.pickup, payload.destination, {
        rentalMode: payload.rentalMode,
        vehicleType: payload.vehicleType,
      });

      const flattened = (response.estimates || []).flatMap((group) =>
        (group.vendorOffers || []).map((offer) => ({
          ...offer,
          vehicleType: group.vehicleType || offer.vehicleType,
        }))
      );

      setRouteMeta(response.route || null);
      setOffers(flattened);
      setSelectedIds(flattened.slice(0, 2).map((offer) => String(offer.vehicleId)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate comparison right now.');
      setOffers([]);
      setSelectedIds([]);
      setRouteMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (vehicleId) => {
    const id = String(vehicleId);

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const formatCurrency = (value) => `BDT ${Number(value || 0).toLocaleString()}`;

  const renderMetricValue = (offer, key) => {
    if (key === 'estimatedFare' || key === 'dailyRate') {
      return formatCurrency(offer[key]);
    }
    if (key === 'isVerified') {
      return offer.isVerified ? 'Verified' : 'Not Verified';
    }
    if (key === 'seats') {
      return offer.features?.seats || '-';
    }
    if (key === 'rating') {
      return Number(offer.rating || 0).toFixed(1);
    }
    if (key === 'driverAvailability') {
      return offer.driverAvailability === 'available' ? 'Available' : 'Unavailable';
    }
    if (key === 'bookingMode') {
      return offer.bookingMode === 'instant' ? 'Instant' : 'Request';
    }
    return offer[key] || '-';
  };

  return (
    <div className="comparison-page">
      <section className="comparison-hero">
        <h1>Multi-Vendor Vehicle Comparison</h1>
        <p>Pick a route, fetch live offers, and compare up to four vendors side by side.</p>
      </section>

      <form className="comparison-form" onSubmit={handleEstimate}>
        <input
          type="text"
          name="pickupAddress"
          placeholder="Pickup location (address)"
          value={form.pickupAddress}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="destinationAddress"
          placeholder="Destination (address)"
          value={form.destinationAddress}
          onChange={handleChange}
          required
        />
        <select name="rentalMode" value={form.rentalMode} onChange={handleChange}>
          {rentalModes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select name="vehicleType" value={form.vehicleType} onChange={handleChange}>
          {vehicleTypes.map((item) => (
            <option key={item.value || 'all'} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Calculating...' : 'Compare Prices'}
        </button>
      </form>

      {error && <p className="comparison-error">{error}</p>}

      {routeMeta && (
        <section className="comparison-route-meta">
          <span>Distance: {routeMeta.distanceText || `${routeMeta.distanceKm} km`}</span>
          <span>Duration: {routeMeta.durationText || `${routeMeta.durationMinutes} min`}</span>
          <span>Offers Found: {offers.length}</span>
          <span>Selected: {selectedOffers.length}/4</span>
        </section>
      )}

      {offers.length > 0 && (
        <section className="offer-picker">
          {offers.map((offer) => {
            const isChecked = selectedIds.includes(String(offer.vehicleId));
            const disabled = !isChecked && selectedIds.length >= 4;

            return (
              <label key={`${offer.vehicleId}-${offer.vendorId}`} className={`offer-chip ${isChecked ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => toggleSelect(offer.vehicleId)}
                />
                <span>{offer.vehicleName}</span>
                <small>{offer.vendorName}</small>
                <strong>{formatCurrency(offer.estimatedFare)}</strong>
              </label>
            );
          })}
        </section>
      )}

      {selectedOffers.length > 0 && (
        <section className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Criteria</th>
                {selectedOffers.map((offer) => (
                  <th key={`head-${offer.vehicleId}`}>
                    <div>{offer.vehicleName}</div>
                    <small>{offer.vendorName}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(compareMetricLabels).map((metricKey) => (
                <tr key={metricKey}>
                  <td>{compareMetricLabels[metricKey]}</td>
                  {selectedOffers.map((offer) => (
                    <td key={`${offer.vehicleId}-${metricKey}`}>{renderMetricValue(offer, metricKey)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default VehicleComparison;
