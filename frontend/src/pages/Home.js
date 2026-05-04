import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Home.css';

const Home = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/vehicles');
        setVehicles(res.data.data || res.data.vehicles || []);
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  return (
    <div className="home">
      <div className="container">
        <section className="hero">
          <h1>Welcome to RentGo</h1>
          <p>Your trusted platform for rental services</p>
          <div className="hero-buttons">
            <a href="#vehicles" className="btn btn-primary">Browse Rentals</a>
            <Link to="/register" className="btn btn-secondary">List Your Property</Link>
          </div>
        </section>

        <section id="vehicles" className="vehicles-section" style={{ margin: '4rem 0' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Available Vehicles</h2>

          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading vehicles...</p>
          ) : vehicles.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No vehicles available right now.</p>
          ) : (
            <div className="vehicles-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {vehicles.map((v) => (
                <div key={v._id} className="vehicle-card" style={{
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{ height: '200px', background: '#e2e8f0' }}>
                    {v.media?.photos?.length > 0 ? (
                      <img
                        src={v.media.photos[v.media.primaryPhotoIndex || 0].url}
                        alt={`${v.specs.make} ${v.specs.model}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                    )}
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>
                      {v.specs.make} {v.specs.model} ({v.specs.year})
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#718096' }}>{v.location.city}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#2b6cb0' }}>
                        ৳{v.pricing.dailyRate}/day
                      </span>
                      <Link to={`/vehicles/${v._id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="features">
          <h2 style={{ textAlign: 'center' }}>Why Choose RentGo?</h2>
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
