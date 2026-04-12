import React, { useEffect, useState } from 'react';
import './Home.css';
import { getVehicleDriverRatings } from '../services/driverService';

const featuredVehicles = [
  {
    id: 'vh-1',
    name: 'Toyota Premio 2024',
    type: 'Sedan',
    location: 'Dhaka',
    baseFare: 5500,
    vendorId: '000000000000000000000001',
  },
  {
    id: 'vh-2',
    name: 'Mitsubishi Xpander',
    type: 'SUV',
    location: 'Chattogram',
    baseFare: 7200,
    vendorId: '000000000000000000000002',
  },
];

const renderStars = (score) => {
  const rounded = Math.round(score || 0);
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
};

const Home = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(featuredVehicles[0]);
  const [withDriver, setWithDriver] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    const loadDriverRatings = async () => {
      if (!withDriver || !selectedVehicle?.vendorId) {
        setRatings([]);
        return;
      }

      setLoadingRatings(true);
      try {
        const response = await getVehicleDriverRatings(selectedVehicle.vendorId);
        setRatings(response);
      } catch (error) {
        setRatings([]);
      } finally {
        setLoadingRatings(false);
      }
    };

    loadDriverRatings();
  }, [selectedVehicle, withDriver]);

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

        <section className="vehicle-explorer">
          <h2>Vehicle Detail Preview</h2>
          <p className="vehicle-explorer-subtitle">
            Turn on with-driver to view available driver ratings for this vehicle vendor.
          </p>

          <div className="vehicle-grid">
            {featuredVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                className={`vehicle-card ${selectedVehicle.id === vehicle.id ? 'active' : ''}`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <h3>{vehicle.name}</h3>
                <p>{vehicle.type}</p>
                <p>{vehicle.location}</p>
                <p>From BDT {vehicle.baseFare}/day</p>
              </button>
            ))}
          </div>

          <div className="vehicle-detail-panel">
            <div className="vehicle-detail-head">
              <div>
                <h3>{selectedVehicle.name}</h3>
                <p>
                  {selectedVehicle.type} • {selectedVehicle.location}
                </p>
              </div>
              <label className="driver-toggle">
                <input
                  type="checkbox"
                  checked={withDriver}
                  onChange={(event) => setWithDriver(event.target.checked)}
                />
                <span>With Driver</span>
              </label>
            </div>

            {!withDriver && (
              <p className="helper-text">Enable with-driver to view vendor driver ratings.</p>
            )}

            {withDriver && loadingRatings && <p className="helper-text">Loading driver ratings...</p>}

            {withDriver && !loadingRatings && ratings.length === 0 && (
              <p className="helper-text">No rated drivers available yet for this vendor.</p>
            )}

            {withDriver && !loadingRatings && ratings.length > 0 && (
              <div className="rating-list">
                {ratings.map((driver) => (
                  <div key={driver._id} className="rating-item">
                    <img src={driver.photoUrl} alt={driver.fullName} />
                    <div>
                      <h4>{driver.fullName}</h4>
                      <p>{renderStars(driver.averageRating)} ({Number(driver.averageRating || 0).toFixed(1)})</p>
                      <p>{driver.experienceYears} yrs • {driver.languages?.join(', ')}</p>
                      <p>{driver.ratingsCount} reviews</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
