import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="container">
        <section className="hero">
          <h1>Welcome to RentGo</h1>
          <p>Your trusted platform for rental services</p>
          <div className="hero-buttons">
            <button className="btn btn-primary">Browse Rentals</button>
            <button className="btn btn-secondary">List Your Property</button>
          </div>
        </section>

        <section className="features">
          <h2>Why Choose RentGo?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Easy to Use</h3>
              <p>Simple and intuitive interface for seamless experience</p>
            </div>
            <div className="feature-card">
              <h3>Verified Listings</h3>
              <p>All properties are verified for your safety</p>
            </div>
            <div className="feature-card">
              <h3>24/7 Support</h3>
              <p>Our support team is always here to help you</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
