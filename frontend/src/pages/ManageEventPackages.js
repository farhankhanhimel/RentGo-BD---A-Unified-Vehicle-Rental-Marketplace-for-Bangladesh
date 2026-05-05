import React, { useState, useEffect, useCallback } from 'react';
import eventPackageService from '../services/eventPackageService';
import './ManageEventPackages.css';

const eventTypeOptions = [
  { value: 'wedding', label: '💒 Wedding' },
  { value: 'corporate', label: '🏢 Corporate' },
  { value: 'tourism', label: '🏖️ Tourism' },
  { value: 'airport_transfer', label: '✈️ Airport Transfer' },
  { value: 'concert', label: '🎵 Concert' },
  { value: 'festival', label: '🎉 Festival' },
  { value: 'other', label: '📦 Other' },
];

const statusColors = {
  pending: { bg: '#fff3e0', color: '#e65100' },
  confirmed: { bg: '#e3f2fd', color: '#1565c0' },
  in_progress: { bg: '#ede7f6', color: '#4527a0' },
  completed: { bg: '#e8f5e9', color: '#2e7d32' },
  cancelled: { bg: '#ffebee', color: '#c62828' },
  declined: { bg: '#fce4ec', color: '#880e4f' },
};

const ManageEventPackages = () => {
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('packages');
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const initialForm = {
    title: '',
    description: '',
    eventType: 'wedding',
    includes: '',
    basePrice: '',
    pricePerAdditionalHour: '',
    pricePerAdditionalVehicle: '',
    deposit: '',
    hours: '',
    maxHours: '',
    maxGuests: '',
    cities: '',
    district: '',
  };
  const [form, setForm] = useState(initialForm);

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventPackageService.getMyPackages();
      setPackages(data.packages || []);
    } catch (err) {
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const data = await eventPackageService.getPackageBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchBookings();
  }, [fetchPackages, fetchBookings]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        eventType: form.eventType,
        includes: form.includes.split(',').map((s) => s.trim()).filter(Boolean),
        pricing: {
          basePrice: parseFloat(form.basePrice),
          pricePerAdditionalHour: parseFloat(form.pricePerAdditionalHour) || 0,
          pricePerAdditionalVehicle: parseFloat(form.pricePerAdditionalVehicle) || 0,
          deposit: parseFloat(form.deposit) || 0,
        },
        duration: {
          hours: parseInt(form.hours),
          maxHours: form.maxHours ? parseInt(form.maxHours) : undefined,
        },
        maxGuests: form.maxGuests ? parseInt(form.maxGuests) : undefined,
        coverageArea: {
          cities: form.cities.split(',').map((s) => s.trim()).filter(Boolean),
          district: form.district || undefined,
        },
      };

      if (editingPackage) {
        await eventPackageService.updatePackage(editingPackage._id, payload);
        setSuccess('Package updated successfully!');
      } else {
        await eventPackageService.createPackage(payload);
        setSuccess('Package created successfully!');
      }

      setForm(initialForm);
      setShowForm(false);
      setEditingPackage(null);
      fetchPackages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save package');
    }
  };

  const handleEdit = (pkg) => {
    setForm({
      title: pkg.title,
      description: pkg.description,
      eventType: pkg.eventType,
      includes: (pkg.includes || []).join(', '),
      basePrice: pkg.pricing.basePrice.toString(),
      pricePerAdditionalHour: (pkg.pricing.pricePerAdditionalHour || '').toString(),
      pricePerAdditionalVehicle: (pkg.pricing.pricePerAdditionalVehicle || '').toString(),
      deposit: (pkg.pricing.deposit || '').toString(),
      hours: pkg.duration.hours.toString(),
      maxHours: (pkg.duration.maxHours || '').toString(),
      maxGuests: (pkg.maxGuests || '').toString(),
      cities: (pkg.coverageArea?.cities || []).join(', '),
      district: pkg.coverageArea?.district || '',
    });
    setEditingPackage(pkg);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await eventPackageService.deletePackage(id);
      setSuccess('Package deleted');
      fetchPackages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete package');
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await eventPackageService.updateBookingStatus(bookingId, status);
      setSuccess(`Booking ${status}`);
      fetchBookings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking');
    }
  };

  const cancelForm = () => {
    setForm(initialForm);
    setShowForm(false);
    setEditingPackage(null);
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="mep-container">
      <div className="mep-header">
        <div>
          <h1>Event Packages</h1>
          <p>Create and manage event rental packages</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingPackage(null); setForm(initialForm); }}>
          + New Package
        </button>
      </div>

      {error && <div className="mep-error">{error}</div>}
      {success && <div className="mep-success">{success}</div>}

      {/* Tabs */}
      <div className="mep-tabs">
        <button className={`mep-tab ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => setActiveTab('packages')}>
          📦 Packages ({packages.length})
        </button>
        <button className={`mep-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
          📋 Bookings ({bookings.length})
          {pendingBookings > 0 && <span className="mep-tab-badge">{pendingBookings}</span>}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="mep-form-card">
          <h2>{editingPackage ? 'Edit Package' : 'Create Package'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mep-form-grid">
              <div className="mep-form-group mep-full">
                <label>Package Title *</label>
                <input type="text" value={form.title} onChange={(e) => handleFormChange('title', e.target.value)} placeholder="e.g., Royal Wedding Fleet" required />
              </div>

              <div className="mep-form-group mep-full">
                <label>Description *</label>
                <textarea rows={3} value={form.description} onChange={(e) => handleFormChange('description', e.target.value)} placeholder="Describe what your package offers..." required />
              </div>

              <div className="mep-form-group">
                <label>Event Type *</label>
                <select value={form.eventType} onChange={(e) => handleFormChange('eventType', e.target.value)}>
                  {eventTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="mep-form-group">
                <label>Duration (hours) *</label>
                <input type="number" value={form.hours} onChange={(e) => handleFormChange('hours', e.target.value)} placeholder="e.g., 8" required min="1" />
              </div>

              <div className="mep-form-group">
                <label>Max Hours</label>
                <input type="number" value={form.maxHours} onChange={(e) => handleFormChange('maxHours', e.target.value)} placeholder="e.g., 12" min="1" />
              </div>

              <div className="mep-form-group">
                <label>Max Guests</label>
                <input type="number" value={form.maxGuests} onChange={(e) => handleFormChange('maxGuests', e.target.value)} placeholder="e.g., 200" min="1" />
              </div>

              <div className="mep-form-group">
                <label>Base Price (৳) *</label>
                <input type="number" value={form.basePrice} onChange={(e) => handleFormChange('basePrice', e.target.value)} placeholder="15000" required min="0" />
              </div>

              <div className="mep-form-group">
                <label>Per Additional Hour (৳)</label>
                <input type="number" value={form.pricePerAdditionalHour} onChange={(e) => handleFormChange('pricePerAdditionalHour', e.target.value)} placeholder="2000" min="0" />
              </div>

              <div className="mep-form-group">
                <label>Per Additional Vehicle (৳)</label>
                <input type="number" value={form.pricePerAdditionalVehicle} onChange={(e) => handleFormChange('pricePerAdditionalVehicle', e.target.value)} placeholder="5000" min="0" />
              </div>

              <div className="mep-form-group">
                <label>Security Deposit (৳)</label>
                <input type="number" value={form.deposit} onChange={(e) => handleFormChange('deposit', e.target.value)} placeholder="3000" min="0" />
              </div>

              <div className="mep-form-group mep-full">
                <label>Includes (comma-separated)</label>
                <input type="text" value={form.includes} onChange={(e) => handleFormChange('includes', e.target.value)} placeholder="Decorated vehicles, Professional driver, Fuel included, AC" />
              </div>

              <div className="mep-form-group">
                <label>Coverage Cities (comma-separated)</label>
                <input type="text" value={form.cities} onChange={(e) => handleFormChange('cities', e.target.value)} placeholder="Dhaka, Chittagong" />
              </div>

              <div className="mep-form-group">
                <label>District</label>
                <input type="text" value={form.district} onChange={(e) => handleFormChange('district', e.target.value)} placeholder="e.g., Dhaka" />
              </div>
            </div>

            <div className="mep-form-actions">
              <button type="button" className="btn btn-secondary" onClick={cancelForm}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingPackage ? 'Update Package' : 'Create Package'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="mep-loading"><div className="mep-spinner"></div><p>Loading...</p></div>
      ) : activeTab === 'packages' ? (
        /* Packages Tab */
        packages.length === 0 ? (
          <div className="mep-empty">
            <span>📦</span>
            <h3>No Packages Yet</h3>
            <p>Create your first event package to start getting bookings</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create Package</button>
          </div>
        ) : (
          <div className="mep-pkg-grid">
            {packages.map((pkg) => (
              <div key={pkg._id} className="mep-pkg-card">
                <div className="mep-pkg-header">
                  <span className="mep-pkg-type">{eventTypeOptions.find((o) => o.value === pkg.eventType)?.label || pkg.eventType}</span>
                  <span className={`mep-pkg-status ${pkg.isActive ? 'active' : 'inactive'}`}>
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="mep-pkg-title">{pkg.title}</h3>
                <p className="mep-pkg-desc">{pkg.description.length > 100 ? pkg.description.slice(0, 100) + '...' : pkg.description}</p>

                <div className="mep-pkg-info-row">
                  <span>⏱ {pkg.duration.hours}h{pkg.duration.maxHours ? ` - ${pkg.duration.maxHours}h` : ''}</span>
                  {pkg.maxGuests && <span>👥 Up to {pkg.maxGuests}</span>}
                  <span>📍 {(pkg.coverageArea?.cities || []).join(', ') || 'Not set'}</span>
                </div>

                {pkg.includes?.length > 0 && (
                  <div className="mep-pkg-includes">
                    {pkg.includes.slice(0, 3).map((item, i) => (
                      <span key={i} className="mep-include-chip">{item}</span>
                    ))}
                    {pkg.includes.length > 3 && <span className="mep-include-more">+{pkg.includes.length - 3}</span>}
                  </div>
                )}

                <div className="mep-pkg-footer">
                  <div className="mep-pkg-price">
                    <strong>৳{pkg.pricing.basePrice.toLocaleString()}</strong>
                    <small>base price</small>
                  </div>
                  <div className="mep-pkg-stats">
                    <span>📊 {pkg.bookingsCount || 0} bookings</span>
                    {pkg.rating?.average > 0 && <span>⭐ {pkg.rating.average.toFixed(1)}</span>}
                  </div>
                </div>

                <div className="mep-pkg-actions">
                  <button className="mep-action-btn edit" onClick={() => handleEdit(pkg)}>✏️ Edit</button>
                  <button className="mep-action-btn delete" onClick={() => handleDelete(pkg._id)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Bookings Tab */
        bookings.length === 0 ? (
          <div className="mep-empty">
            <span>📋</span>
            <h3>No Bookings Yet</h3>
            <p>Bookings for your packages will appear here</p>
          </div>
        ) : (
          <div className="mep-bookings-list">
            {bookings.map((bk) => {
              const st = statusColors[bk.status] || {};
              return (
                <div key={bk._id} className="mep-booking-card">
                  <div className="mep-bk-header">
                    <span className="mep-bk-id">{bk.bookingId}</span>
                    <span className="mep-bk-status" style={{ background: st.bg, color: st.color }}>
                      {bk.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="mep-bk-pkg-name">{bk.package?.title || 'Package'}</h4>

                  <div className="mep-bk-details">
                    <div className="mep-bk-row"><span>📅 Date:</span><strong>{new Date(bk.eventDetails?.eventDate).toLocaleDateString()}</strong></div>
                    <div className="mep-bk-row"><span>🕐 Time:</span><strong>{bk.eventDetails?.startTime} - {bk.eventDetails?.endTime}</strong></div>
                    <div className="mep-bk-row"><span>📍 Location:</span><strong>{bk.eventDetails?.location}</strong></div>
                    <div className="mep-bk-row"><span>👥 Guests:</span><strong>{bk.eventDetails?.guestCount}</strong></div>
                    <div className="mep-bk-row"><span>💰 Total:</span><strong>৳{bk.pricing?.totalPrice?.toLocaleString()}</strong></div>
                  </div>

                  {bk.eventDetails?.specialRequests && (
                    <div className="mep-bk-special">
                      <strong>Special Requests:</strong> {bk.eventDetails.specialRequests}
                    </div>
                  )}

                  <div className="mep-bk-contact">
                    <span>📞 {bk.contactInfo?.name} — {bk.contactInfo?.phone}</span>
                    {bk.contactInfo?.email && <span>✉️ {bk.contactInfo.email}</span>}
                  </div>

                  {bk.status === 'pending' && (
                    <div className="mep-bk-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleBookingStatus(bk._id, 'confirmed')}>✓ Confirm</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleBookingStatus(bk._id, 'declined')}>✗ Decline</button>
                    </div>
                  )}
                  {bk.status === 'confirmed' && (
                    <div className="mep-bk-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleBookingStatus(bk._id, 'in_progress')}>▶ Start</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleBookingStatus(bk._id, 'cancelled')}>Cancel</button>
                    </div>
                  )}
                  {bk.status === 'in_progress' && (
                    <div className="mep-bk-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleBookingStatus(bk._id, 'completed')}>✓ Complete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default ManageEventPackages;
