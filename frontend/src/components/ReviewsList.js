import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/ReviewComponents.css';

const ReviewsList = ({ vehicleId }) => {
    const [reviews, setReviews] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingBreakdown, setRatingBreakdown] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/reviews/vehicle/${vehicleId}?page=${page}&limit=10`);
                setReviews(res.data.reviews);
                setTotalCount(res.data.totalCount);
                setTotalPages(res.data.totalPages);
                setAverageRating(res.data.averageRating);
                setRatingBreakdown(res.data.ratingBreakdown || {});
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (vehicleId) fetchReviews();
    }, [vehicleId, page]);

    const renderStars = (rating) => {
        const full = Math.floor(rating);
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(i < full ? '★' : '☆');
        }
        return stars.join('');
    };

    if (loading) return <p style={{ color: '#a0aec0' }}>Loading reviews...</p>;
    if (totalCount === 0) return <p style={{ color: '#a0aec0' }}>No reviews yet. Be the first to review!</p>;

    return (
        <div className="reviews-section">
            {/* Rating Overview */}
            <div className="rating-overview">
                <div>
                    <div className="rating-big">{averageRating?.toFixed(1)}</div>
                    <div className="rating-big-stars">{renderStars(averageRating)}</div>
                    <div className="rating-count">({totalCount} reviews)</div>
                </div>
                <div className="rating-breakdown">
                    {[
                        { key: 'condition', label: 'Condition' },
                        { key: 'cleanliness', label: 'Cleanliness' },
                        { key: 'driverBehaviour', label: 'Driver' },
                        { key: 'valueMoney', label: 'Value' },
                    ].map((item) => (
                        ratingBreakdown[item.key] != null && (
                            <div key={item.key} className="breakdown-row">
                                <span className="breakdown-label">{item.label}</span>
                                <div className="breakdown-bar">
                                    <div className="breakdown-bar-fill" style={{ width: `${(ratingBreakdown[item.key] / 5) * 100}%` }} />
                                </div>
                                <span className="breakdown-score">{ratingBreakdown[item.key]}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Individual Reviews */}
            {reviews.map((r) => (
                <div key={r._id} className="review-card">
                    <div className="review-header">
                        <div className="reviewer-avatar">
                            {r.customerId?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="reviewer-name">{r.customerId?.name || 'Anonymous'}</span>
                        <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="review-stars">{renderStars(r.vehicleRating?.overall || 0)}</div>
                    {r.comment && <p className="review-comment">{r.comment}</p>}
                    <div className="review-subscores">
                        {r.vehicleRating?.condition && <span className="chip">Condition: {r.vehicleRating.condition}/5</span>}
                        {r.vehicleRating?.cleanliness && <span className="chip">Cleanliness: {r.vehicleRating.cleanliness}/5</span>}
                        {r.vehicleRating?.driverBehaviour && <span className="chip">Driver: {r.vehicleRating.driverBehaviour}/5</span>}
                        {r.vehicleRating?.valueMoney && <span className="chip">Value: {r.vehicleRating.valueMoney}/5</span>}
                    </div>
                </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                    <button className="active">Page {page} of {totalPages}</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
};

export default ReviewsList;
