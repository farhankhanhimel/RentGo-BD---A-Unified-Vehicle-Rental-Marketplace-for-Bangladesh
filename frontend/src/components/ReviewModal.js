import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/ReviewComponents.css';

const ReviewModal = ({ bookingId, vehicleId, vehicleName, withDriver, onClose }) => {
    const [canReview, setCanReview] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [hovered, setHovered] = useState({});
    const [ratings, setRatings] = useState({
        condition: 0,
        cleanliness: 0,
        driverBehaviour: 0,
        valueMoney: 0,
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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/reviews/', {
                bookingId,
                vehicleRating: {
                    condition: ratings.condition,
                    cleanliness: ratings.cleanliness,
                    driverBehaviour: withDriver ? ratings.driverBehaviour : undefined,
                    valueMoney: ratings.valueMoney,
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

    const isValid = ratings.condition > 0 && ratings.cleanliness > 0 && ratings.valueMoney > 0;

    return (
        <div className="review-modal-overlay" onClick={onClose}>
            <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Rate your trip — {vehicleName}</h2>
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
                            <span className="rating-label">🚗 Vehicle Condition</span>
                            {renderStars('condition')}
                        </div>
                        <div className="rating-row">
                            <span className="rating-label">🧹 Cleanliness</span>
                            {renderStars('cleanliness')}
                        </div>
                        {withDriver && (
                            <div className="rating-row">
                                <span className="rating-label">👤 Driver Behaviour</span>
                                {renderStars('driverBehaviour')}
                            </div>
                        )}
                        <div className="rating-row">
                            <span className="rating-label">💰 Value for Money</span>
                            {renderStars('valueMoney')}
                        </div>

                        <div className="form-group">
                            <label>Share your experience (optional)</label>
                            <textarea
                                className="review-textarea"
                                placeholder="Tell others about your trip..."
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

export default ReviewModal;
