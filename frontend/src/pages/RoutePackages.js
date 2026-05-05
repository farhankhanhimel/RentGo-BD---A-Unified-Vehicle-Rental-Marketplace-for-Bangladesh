import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import routeService from '../services/routeService';
import '../styles/BookingPages.css';

const RoutePackages = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const data = await routeService.getRoutePackages();
        setPackages(Array.isArray(data) ? data : []);
        const initialPackage = Array.isArray(data) && data.length > 0 ? data[0] : null;
        setSelectedPackage(initialPackage);
      } catch (err) {
        setError('Failed to load route packages');
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  useEffect(() => {
    if (!selectedPackage?._id) {
      setOffers([]);
      return;
    }

    const loadOffers = async () => {
      try {
        setLoadingOffers(true);
        const data = await routeService.getRoutePackageOffers(selectedPackage._id);
        setOffers(data?.offers || []);
      } catch (err) {
        setError('Failed to load route offers');
      } finally {
        setLoadingOffers(false);
      }
    };

    loadOffers();
  }, [selectedPackage]);

  const handleBookOffer = (offer) => {
    navigate(`/vehicles/${offer._id}`);
  };

  return (
    <div className="booking-form-container" style={{ maxWidth: '1200px' }}>
      <div className="booking-card" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Intercity Route Packages</h1>
        <p style={{ color: '#718096' }}>
          Pick a popular route and compare live vendor offers instantly.
        </p>
      </div>

      {error && <div className="toast error">{error}</div>}

      {loading ? (
        <div className="booking-card">Loading route packages...</div>
      ) : (
        <div className="booking-card">
          <h2>Popular Routes</h2>
          <div className="trip-type-selector" style={{ marginTop: '1rem' }}>
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className={`trip-type-option ${selectedPackage?._id === pkg._id ? 'active' : ''}`}
                onClick={() => setSelectedPackage(pkg)}
                role="button"
                tabIndex={0}
              >
                <strong>{pkg.routeName}</strong>
                <div style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  ৳{pkg.priceMin?.toLocaleString()} - ৳{pkg.priceMax?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPackage && (
        <div className="booking-card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2>{selectedPackage.routeName}</h2>
              <p style={{ color: '#718096' }}>
                {selectedPackage.origin} to {selectedPackage.destination}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>৳{selectedPackage.priceMin?.toLocaleString()}+</div>
              <div style={{ color: '#718096' }}>Estimated package range</div>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <strong>Recommended vehicle types:</strong>{' '}
            {selectedPackage.recommendedVehicleTypes?.join(', ') || 'Any available vehicle'}
          </div>
        </div>
      )}

      <div className="booking-card" style={{ marginTop: '1.5rem' }}>
        <h2>Available Vendor Offers</h2>
        {loadingOffers ? (
          <p style={{ color: '#718096' }}>Loading offers...</p>
        ) : offers.length === 0 ? (
          <p style={{ color: '#718096' }}>No offers found for this route yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {offers.map((offer) => (
              <div key={offer._id} className="cost-summary-card" style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{offer.vehicleName}</h3>
                    <p style={{ color: '#718096', margin: '0.35rem 0' }}>
                      {offer.vehicleType} • {offer.vendor?.vendorDetails?.businessName || offer.vendor?.name || 'Vendor'}
                    </p>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      {offer.seats ? `${offer.seats} seats • ` : ''}
                      {offer.transmission || ''}
                      {offer.ac ? ' • AC' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>৳{offer.dailyRate?.toLocaleString()}/day</div>
                    <div style={{ color: '#718096', fontSize: '0.85rem' }}>Rating {offer.rating || 0}/5</div>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn-prev" onClick={() => handleBookOffer(offer)}>
                    View Vehicle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutePackages;
