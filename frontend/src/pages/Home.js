import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/dashboard/admin';
    if (user?.role === 'vendor') return '/dashboard/vendor';
    return '/dashboard/customer';
  };

  return (
    <div className="home">
      <div className="container">
        <section className="hero">
          <h1>Move Better Across Bangladesh</h1>
          <p>Book trusted vehicles, compare vendors, and manage trips with confidence.</p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/search')}>Browse Rentals</button>
            <button
              className="btn btn-secondary"
              onClick={() => (isAuthenticated && user?.role === 'vendor' ? navigate('/dashboard/vendor') : navigate('/register'))}
            >
              List Your Property
            </button>
          </div>
        </section>

        <section className="dash-jump">
          <div className="dash-jump-header">
            <h2>Dashboard Quick Jump</h2>
            <p>Jump to your workspace instantly and continue where you left off.</p>
          </div>

          <div className="dash-jump-grid">
            <button className="jump-card" onClick={() => navigate('/dashboard/customer')}>
              <span>Customer Dashboard</span>
              <small>Bookings, wishlist, and profile settings</small>
            </button>
            <button className="jump-card" onClick={() => navigate('/dashboard/vendor')}>
              <span>Vendor Dashboard</span>
              <small>Fleet, drivers, coupons, and earnings</small>
            </button>
            <button className="jump-card" onClick={() => navigate('/dashboard/admin')}>
              <span>Admin Dashboard</span>
              <small>Analytics, moderation, and platform controls</small>
            </button>
          </div>

          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={() => navigate(getDashboardPath())}>
              Go to My Dashboard
            </button>
          ) : (
            <button className="btn btn-outline" onClick={() => navigate('/login')}>
              Login to Access Dashboard
            </button>
          )}
        </section>

        <section className="features">
          <h2>Why Riders Choose RentGo</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Smart Comparison</h3>
              <p>Compare vendor rates side by side before making a booking decision.</p>
            </div>
            <div className="feature-card">
              <h3>Verified Listings</h3>
              <p>Vehicles and vendors go through moderation for safer journeys.</p>
            </div>
            <div className="feature-card">
              <h3>Live Updates</h3>
              <p>Get real-time booking, payment, and status notifications instantly.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
