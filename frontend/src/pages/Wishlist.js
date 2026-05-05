import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import wishlistService from '../services/wishlistService';
import './Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, [page]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await wishlistService.getWishlist(page, 12);
      setWishlist(data.wishlist);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (vehicleId) => {
    setRemovingId(vehicleId);
    try {
      await wishlistService.removeFromWishlist(vehicleId);
      setWishlist((prev) => prev.filter((item) => item.vehicle?._id !== vehicleId));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (price) => {
    return `৳${price?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-header-section">
          <h1>My Wishlist</h1>
          <p className="wishlist-subtitle">Loading your saved vehicles...</p>
        </div>
        <div className="wishlist-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      {/* Header */}
      <div className="wishlist-header-section">
        <h1>My Wishlist</h1>
        <p className="wishlist-subtitle">
          {total > 0
            ? `You have ${total} saved vehicle${total !== 1 ? 's' : ''}`
            : 'Save vehicles you love for easy access later'}
        </p>
      </div>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">❤️</div>
          <h2>Your wishlist is empty</h2>
          <p>Start exploring vehicles and save the ones you like!</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Browse Vehicles
          </button>
        </div>
      ) : (
        <>
          {/* Wishlist Grid */}
          <div className="wishlist-grid">
            {wishlist.map((item) => {
              const vehicle = item.vehicle;
              if (!vehicle) return null;

              return (
                <div
                  key={item._id}
                  className={`wishlist-card ${removingId === vehicle._id ? 'removing' : ''}`}
                >
                  {/* Price Change Badge */}
                  {item.priceChanged && (
                    <div className={`price-change-badge ${item.priceDifference < 0 ? 'price-down' : 'price-up'}`}>
                      {item.priceDifference < 0
                        ? `↓ ${formatPrice(Math.abs(item.priceDifference))} cheaper!`
                        : `↑ ${formatPrice(item.priceDifference)} increase`}
                    </div>
                  )}

                  {/* Vehicle Image */}
                  <div className="wishlist-card-image">
                    {vehicle.photos && vehicle.photos.length > 0 ? (
                      <img src={vehicle.photos[0]} alt={`${vehicle.make} ${vehicle.model}`} />
                    ) : (
                      <div className="wishlist-no-image">
                        <span>🚗</span>
                      </div>
                    )}
                    <button
                      className="wishlist-remove-btn"
                      onClick={() => handleRemove(vehicle._id)}
                      disabled={removingId === vehicle._id}
                      title="Remove from wishlist"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Vehicle Info */}
                  <div className="wishlist-card-body">
                    <div className="wishlist-card-top">
                      <span className="vehicle-type-badge">{vehicle.vehicleType}</span>
                      {vehicle.vendor?.vendorDetails?.isVerified && (
                        <span className="verified-badge-small">✓ Verified</span>
                      )}
                    </div>

                    <h3 className="wishlist-vehicle-name">
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </h3>

                    {vehicle.vendor && (
                      <p className="wishlist-vendor-name">
                        by {vehicle.vendor.vendorDetails?.businessName || vehicle.vendor.name}
                      </p>
                    )}

                    {/* Features */}
                    <div className="wishlist-features">
                      {vehicle.features?.seats && (
                        <span className="feature-tag">🪑 {vehicle.features.seats} seats</span>
                      )}
                      {vehicle.features?.ac && (
                        <span className="feature-tag">❄️ AC</span>
                      )}
                      {vehicle.features?.transmission && (
                        <span className="feature-tag">⚙️ {vehicle.features.transmission}</span>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="wishlist-pricing">
                      <div className="wishlist-price-current">
                        <span className="price-amount">{formatPrice(item.currentPrice)}</span>
                        <span className="price-unit">/day</span>
                      </div>
                      {item.priceChanged && (
                        <span className="price-saved">
                          was {formatPrice(item.priceAtSave)}/day
                        </span>
                      )}
                    </div>

                    {/* Availability */}
                    <div className="wishlist-availability">
                      <span className={`availability-dot ${vehicle.isAvailable ? 'available' : 'unavailable'}`}></span>
                      {vehicle.isAvailable ? 'Available' : 'Not Available'}
                    </div>

                    {/* Actions */}
                    <div className="wishlist-card-actions">
                      <button
                        className="btn btn-primary btn-block"
                        disabled={!vehicle.isAvailable}
                        onClick={() => navigate(`/vehicles/${vehicle._id}`)}
                      >
                        {vehicle.isAvailable ? 'View & Book' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="wishlist-pagination">
              <button
                className="pagination-btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>
              <div className="pagination-info">
                Page {page} of {totalPages}
              </div>
              <button
                className="pagination-btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Wishlist;
