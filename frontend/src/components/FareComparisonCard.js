import React from 'react';

/**
 * FareComparisonCard — Reusable card component for displaying fare comparison results.
 * Extracted from FareEstimator.js for modularity and reusability.
 *
 * Props:
 *   offer         — Vendor offer object from fare estimation API
 *   formatPrice   — Function to format price as ৳X,XXX
 *   getVehicleEmoji — Function to get emoji for vehicle type
 */
const FareComparisonCard = ({ offer, formatPrice, getVehicleEmoji }) => {
  return (
    <div className="fare-offer-card">
      <div className="offer-card-top">
        {offer.photo ? (
          <img src={offer.photo} alt={offer.vehicleName} className="offer-vehicle-img" />
        ) : (
          <div className="offer-vehicle-placeholder">{getVehicleEmoji(offer.vehicleType)}</div>
        )}
        {offer.isVerified && <span className="offer-verified-badge">✓ Verified</span>}
      </div>
      <div className="offer-card-body">
        <h4 className="offer-vehicle-name">{offer.vehicleName}</h4>
        <p className="offer-vendor-name">{offer.vendorName}</p>

        {offer.rating > 0 && (
          <div className="offer-rating">
            {'⭐'.repeat(Math.round(offer.rating))} <span>{offer.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="offer-features">
          {offer.features?.seats && <span>🪑 {offer.features.seats}</span>}
          {offer.features?.ac && <span>❄️ AC</span>}
          {offer.features?.transmission && <span>⚙️ {offer.features.transmission}</span>}
        </div>

        <div className="offer-price-section">
          <span className="offer-total-fare">{formatPrice(offer.estimatedFare)}</span>
          <span className="offer-fare-label">estimated total</span>
        </div>

        {/* Fare Breakdown */}
        <div className="offer-breakdown">
          <div className="breakdown-row">
            <span>Base ({offer.fareBreakdown.days} day{offer.fareBreakdown.days !== 1 ? 's' : ''})</span>
            <span>{formatPrice(offer.fareBreakdown.baseFare)}</span>
          </div>
          {offer.fareBreakdown.driverFee > 0 && (
            <div className="breakdown-row">
              <span>Driver Fee</span>
              <span>{formatPrice(offer.fareBreakdown.driverFee)}</span>
            </div>
          )}
          {offer.fareBreakdown.fuelEstimate > 0 && (
            <div className="breakdown-row">
              <span>Fuel Estimate</span>
              <span>{formatPrice(offer.fareBreakdown.fuelEstimate)}</span>
            </div>
          )}
        </div>

        <div className="offer-card-actions">
          <button className="btn btn-outline btn-block offer-details-btn">
            View Details
          </button>
          <button
            className="btn btn-primary btn-block offer-book-btn"
            onClick={() => {
              if (offer.vehicleId) {
                window.location.href = `/vehicles/${offer.vehicleId}`;
              }
            }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default FareComparisonCard;
