import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import eventPackageService from '../services/eventPackageService';
import './EventPackages.css';

const eventTypeConfig = {
  wedding: { icon: '💒', label: 'Wedding' },
  corporate: { icon: '🏢', label: 'Corporate' },
  tourism: { icon: '🏖️', label: 'Tourism' },
  airport_transfer: { icon: '✈️', label: 'Airport Transfer' },
  concert: { icon: '🎵', label: 'Concert' },
  festival: { icon: '🎉', label: 'Festival' },
  other: { icon: '📦', label: 'Other' },
};

const EventPackages = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    eventType: 'all',
    city: '',
    search: '',
    sortBy: 'createdAt',
    page: 1,
  });

  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    guestCount: '',
    specialRequests: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.eventType !== 'all') params.eventType = filters.eventType;
      if (filters.city) params.city = filters.city;
      if (filters.search) params.search = filters.search;
      params.sortBy = filters.sortBy;
      params.page = filters.page;

      const data = await eventPackageService.getPackages(params);
      setPackages(data.packages);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedPackage || !user) return;
    setBooking(true);
    setError('');
    try {
      await eventPackageService.bookPackage(selectedPackage._id, {
        eventDetails: {
          eventDate: bookingForm.eventDate,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          location: bookingForm.location,
          guestCount: bookingForm.guestCount ? parseInt(bookingForm.guestCount) : undefined,
          specialRequests: bookingForm.specialRequests,
        },
        contactInfo: {
          name: bookingForm.contactName || user.name,
          phone: bookingForm.contactPhone || user.phone,
          email: bookingForm.contactEmail || user.email,
        },
      });
      setBookingSuccess('Package booked successfully! The vendor will confirm shortly.');
      setShowBookingForm(false);
      setBookingForm({
        eventDate: '', startTime: '', endTime: '', location: '',
        guestCount: '', specialRequests: '', contactName: '', contactPhone: '', contactEmail: '',
      });
      setTimeout(() => setBookingSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book package');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="event-packages-container">
      {/* Hero */}
      <div className="ep-hero">
        <h1>🎉 Event & Wedding Packages</h1>
        <p>Premium vehicle rental packages for your special occasions</p>
      </div>

      {/* Filters */}
      <div className="ep-filters">
        <div className="ep-event-types">
          <button
            className={`ep-type-btn ${filters.eventType === 'all' ? 'active' : ''}`}
            onClick={() => setFilters((f) => ({ ...f, eventType: 'all', page: 1 }))}
          >
            🎯 All Events
          </button>
          {Object.entries(eventTypeConfig).map(([key, { icon, label }]) => (
            <button
              key={key}
              className={`ep-type-btn ${filters.eventType === key ? 'active' : ''}`}
              onClick={() => setFilters((f) => ({ ...f, eventType: key, page: 1 }))}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div className="ep-search-row">
          <input
            type="text"
            placeholder="Search packages..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            className="ep-search-input"
          />
          <input
            type="text"
            placeholder="City..."
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value, page: 1 }))}
            className="ep-city-input"
          />
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
            className="ep-sort-select"
          >
            <option value="createdAt">Newest</option>
            <option value="pricing.basePrice">Price: Low to High</option>
            <option value="rating.average">Top Rated</option>
            <option value="bookingsCount">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="ep-error">{error}</div>}
      {bookingSuccess && <div className="ep-success">{bookingSuccess}</div>}

      {/* Packages Grid */}
      {loading ? (
        <div className="ep-loading">
          <div className="ep-spinner"></div>
          <p>Loading packages...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="ep-empty">
          <span>🎪</span>
          <h3>No Packages Available</h3>
          <p>Check back later for exciting event packages!</p>
        </div>
      ) : (
        <>
          <div className="ep-grid">
            {packages.map((pkg) => {
              const eType = eventTypeConfig[pkg.eventType] || eventTypeConfig.other;
              return (
                <div key={pkg._id} className="ep-card">
                  <div className="ep-card-top">
                    {pkg.photos && pkg.photos[0] ? (
                      <img src={pkg.photos[0]} alt={pkg.title} className="ep-card-img" />
                    ) : (
                      <div className="ep-card-placeholder">
                        <span>{eType.icon}</span>
                      </div>
                    )}
                    <span className="ep-card-type-badge">{eType.icon} {eType.label}</span>
                    {pkg.vendor?.vendorDetails?.isVerified && (
                      <span className="ep-verified-badge">✓ Verified</span>
                    )}
                  </div>
                  <div className="ep-card-body">
                    <h3 className="ep-card-title">{pkg.title}</h3>
                    <p className="ep-card-vendor">
                      by {pkg.vendor?.vendorDetails?.businessName || pkg.vendor?.name}
                    </p>
                    <p className="ep-card-desc">
                      {pkg.description.length > 120
                        ? `${pkg.description.substring(0, 120)}...`
                        : pkg.description}
                    </p>

                    <div className="ep-card-details">
                      <span>⏱️ {pkg.duration?.hours}h</span>
                      {pkg.vehicles?.length > 0 && (
                        <span>🚗 {pkg.vehicles.length} vehicle{pkg.vehicles.length > 1 ? 's' : ''}</span>
                      )}
                      {pkg.maxGuests && <span>👥 Up to {pkg.maxGuests}</span>}
                      {pkg.coverageArea?.cities?.length > 0 && (
                        <span>📍 {pkg.coverageArea.cities.slice(0, 2).join(', ')}</span>
                      )}
                    </div>

                    {pkg.includes && pkg.includes.length > 0 && (
                      <div className="ep-card-includes">
                        {pkg.includes.slice(0, 3).map((item, i) => (
                          <span key={i} className="ep-include-tag">✅ {item}</span>
                        ))}
                        {pkg.includes.length > 3 && (
                          <span className="ep-include-more">+{pkg.includes.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <div className="ep-card-footer">
                      <div className="ep-card-price">
                        <span className="ep-price-value">৳{pkg.pricing?.basePrice?.toLocaleString()}</span>
                        <span className="ep-price-label">Starting from</span>
                      </div>
                      {pkg.rating?.count > 0 && (
                        <div className="ep-card-rating">
                          ⭐ {pkg.rating.average.toFixed(1)} ({pkg.rating.count})
                        </div>
                      )}
                    </div>

                    {user?.role === 'customer' && (
                      <button
                        className="btn btn-primary ep-book-btn"
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setShowBookingForm(true);
                        }}
                      >
                        Book This Package
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="ep-pagination">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                ← Previous
              </button>
              <span>
                Page {filters.page} of {pagination.pages}
              </span>
              <button
                disabled={filters.page >= pagination.pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Booking Modal */}
      {showBookingForm && selectedPackage && (
        <div className="ep-modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="ep-booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ep-modal-header">
              <h2>📅 Book Package</h2>
              <button className="ep-modal-close" onClick={() => setShowBookingForm(false)}>
                &times;
              </button>
            </div>
            <div className="ep-modal-body">
              <div className="ep-booking-package-info">
                <h3>{selectedPackage.title}</h3>
                <p className="ep-booking-price">
                  ৳{selectedPackage.pricing?.basePrice?.toLocaleString()}
                </p>
              </div>
              <form onSubmit={handleBook}>
                <div className="ep-form-grid">
                  <div className="ep-form-group">
                    <label>Event Date *</label>
                    <input
                      type="date"
                      value={bookingForm.eventDate}
                      onChange={(e) =>
                        setBookingForm((f) => ({ ...f, eventDate: e.target.value }))
                      }
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="ep-form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={bookingForm.startTime}
                      onChange={(e) =>
                        setBookingForm((f) => ({ ...f, startTime: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="ep-form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={bookingForm.endTime}
                      onChange={(e) =>
                        setBookingForm((f) => ({ ...f, endTime: e.target.value }))
                      }
                    />
                  </div>
                  <div className="ep-form-group">
                    <label>Guest Count</label>
                    <input
                      type="number"
                      value={bookingForm.guestCount}
                      onChange={(e) =>
                        setBookingForm((f) => ({ ...f, guestCount: e.target.value }))
                      }
                      placeholder="Number of guests"
                      min="1"
                    />
                  </div>
                </div>
                <div className="ep-form-group ep-full">
                  <label>Event Location *</label>
                  <input
                    type="text"
                    value={bookingForm.location}
                    onChange={(e) =>
                      setBookingForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="Full address of the event"
                    required
                  />
                </div>
                <div className="ep-form-group ep-full">
                  <label>Special Requests</label>
                  <textarea
                    value={bookingForm.specialRequests}
                    onChange={(e) =>
                      setBookingForm((f) => ({ ...f, specialRequests: e.target.value }))
                    }
                    placeholder="Any special requirements..."
                    rows={3}
                  />
                </div>

                <h4 className="ep-section-label">Contact Information</h4>
                <div className="ep-form-grid">
                  <div className="ep-form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={bookingForm.contactName}
                      onChange={(e) =>
                        setBookingForm((f) => ({ ...f, contactName: e.target.value }))
                      }
                      placeholder={user?.name || 'Your name'}
                      required
                    />
                  </div>
                  <div className="ep-form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      value={bookingForm.contactPhone}
                      onChange={(e) =>
                        setBookingForm((f) => ({ ...f, contactPhone: e.target.value }))
                      }
                      placeholder={user?.phone || 'Phone number'}
                      required
                    />
                  </div>
                  <div className="ep-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={bookingForm.contactEmail}
                      onChange={(e) =>
                        setBookingForm((f) => ({ ...f, contactEmail: e.target.value }))
                      }
                      placeholder={user?.email || 'Email'}
                    />
                  </div>
                </div>

                {selectedPackage.pricing?.deposit > 0 && (
                  <div className="ep-deposit-note">
                    💡 A deposit of ৳{selectedPackage.pricing.deposit.toLocaleString()} is required to confirm this booking.
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary ep-submit-btn"
                  disabled={booking}
                >
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPackages;
