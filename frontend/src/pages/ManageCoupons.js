import React, { useState, useEffect, useCallback } from 'react';
import couponService from '../services/couponService';
import './ManageCoupons.css';

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [filter, setFilter] = useState('all');

  // Form state
  const initialForm = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minOrderAmount: '',
    applicableVehicleTypes: [],
    applicableTripTypes: [],
    usageLimit: '',
    perUserLimit: '1',
    startDate: '',
    endDate: '',
  };
  const [form, setForm] = useState(initialForm);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await couponService.getCoupons({ status: filter !== 'all' ? filter : '' });
      setCoupons(data.coupons);
    } catch (err) {
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value) => {
    setForm((prev) => {
      const list = prev[field];
      if (list.includes(value)) {
        return { ...prev, [field]: list.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...list, value] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        discountValue: parseFloat(form.discountValue),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        perUserLimit: parseInt(form.perUserLimit) || 1,
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon._id, payload);
        setSuccess('Coupon updated successfully!');
      } else {
        await couponService.createCoupon(payload);
        setSuccess('Coupon created successfully!');
      }

      setForm(initialForm);
      setShowCreate(false);
      setEditingCoupon(null);
      fetchCoupons();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      maxDiscount: coupon.maxDiscount?.toString() || '',
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      applicableVehicleTypes: coupon.applicableVehicleTypes || [],
      applicableTripTypes: coupon.applicableTripTypes || [],
      usageLimit: coupon.usageLimit?.toString() || '',
      perUserLimit: coupon.perUserLimit?.toString() || '1',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
    });
    setEditingCoupon(coupon);
    setShowCreate(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await couponService.deleteCoupon(id);
      fetchCoupons();
      setSuccess('Coupon deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete coupon');
    }
  };

  const handleToggle = async (id) => {
    try {
      await couponService.toggleCoupon(id);
      fetchCoupons();
    } catch (err) {
      setError('Failed to toggle coupon');
    }
  };

  const isExpired = (endDate) => new Date(endDate) < new Date();
  const isUpcoming = (startDate) => new Date(startDate) > new Date();

  const vehicleTypes = ['car', 'motorcycle', 'microbus', 'van', 'pickup', 'bus'];
  const tripTypes = ['tourism', 'airport', 'wedding', 'office', 'emergency', 'other'];

  return (
    <div className="manage-coupons-container">
      {/* Header */}
      <div className="mc-header">
        <div className="mc-header-text">
          <h1>🏷️ Manage Coupons</h1>
          <p>Create and manage promotional codes for your customers</p>
        </div>
        <button
          className="btn btn-primary mc-create-btn"
          onClick={() => {
            setForm(initialForm);
            setEditingCoupon(null);
            setShowCreate(!showCreate);
          }}
        >
          {showCreate ? '✕ Close' : '+ Create Coupon'}
        </button>
      </div>

      {/* Messages */}
      {error && <div className="mc-error">{error}</div>}
      {success && <div className="mc-success">{success}</div>}

      {/* Create/Edit Form */}
      {showCreate && (
        <div className="mc-form-card">
          <h2>{editingCoupon ? '✏️ Edit Coupon' : '🆕 Create New Coupon'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mc-form-grid">
              <div className="mc-form-group">
                <label>Coupon Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., SUMMER25"
                  required
                  className="mc-input"
                />
              </div>
              <div className="mc-form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Summer sale discount"
                  className="mc-input"
                />
              </div>
              <div className="mc-form-group">
                <label>Discount Type *</label>
                <select
                  value={form.discountType}
                  onChange={(e) => handleFormChange('discountType', e.target.value)}
                  className="mc-input"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
              </div>
              <div className="mc-form-group">
                <label>
                  Discount Value * {form.discountType === 'percentage' ? '(%)' : '(৳)'}
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => handleFormChange('discountValue', e.target.value)}
                  placeholder={form.discountType === 'percentage' ? '0-100' : 'Amount'}
                  required
                  min="0"
                  max={form.discountType === 'percentage' ? '100' : undefined}
                  className="mc-input"
                />
              </div>
              {form.discountType === 'percentage' && (
                <div className="mc-form-group">
                  <label>Max Discount Cap (৳)</label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => handleFormChange('maxDiscount', e.target.value)}
                    placeholder="e.g., 500"
                    min="0"
                    className="mc-input"
                  />
                </div>
              )}
              <div className="mc-form-group">
                <label>Min Order Amount (৳)</label>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => handleFormChange('minOrderAmount', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="mc-input"
                />
              </div>
              <div className="mc-form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                  required
                  className="mc-input"
                />
              </div>
              <div className="mc-form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  required
                  className="mc-input"
                />
              </div>
              <div className="mc-form-group">
                <label>Total Usage Limit</label>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => handleFormChange('usageLimit', e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  className="mc-input"
                />
              </div>
              <div className="mc-form-group">
                <label>Per User Limit</label>
                <input
                  type="number"
                  value={form.perUserLimit}
                  onChange={(e) => handleFormChange('perUserLimit', e.target.value)}
                  placeholder="1"
                  min="1"
                  className="mc-input"
                />
              </div>
            </div>

            {/* Multi-selects */}
            <div className="mc-form-group mc-full">
              <label>Applicable Vehicle Types (leave empty for all)</label>
              <div className="mc-chip-group">
                {vehicleTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`mc-chip ${form.applicableVehicleTypes.includes(type) ? 'selected' : ''}`}
                    onClick={() => handleMultiSelect('applicableVehicleTypes', type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mc-form-group mc-full">
              <label>Applicable Trip Types (leave empty for all)</label>
              <div className="mc-chip-group">
                {tripTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`mc-chip ${form.applicableTripTypes.includes(type) ? 'selected' : ''}`}
                    onClick={() => handleMultiSelect('applicableTripTypes', type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mc-form-actions">
              <button type="submit" className="btn btn-primary">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreate(false);
                  setEditingCoupon(null);
                  setForm(initialForm);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mc-filter-tabs">
        {['all', 'active', 'expired', 'inactive'].map((f) => (
          <button
            key={f}
            className={`mc-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="mc-loading">
          <div className="mc-spinner"></div>
          <p>Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="mc-empty">
          <span className="mc-empty-icon">🏷️</span>
          <h3>No Coupons Found</h3>
          <p>Create your first coupon to attract more customers!</p>
        </div>
      ) : (
        <div className="mc-coupons-grid">
          {coupons.map((coupon) => (
            <div
              key={coupon._id}
              className={`mc-coupon-card ${!coupon.isActive ? 'inactive' : ''} ${isExpired(coupon.endDate) ? 'expired' : ''}`}
            >
              <div className="mc-coupon-header">
                <div className="mc-coupon-code">{coupon.code}</div>
                <div className="mc-coupon-status-badges">
                  {!coupon.isActive && <span className="mc-badge mc-badge-inactive">Inactive</span>}
                  {isExpired(coupon.endDate) && <span className="mc-badge mc-badge-expired">Expired</span>}
                  {isUpcoming(coupon.startDate) && <span className="mc-badge mc-badge-upcoming">Upcoming</span>}
                  {coupon.isActive && !isExpired(coupon.endDate) && !isUpcoming(coupon.startDate) && (
                    <span className="mc-badge mc-badge-active">Active</span>
                  )}
                </div>
              </div>
              <p className="mc-coupon-desc">{coupon.description || 'No description'}</p>
              <div className="mc-coupon-discount">
                {coupon.discountType === 'percentage' ? (
                  <>
                    <span className="mc-discount-value">{coupon.discountValue}%</span>
                    <span className="mc-discount-label">OFF</span>
                    {coupon.maxDiscount && (
                      <span className="mc-discount-cap">Max ৳{coupon.maxDiscount}</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="mc-discount-value">৳{coupon.discountValue}</span>
                    <span className="mc-discount-label">OFF</span>
                  </>
                )}
              </div>
              <div className="mc-coupon-details">
                <div className="mc-detail-row">
                  <span className="mc-detail-label">Usage</span>
                  <span className="mc-detail-value">
                    {coupon.usedCount}/{coupon.usageLimit || '∞'}
                  </span>
                </div>
                <div className="mc-detail-row">
                  <span className="mc-detail-label">Min Order</span>
                  <span className="mc-detail-value">৳{coupon.minOrderAmount || 0}</span>
                </div>
                <div className="mc-detail-row">
                  <span className="mc-detail-label">Valid</span>
                  <span className="mc-detail-value">
                    {new Date(coupon.startDate).toLocaleDateString()} — {new Date(coupon.endDate).toLocaleDateString()}
                  </span>
                </div>
                {coupon.applicableVehicleTypes?.length > 0 && (
                  <div className="mc-detail-row">
                    <span className="mc-detail-label">Vehicles</span>
                    <span className="mc-detail-value">{coupon.applicableVehicleTypes.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="mc-coupon-actions">
                <button className="mc-action-btn edit" onClick={() => handleEdit(coupon)}>
                  ✏️ Edit
                </button>
                <button className="mc-action-btn toggle" onClick={() => handleToggle(coupon._id)}>
                  {coupon.isActive ? '⏸️ Disable' : '▶️ Enable'}
                </button>
                <button className="mc-action-btn delete" onClick={() => handleDelete(coupon._id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageCoupons;
