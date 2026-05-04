import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/ReviewComponents.css';

const VendorReviewModal = ({ bookingId, customerName, onClose }) => {
  const [canReview, setCanReview] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [hovered, setHovered] = useState({});
  const [ratings, setRatings] = useState({
    punctuality: 0,
    communication: 0,
    vehicleCare: 0,
  });
  const [comment, setComment] = useState('');

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const res = await api.get(`/reviews/can-review/${bookingId}`);
        setCanReview(res.data.canReview);
        if (!res.data.canReview) setReason(res.data.reason);
      } catch (err) {
        setCanReview(false);
        setReason('Failed to check eligibility');
      }
    };
    checkEligibility();
  }, [bookingId]);

  const handleStarClick = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const renderStars = (category) => (
    <div className="star-selector">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= ratings[category] ? 'filled' : ''} ${star <= (hovered[category] || 0) ? 'hovered' : ''}`}
          onClick={() => handleStarClick(category, star)}
          onMouseEnter={() => setHovered((prev) => ({ ...prev, [category]: star }))}
          onMouseLeave={() => setHovered((prev) => ({ ...prev, [category]: 0 }))}
        >
          ★
        </span>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/reviews/', {
        bookingId,
        customerRating: {
          punctuality: ratings.punctuality,
          communication: ratings.communication,
          vehicleCare: ratings.vehicleCare,
        },
        comment,
      });
      onClose();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.message || 'Failed to submit review' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const isValid = ratings.punctuality > 0 && ratings.communication > 0 && ratings.vehicleCare > 0;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Rate customer — {customerName}</h2>
        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

        {canReview === null ? (
          <p>Checking eligibility...</p>
        ) : !canReview ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '3rem' }}>🚫</p>
            <p style={{ color: '#718096' }}>{reason}</p>
            <button className="review-submit-btn" onClick={onClose} style={{ marginTop: '1rem' }}>Close</button>
          </div>
        ) : (
          <>
            <div className="rating-row">
              <span className="rating-label">⏱️ Punctuality</span>
              {renderStars('punctuality')}
            </div>
            <div className="rating-row">
              <span className="rating-label">💬 Communication</span>
              {renderStars('communication')}
            </div>
            <div className="rating-row">
              <span className="rating-label">🚗 Vehicle Care</span>
              {renderStars('vehicleCare')}
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                className="review-textarea"
                placeholder="Share feedback about the customer..."
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                maxLength={1000}
              />
              <div className="char-counter">{comment.length}/1000</div>
            </div>

            <button
              className="review-submit-btn"
              disabled={!isValid || loading}
              onClick={handleSubmit}
            >
              {loading ? 'Submitting...' : '⭐ Submit Review'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorReviewModal;
