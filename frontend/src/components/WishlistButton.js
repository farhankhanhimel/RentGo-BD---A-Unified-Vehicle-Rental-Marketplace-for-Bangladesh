import React, { useState, useEffect } from 'react';
import wishlistService from '../services/wishlistService';
import './WishlistButton.css';

const WishlistButton = ({ vehicleId, size = 'medium', onToggle }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      checkStatus();
    }
  }, [vehicleId]);

  const checkStatus = async () => {
    try {
      const data = await wishlistService.checkWishlist(vehicleId);
      setIsWishlisted(data.isWishlisted);
    } catch (error) {
      // User might not be logged in — fail silently
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);
    setAnimating(true);

    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(vehicleId);
        setIsWishlisted(false);
      } else {
        await wishlistService.addToWishlist(vehicleId);
        setIsWishlisted(true);
      }
      if (onToggle) onToggle(!isWishlisted);
    } catch (error) {
      console.error('Wishlist toggle error:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(false), 300);
    }
  };

  return (
    <button
      className={`wishlist-btn wishlist-btn-${size} ${isWishlisted ? 'wishlisted' : ''} ${animating ? 'animating' : ''}`}
      onClick={toggleWishlist}
      disabled={loading}
      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className="wishlist-icon"
        viewBox="0 0 24 24"
        fill={isWishlisted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};

export default WishlistButton;
