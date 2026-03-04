import React from 'react';
import './VerifiedBadge.css';

/**
 * VerifiedBadge — Feature 22 (Tasfy)
 * Reusable verified badge indicator
 *
 * Props:
 *  - isVerified: boolean
 *  - size: 'small' | 'medium' | 'large'
 *  - showLabel: boolean (default true)
 *  - variant: 'default' | 'inline' | 'card'
 */
const VerifiedBadge = ({ isVerified, size = 'medium', showLabel = true, variant = 'default' }) => {
  if (!isVerified) return null;

  const sizeMap = {
    small: { icon: 14, font: '0.7rem' },
    medium: { icon: 18, font: '0.8rem' },
    large: { icon: 24, font: '0.95rem' },
  };

  const s = sizeMap[size] || sizeMap.medium;

  return (
    <span className={`verified-badge vb-${variant} vb-${size}`} title="Verified Vendor">
      <svg
        className="vb-icon"
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L14.09 4.26L17 3.64L17.18 6.57L19.82 8.07L18.46 10.73L19.82 13.39L17.18 14.89L17 17.82L14.09 17.2L12 19.46L9.91 17.2L7 17.82L6.82 14.89L4.18 13.39L5.54 10.73L4.18 8.07L6.82 6.57L7 3.64L9.91 4.26L12 2Z"
          fill="url(#verifiedGradient)"
        />
        <path
          d="M9 12L11 14L15 10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="verifiedGradient" x1="4" y1="2" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#667eea" />
            <stop offset="1" stopColor="#764ba2" />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && <span className="vb-label" style={{ fontSize: s.font }}>Verified</span>}
    </span>
  );
};

export default VerifiedBadge;
