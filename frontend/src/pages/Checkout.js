import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getPaymentBookings, initiatePayment } from '../services/paymentService';
import CouponInput from '../components/CouponInput';
import api from '../utils/api';
import '../styles/Checkout.css';

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const Checkout = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialBooking = location.state?.booking || null;
  const requestedPayFull = Boolean(location.state?.payFull);

  const [booking, setBooking] = useState(initialBooking);
  const [loading, setLoading] = useState(!initialBooking);
  const [paymentMode, setPaymentMode] = useState(requestedPayFull ? 'full' : 'advance');
  const [couponResult, setCouponResult] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [advancePercent, setAdvancePercent] = useState(30);

  useEffect(() => {
    const loadBooking = async () => {
      if (booking) return;
      setLoading(true);
      try {
        const summary = await getPaymentBookings();
        setAdvancePercent(summary.advancePaymentPercent || 30);
        const found = (summary.bookings || []).find((item) => String(item._id) === String(bookingId));
        if (found) {
          setBooking(found);
          return;
        }

        const response = await api.get(`/bookings/${bookingId}`);
        setBooking(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [booking, bookingId]);

  useEffect(() => {
    if (!booking) return;
    if (requestedPayFull) {
      setPaymentMode('full');
      return;
    }
    const paid = Number(booking?.pricing?.advancePaid || booking?.paidAmount || 0);
    if (booking?.paymentStatus === 'paid' || booking?.paymentStatus === 'partial_paid' || paid > 0) {
      setPaymentMode('full');
    } else {
      setPaymentMode('advance');
    }
  }, [booking, requestedPayFull]);

  const baseAmount = Number(booking?.pricing?.baseRate || 0);
  const driverFee = Number(booking?.pricing?.driverFee || 0);
  const serviceFee = Number(booking?.pricing?.serviceFee || 0);
  const couponDiscount = Number(couponResult?.discount || booking?.pricing?.couponDiscount || 0);
  const subtotal = baseAmount + driverFee + serviceFee;
  const totalAmount = Math.max(0, subtotal - couponDiscount);
  const paidAmount = Number(booking?.pricing?.advancePaid || booking?.paidAmount || 0);
  const dueAmount = round2(Math.max(0, totalAmount - paidAmount));
  const advanceDue = round2(booking?.pricing?.advanceAmount || (totalAmount * (advancePercent / 100)));
  const payAmount = paymentMode === 'advance'
    ? round2(Math.min(advanceDue, dueAmount || totalAmount))
    : dueAmount;
  const balanceDue = round2(Math.max(0, totalAmount - (paidAmount + payAmount)));
  const payLabel = paymentMode === 'advance' ? `Advance (${advancePercent}%)` : 'Amount to Pay';

  const handleProceedToPayment = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await initiatePayment(booking._id, paymentMode, couponCode.trim());
      if (response.gatewayUrl) {
        window.location.href = response.gatewayUrl;
        return;
      }
      setError('Payment session was created, but no gateway URL was returned. Please retry.');
    } catch (err) {
      setError(err.response?.data?.message || 'Payment initiation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const vehicleLabel = useMemo(() => {
    if (!booking) return 'Booking';
    const vehicle = booking.vehicle || booking.vehicleId || {};
    const legacyVehicle = booking.vehicleIdLegacy || {};
    return [vehicle.make || legacyVehicle.specs?.make, vehicle.model || legacyVehicle.specs?.model, vehicle.year || legacyVehicle.specs?.year].filter(Boolean).join(' ') || booking.vehicleName || 'Vehicle';
  }, [booking]);

  if (loading) {
    return <div className="checkout-page"><div className="checkout-card">Loading checkout...</div></div>;
  }

  if (!booking) {
    return <div className="checkout-page"><div className="checkout-card">Booking not found</div></div>;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-hero">
        <div>
          <p className="eyebrow">Pre-checkout Summary</p>
          <h1>{vehicleLabel}</h1>
          <p className="subtitle">Review the final price, validate a coupon, then continue to SSLCommerz.</p>
        </div>
        <button className="checkout-back" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="checkout-grid">
        <div className="checkout-card">
          <h2>Itemized Breakdown</h2>
          <div className="summary-rows">
            <div className="summary-row"><span>Base rate</span><strong>৳{baseAmount.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Driver fee</span><strong>৳{driverFee.toLocaleString()}</strong></div>
            <div className="summary-row"><span>Service fee</span><strong>৳{serviceFee.toLocaleString()}</strong></div>
            <div className="summary-row discount"><span>Coupon discount</span><strong>-৳{couponDiscount.toLocaleString()}</strong></div>
            <div className="summary-row total"><span>Total</span><strong>৳{totalAmount.toLocaleString()}</strong></div>
            {paidAmount > 0 && (
              <div className="summary-row">
                <span>Already paid</span>
                <strong>৳{paidAmount.toLocaleString()}</strong>
              </div>
            )}
            <div className="summary-row advance"><span>{payLabel}</span><strong>৳{payAmount.toLocaleString()}</strong></div>
            <div className="summary-row balance"><span>Balance due after payment</span><strong>৳{balanceDue.toLocaleString()}</strong></div>
          </div>
        </div>

        <div className="checkout-card">
          <h2>Coupon Code</h2>
          <p className="helper">Validation updates in real time as you type.</p>
          <CouponInput
            autoValidate
            orderAmount={subtotal}
            vehicleType={booking.vehicle?.vehicleType || booking.vehicleId?.vehicleType || booking.vehicleIdLegacy?.vehicleType}
            tripType={booking.tripDetails?.tripType}
            onApply={(result) => {
              setCouponResult(result);
              setCouponCode(result.coupon.code);
            }}
            onRemove={() => {
              setCouponResult(null);
              setCouponCode('');
            }}
          />

          <div className="payment-mode-picker">
            <button
              className={paymentMode === 'advance' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => setPaymentMode('advance')}
              type="button"
            >
              Pay Advance
            </button>
            <button
              className={paymentMode === 'full' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => setPaymentMode('full')}
              type="button"
            >
              Pay Full
            </button>
          </div>

          <div className="gateway-note">
            SSLCommerz supports bKash, Nagad, Rocket, and cards.
          </div>

          {error && <div className="checkout-error">{error}</div>}

          <button className="pay-now-btn" onClick={handleProceedToPayment} disabled={submitting}>
            {submitting ? 'Redirecting...' : `Proceed to Payment • ৳${payAmount.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
