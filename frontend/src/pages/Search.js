import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import vehicleService from '../services/vehicleService';
import routeService from '../services/routeService';
import eventPackageService from '../services/eventPackageService';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '../utils/googleMaps';
import '../styles/Search.css';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = { lat: 23.8103, lng: 90.4125 }; // Dhaka fallback

const TRIP_TYPES = [
  { value: 'tourism', label: 'Tourism', eventType: 'tourism' },
  { value: 'airport_transfer', label: 'Airport Transfer', eventType: 'airport_transfer' },
  { value: 'wedding', label: 'Wedding', eventType: 'wedding' },
  { value: 'office', label: 'Office', eventType: 'corporate' },
  { value: 'emergency', label: 'Emergency', eventType: 'other' },
];

const getTripConfig = (tripType) => TRIP_TYPES.find((item) => item.value === tripType);

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [recommendedVehicleTypes, setRecommendedVehicleTypes] = useState([]);
  const [selectedTripType, setSelectedTripType] = useState('');
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [recommendedRoutePackages, setRecommendedRoutePackages] = useState([]);
  const [recommendedEventPackages, setRecommendedEventPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [, setSelectedVehicle] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const search = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await vehicleService.search(params);
      setVehicles(data.vehicles || []);
      setRecommendedVehicleTypes(data.recommendedVehicleTypes || []);
      if (data.vehicles && data.vehicles.length > 0) {
        const v = data.vehicles[0];
        if (v.location?.coordinates?.lat && v.location?.coordinates?.lng) {
          setMapCenter({ lat: v.location.coordinates.lat, lng: v.location.coordinates.lng });
        }
      }
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load
    search({ city: 'Dhaka', limit: 20 });
  }, [search]);

  const fetchPackageRecommendations = useCallback(async (tripType, city = '') => {
    if (!tripType) {
      setRecommendedRoutePackages([]);
      setRecommendedEventPackages([]);
      return;
    }

    const tripConfig = getTripConfig(tripType);
    setPackagesLoading(true);

    try {
      const [routePackages, eventPackageData] = await Promise.all([
        routeService.getRoutePackages(),
        eventPackageService.getPackages({
          eventType: tripConfig?.eventType,
          city: city || undefined,
          page: 1,
          limit: 6,
        }),
      ]);

      const normalizedRecommendedTypes = recommendedVehicleTypes.map((t) => String(t || '').toLowerCase());

      const scoredRoutePackages = (routePackages || []).map((pkg) => {
        const pkgTypes = (pkg.recommendedVehicleTypes || []).map((t) => String(t || '').toLowerCase());
        const overlap = pkgTypes.filter((type) => normalizedRecommendedTypes.includes(type)).length;
        const cityText = `${pkg.origin || ''} ${pkg.destination || ''}`.toLowerCase();
        const cityScore = city && cityText.includes(city.toLowerCase()) ? 1 : 0;
        return { ...pkg, recommendationScore: overlap + cityScore };
      });

      scoredRoutePackages.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
      setRecommendedRoutePackages(scoredRoutePackages.slice(0, 4));
      setRecommendedEventPackages((eventPackageData?.packages || []).slice(0, 4));
    } catch (error) {
      console.error('Recommendation fetch error', error);
      setRecommendedRoutePackages([]);
      setRecommendedEventPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  }, [recommendedVehicleTypes]);

  useEffect(() => {
    fetchPackageRecommendations(selectedTripType, query);
  }, [selectedTripType, query, fetchPackageRecommendations]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {
      city: query,
      ...filters,
      tripType: selectedTripType || undefined,
      recommendedOnly: selectedTripType ? String(recommendedOnly) : undefined,
      limit: 50,
    };
    search(params);
  };

  const handleTripTypeChange = (tripType) => {
    setSelectedTripType(tripType);
    const nextRecommendedOnly = Boolean(tripType);
    setRecommendedOnly(nextRecommendedOnly);

    const params = {
      city: query || 'Dhaka',
      ...filters,
      tripType: tripType || undefined,
      recommendedOnly: tripType ? String(nextRecommendedOnly) : undefined,
      limit: 50,
    };
    search(params);
  };

  return (
    <div className="search-page">
      <div className="search-controls">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input placeholder="Enter city or district" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn btn-primary" type="submit">Search</button>
        </form>

        <div className="filter-panel">
          <label>
            Trip Purpose
            <select value={selectedTripType} onChange={(e) => handleTripTypeChange(e.target.value)}>
              <option value="">Any</option>
              {TRIP_TYPES.map((trip) => (
                <option key={trip.value} value={trip.value}>{trip.label}</option>
              ))}
            </select>
          </label>

          <label className="recommended-toggle">
            <input
              type="checkbox"
              checked={recommendedOnly}
              disabled={!selectedTripType}
              onChange={(e) => {
                const checked = e.target.checked;
                setRecommendedOnly(checked);
                search({
                  city: query || 'Dhaka',
                  ...filters,
                  tripType: selectedTripType || undefined,
                  recommendedOnly: selectedTripType ? String(checked) : undefined,
                  limit: 50,
                });
              }}
            />
            Show only recommended vehicles
          </label>

          <label>
            Vehicle Type
            <select onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}>
              <option value="">Any</option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="van">Van</option>
              <option value="microbus">Microbus</option>
              <option value="pickup">Pickup</option>
              <option value="bus">Bus</option>
            </select>
          </label>

          <label>
            Transmission
            <select onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}>
              <option value="">Any</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label>
            Fuel Type
            <select onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}>
              <option value="">Any</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="cng">CNG</option>
            </select>
          </label>

          <label>
            AC
            <select onChange={(e) => setFilters({ ...filters, ac: e.target.value })}>
              <option value="">Either</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>

          <label>
            Seats >=
            <input type="number" min="1" onChange={(e) => setFilters({ ...filters, seats: e.target.value })} />
          </label>

          <label>
            Sort
            <select onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating</option>
              <option value="proximity">Proximity</option>
            </select>
          </label>
        </div>
      </div>

      {selectedTripType && (
        <section className="smart-recommendation-panel">
          <div className="smart-recommendation-header">
            <h2>Smart Recommendations for {getTripConfig(selectedTripType)?.label}</h2>
            {recommendedVehicleTypes.length > 0 && (
              <div className="recommended-types">
                {recommendedVehicleTypes.map((type) => (
                  <span key={type} className="type-chip">{type.replace('_', ' ')}</span>
                ))}
              </div>
            )}
          </div>

          {packagesLoading ? (
            <p>Loading package recommendations...</p>
          ) : (
            <div className="recommended-packages-grid">
              <div className="recommended-column">
                <h3>Best Route Packages</h3>
                {recommendedRoutePackages.length === 0 ? (
                  <p className="empty-note">No route package recommendations found yet.</p>
                ) : (
                  recommendedRoutePackages.map((pkg) => (
                    <div key={pkg._id} className="mini-package-card">
                      <strong>{pkg.routeName}</strong>
                      <span>{pkg.origin} to {pkg.destination}</span>
                      <span>Range: ৳{pkg.priceMin} - ৳{pkg.priceMax}</span>
                    </div>
                  ))
                )}
                <Link className="mini-link" to="/route-packages">View all route packages</Link>
              </div>

              <div className="recommended-column">
                <h3>Relevant Event Packages</h3>
                {recommendedEventPackages.length === 0 ? (
                  <p className="empty-note">No event package recommendations found yet.</p>
                ) : (
                  recommendedEventPackages.map((pkg) => (
                    <div key={pkg._id} className="mini-package-card">
                      <strong>{pkg.title}</strong>
                      <span>Type: {pkg.eventType.replace('_', ' ')}</span>
                      <span>From ৳{pkg.pricing?.basePrice || 0}</span>
                    </div>
                  ))
                )}
                <Link className="mini-link" to="/event-packages">View all event packages</Link>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="search-results">
        <div className="map-column">
          {isLoaded ? (
            <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={12}>
              {vehicles.map((v) => (
                v.location?.coordinates?.lat && v.location?.coordinates?.lng && (
                  <Marker
                    key={v._id}
                    position={{ lat: v.location.coordinates.lat, lng: v.location.coordinates.lng }}
                    onClick={() => setSelectedVehicle(v)}
                  />
                )
              ))}
            </GoogleMap>
          ) : (
            <div className="map-placeholder">Map loading...</div>
          )}
        </div>

        <div className="list-column">
          <h2>Available Vehicles {loading && '(loading...)'}</h2>
          <div className="vehicle-list">
            {vehicles.map((v) => (
              <div
                key={v._id}
                className="vehicle-card"
                onClick={() => {
                  setSelectedVehicle(v);
                  navigate(`/vehicles/${v._id}`);
                }}
              >
                <img src={v.photos?.[0]?.url || v.photos?.[0] || 'https://via.placeholder.com/150'} alt="thumb" />
                <div className="vehicle-info">
                  {v.isRecommendedForTrip && <span className="trip-match-badge">Best match for your trip</span>}
                  <h3>{v.make} {v.model} ({v.year})</h3>
                  <div>{v.location?.city} {v.location?.district ? `, ${v.location.district}` : ''}</div>
                  <div>৳{v.pricing?.dailyRate || 'N/A'} / day</div>
                  <div>Seats: {v.features?.seats || '-' } • {v.features?.transmission || '-'} • {v.features?.fuelType || '-'}</div>
                  {v.distanceKm !== undefined && <div>Distance: {v.distanceKm.toFixed(1)} km</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
