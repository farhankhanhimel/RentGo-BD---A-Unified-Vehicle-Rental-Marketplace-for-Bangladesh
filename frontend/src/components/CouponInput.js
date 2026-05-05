import React, { useEffect, useState } from 'react';
import couponService from '../services/couponService';
import './CouponInput.css';

const CouponInput = ({ orderAmount, vehicleType, tripType, onApply, onRemove, autoValidate = false }) => {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!autoValidate) return undefined;

    if (!code.trim() || code.trim().length < 3) {
      setApplied(null);
      setError('');
      if (onRemove) onRemove();
      return undefined;
    }

    const timer = setTimeout(() => {
      handleApply();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, autoValidate, orderAmount, vehicleType, tripType]);

  const handleApply = async () => {
    if (!code.trim()) return;
    setValidating(true);
    setError('');
    try {
      const result = await couponService.validateCoupon(code, orderAmount, vehicleType, tripType);
      setApplied(result);
      if (onApply) onApply(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid coupon code');
      setApplied(null);
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setCode('');
    setError('');
    if (onRemove) onRemove();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <div className="coupon-input-container">
      {!applied ? (
        <>
          <div className="coupon-input-row">
            <div className="coupon-input-field">
              <span className="coupon-icon">🏷️</span>
              <input
                type="text"
                placeholder="Enter coupon code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                className="coupon-input"
              />
            </div>
            <button
              className="coupon-apply-btn"
              onClick={handleApply}
              disabled={validating || !code.trim()}
            >
              {validating ? 'Checking...' : 'Apply'}
            </button>
          </div>
          {error && <p className="coupon-error">{error}</p>}
        </>
      ) : (
        <div className="coupon-applied">
          <div className="coupon-applied-info">
            <span className="coupon-applied-icon">✅</span>
            <div>
              <p className="coupon-applied-code">{applied.coupon.code}</p>
              <p className="coupon-applied-desc">
                {applied.coupon.discountType === 'percentage'
                  ? `${applied.coupon.discountValue}% off`
                  : `৳${applied.coupon.discountValue} off`}
                {applied.coupon.description && ` — ${applied.coupon.description}`}
              </p>
              <p className="coupon-applied-savings">
                You save ৳{applied.discount.toLocaleString()}
              </p>
            </div>
          </div>
          <button className="coupon-remove-btn" onClick={handleRemove} title="Remove coupon">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default CouponInput;
