import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import routeService from '../services/routeService';
import FareComparisonCard from '../components/FareComparisonCard';
import './FareEstimator.css';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const LIBRARIES = ['places'];

// Default center: Bangladesh
const BD_CENTER = { lat: 23.8103, lng: 90.4125 };

const FareEstimator = () => {
  // Location state
  const [pickup, setPickup] = useState({ address: '', lat: '', lng: '', city: '' });
  const [destination, setDestination] = useState({ address: '', lat: '', lng: '' });
  const [activePin, setActivePin] = useState(null); // 'pickup' or 'destination'

  // City/area selection state
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [destinationMode, setDestinationMode] = useState('dropdown'); // 'dropdown' or 'map'

  // Form state
  const [vehicleType, setVehicleType] = useState('');
  const [rentalMode, setRentalMode] = useState('with_driver');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [popularRoutes, setPopularRoutes] = useState([]);

  // Map state
  const [mapCenter, setMapCenter] = useState(BD_CENTER);
  const [mapZoom, setMapZoom] = useState(7);
  const [directions, setDirections] = useState(null);
  const [geolocating, setGeolocating] = useState(false);

  // Refs for Autocomplete
  const pickupAutocompleteRef = useRef(null);
  const destAutocompleteRef = useRef(null);
  const mapRef = useRef(null);

  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    fetchPopularRoutes();
    fetchCities();
  }, []);

  // Update route directions when both points are set
  useEffect(() => {
    if (isLoaded && pickup.lat && pickup.lng && destination.lat && destination.lng) {
      calculateDirections();
    } else {
      setDirections(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng, isLoaded]);

  const fetchPopularRoutes = async () => {
    try {
      const routes = await routeService.getPopularRoutes();
      setPopularRoutes(routes);
    } catch (err) {
      console.error('Error fetching popular routes:', err);
    }
  };

  const fetchCities = async () => {
    try {
      const citiesData = await routeService.getCities();
      setCities(citiesData);
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const calculateDirections = () => {
    if (!window.google) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: Number(pickup.lat), lng: Number(pickup.lng) },
        destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  };

  // Use browser geolocation for pickup
  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGeolocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await routeService.reverseGeocode(latitude, longitude);
          setPickup({
            address: result.address,
            lat: latitude,
            lng: longitude,
            city: result.address,
          });
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(14);
        } catch (err) {
          setPickup({
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
            city: '',
          });
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(14);
        }
        setGeolocating(false);
        setResults(null);
      },
      (err) => {
        setError('Unable to get your location. Please allow location access or enter manually.');
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle map click to place pins
  const handleMapClick = useCallback(
    async (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (!activePin) return;

      try {
        const result = await routeService.reverseGeocode(lat, lng);
        const address = result.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        if (activePin === 'pickup') {
          setPickup({ address, lat, lng, city: address });
        } else if (activePin === 'destination') {
          setDestination({ address, lat, lng });
          setDestinationMode('map');
          setSelectedCity('');
          setSelectedArea('');
        }
        setResults(null);
      } catch (err) {
        const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        if (activePin === 'pickup') {
          setPickup({ address, lat, lng, city: '' });
        } else {
          setDestination({ address, lat, lng });
          setDestinationMode('map');
        }
        setResults(null);
      }
    },
    [activePin]
  );

  // Handle pickup marker drag
  const handlePickupDrag = useCallback(async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    try {
      const result = await routeService.reverseGeocode(lat, lng);
      setPickup({ address: result.address, lat, lng, city: result.address });
    } catch {
      setPickup((prev) => ({ ...prev, lat, lng }));
    }
    setResults(null);
  }, []);

  // Handle destination marker drag
  const handleDestinationDrag = useCallback(async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    try {
      const result = await routeService.reverseGeocode(lat, lng);
      setDestination({ address: result.address, lat, lng });
    } catch {
      setDestination((prev) => ({ ...prev, lat, lng }));
    }
    setDestinationMode('map');
    setSelectedCity('');
    setSelectedArea('');
    setResults(null);
  }, []);

  // Handle city dropdown change
  const handleCityChange = (cityId) => {
    setSelectedCity(cityId);
    setSelectedArea('');
    setResults(null);
    setDestinationMode('dropdown');

    if (!cityId) {
      setDestination({ address: '', lat: '', lng: '' });
      return;
    }

    const city = cities.find((c) => c.id === cityId);
    if (city) {
      setDestination({
        address: city.name,
        lat: city.lat,
        lng: city.lng,
      });
      setMapCenter({ lat: city.lat, lng: city.lng });
      setMapZoom(12);
    }
  };

  // Handle area dropdown change
  const handleAreaChange = (areaName) => {
    setSelectedArea(areaName);
    setResults(null);

    if (!areaName) {
      // Reset to city level
      const city = cities.find((c) => c.id === selectedCity);
      if (city) {
        setDestination({ address: city.name, lat: city.lat, lng: city.lng });
      }
      return;
    }

    const city = cities.find((c) => c.id === selectedCity);
    if (city) {
      const area = city.areas.find((a) => a.name === areaName);
      if (area) {
        setDestination({
          address: `${area.name}, ${city.name}`,
          lat: area.lat,
          lng: area.lng,
        });
        setMapCenter({ lat: area.lat, lng: area.lng });
        setMapZoom(14);
      }
    }
  };

  // Pickup Autocomplete
  const onPickupPlaceChanged = () => {
    if (pickupAutocompleteRef.current) {
      const place = pickupAutocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setPickup({
          address: place.formatted_address || place.name,
          lat,
          lng,
          city: place.formatted_address || place.name,
        });
        setMapCenter({ lat, lng });
        setMapZoom(14);
        setResults(null);
      }
    }
  };

  // Destination Autocomplete
  const onDestPlaceChanged = () => {
    if (destAutocompleteRef.current) {
      const place = destAutocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setDestination({
          address: place.formatted_address || place.name,
          lat,
          lng,
        });
        setMapCenter({ lat, lng });
        setMapZoom(14);
        setDestinationMode('map');
        setSelectedCity('');
        setSelectedArea('');
        setResults(null);
      }
    }
  };

  const handleEstimate = async (e) => {
    e.preventDefault();
    setError('');

    if (!pickup.address && !pickup.lat) {
      setError('Please set a pickup location');
      return;
    }
    if (!destination.address && !destination.lat) {
      setError('Please set a destination');
      return;
    }

    setLoading(true);
    try {
      const data = await routeService.estimateFare(pickup, destination, {
        vehicleType: vehicleType || undefined,
        rentalMode,
      });
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to estimate fare. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePopularRouteClick = (route) => {
    setPickup({ address: route.pickup.address, lat: route.pickup.lat, lng: route.pickup.lng, city: route.pickup.address });
    setDestination({ address: route.destination.address, lat: route.destination.lat, lng: route.destination.lng });
    setDestinationMode('map');
    setSelectedCity('');
    setSelectedArea('');
    setResults(null);
    setMapCenter({
      lat: (route.pickup.lat + route.destination.lat) / 2,
      lng: (route.pickup.lng + route.destination.lng) / 2,
    });
    setMapZoom(7);
  };

  const swapLocations = () => {
    const temp = { ...pickup };
    setPickup({ ...destination, city: destination.address });
    setDestination(temp);
    setDestinationMode('map');
    setSelectedCity('');
    setSelectedArea('');
    setResults(null);
  };

  const clearPickup = () => {
    setPickup({ address: '', lat: '', lng: '', city: '' });
    setResults(null);
  };

  const clearDestination = () => {
    setDestination({ address: '', lat: '', lng: '' });
    setSelectedCity('');
    setSelectedArea('');
    setDestinationMode('dropdown');
    setResults(null);
  };

  const formatPrice = (price) => `৳${Math.round(price).toLocaleString()}`;

  const vehicleTypes = [
    { value: '', label: 'All Types' },
    { value: 'car', label: '🚗 Car' },
    { value: 'motorcycle', label: '🏍️ Motorcycle' },
    { value: 'microbus', label: '🚐 Microbus' },
    { value: 'van', label: '🚚 Van' },
    { value: 'pickup', label: '🛻 Pickup' },
    { value: 'bus', label: '🚌 Bus' },
  ];

  const selectedCityObj = cities.find((c) => c.id === selectedCity);

  return (
    <div className="fare-estimator-container">
      {/* Hero Header */}
      <div className="fare-hero">
        <h1>Route-Based Fare Estimator</h1>
        <p>Get instant fare estimates for your trip across Bangladesh</p>
      </div>

      {/* Main Layout: Form + Map side by side */}
      <div className="fare-main-layout">
        {/* Left: Search Form */}
        <div className="fare-search-card">
          <form onSubmit={handleEstimate}>
            {/* ── PICKUP SECTION ── */}
            <div className="location-section">
              <div className="section-header">
                <span className="route-dot pickup-dot"></span>
                <h3>Pickup Location</h3>
              </div>

              <div className="location-methods">
                {/* Use My Location Button */}
                <button
                  type="button"
                  className="use-my-location-btn"
                  onClick={useMyLocation}
                  disabled={geolocating}
                >
                  {geolocating ? (
                    <span className="btn-loading-inline">
                      <span className="btn-spinner-sm"></span>
                      Locating...
                    </span>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                      </svg>
                      Use My Current Location
                    </>
                  )}
                </button>

                <div className="location-divider">
                  <span>or</span>
                </div>

                {/* Autocomplete Search */}
                {isLoaded ? (
                  <Autocomplete
                    onLoad={(autocomplete) => (pickupAutocompleteRef.current = autocomplete)}
                    onPlaceChanged={onPickupPlaceChanged}
                    options={{
                      componentRestrictions: { country: 'bd' },
                      types: ['geocode', 'establishment'],
                    }}
                  >
                    <div className="autocomplete-input-wrapper">
                      <input
                        type="text"
                        placeholder="Search for a pickup location..."
                        value={pickup.address}
                        onChange={(e) => setPickup({ ...pickup, address: e.target.value, city: e.target.value })}
                        className="location-search-input"
                      />
                      {pickup.address && (
                        <button type="button" className="clear-input-btn" onClick={clearPickup}>×</button>
                      )}
                    </div>
                  </Autocomplete>
                ) : (
                  <div className="autocomplete-input-wrapper">
                    <input
                      type="text"
                      placeholder="Enter pickup location (e.g., Dhanmondi, Dhaka)"
                      value={pickup.address}
                      onChange={(e) => setPickup({ ...pickup, address: e.target.value, city: e.target.value })}
                      className="location-search-input"
                    />
                    {pickup.address && (
                      <button type="button" className="clear-input-btn" onClick={clearPickup}>×</button>
                    )}
                  </div>
                )}

                <div className="location-divider">
                  <span>or pin on map</span>
                </div>

                <button
                  type="button"
                  className={`pin-on-map-btn ${activePin === 'pickup' ? 'active' : ''}`}
                  onClick={() => setActivePin(activePin === 'pickup' ? null : 'pickup')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {activePin === 'pickup' ? 'Click map to set pickup...' : 'Pin Pickup on Map'}
                </button>
              </div>

              {/* Show selected pickup */}
              {pickup.lat && (
                <div className="selected-location-badge pickup-badge">
                  <span className="badge-icon">📍</span>
                  <span className="badge-text">{pickup.address || `${Number(pickup.lat).toFixed(4)}, ${Number(pickup.lng).toFixed(4)}`}</span>
                  <button type="button" className="badge-remove" onClick={clearPickup}>×</button>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="swap-section">
              <button type="button" className="swap-btn" onClick={swapLocations} title="Swap locations">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* ── DESTINATION SECTION ── */}
            <div className="location-section">
              <div className="section-header">
                <span className="route-dot destination-dot"></span>
                <h3>Destination</h3>
              </div>

              {/* Destination Mode Tabs */}
              <div className="destination-mode-tabs">
                <button
                  type="button"
                  className={`mode-tab ${destinationMode === 'dropdown' ? 'active' : ''}`}
                  onClick={() => setDestinationMode('dropdown')}
                >
                  🏙️ Select City
                </button>
                <button
                  type="button"
                  className={`mode-tab ${destinationMode === 'map' ? 'active' : ''}`}
                  onClick={() => setDestinationMode('map')}
                >
                  📌 Pin on Map / Search
                </button>
              </div>

              {destinationMode === 'dropdown' ? (
                <div className="city-selection">
                  {/* City Dropdown */}
                  <div className="dropdown-group">
                    <label>Select City</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="city-select"
                    >
                      <option value="">-- Choose a city --</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Area Dropdown (appears after city is selected) */}
                  {selectedCity && selectedCityObj && (
                    <div className="dropdown-group">
                      <label>Select Area (Optional)</label>
                      <select
                        value={selectedArea}
                        onChange={(e) => handleAreaChange(e.target.value)}
                        className="area-select"
                      >
                        <option value="">-- City center ({selectedCityObj.name}) --</option>
                        {selectedCityObj.areas.map((area) => (
                          <option key={area.name} value={area.name}>{area.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="map-destination-options">
                  {/* Autocomplete Search for Destination */}
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={(autocomplete) => (destAutocompleteRef.current = autocomplete)}
                      onPlaceChanged={onDestPlaceChanged}
                      options={{
                        componentRestrictions: { country: 'bd' },
                        types: ['geocode', 'establishment'],
                      }}
                    >
                      <div className="autocomplete-input-wrapper">
                        <input
                          type="text"
                          placeholder="Search destination or pin on map..."
                          value={destination.address}
                          onChange={(e) => setDestination({ ...destination, address: e.target.value })}
                          className="location-search-input"
                        />
                        {destination.address && (
                          <button type="button" className="clear-input-btn" onClick={clearDestination}>×</button>
                        )}
                      </div>
                    </Autocomplete>
                  ) : (
                    <div className="autocomplete-input-wrapper">
                      <input
                        type="text"
                        placeholder="Enter destination (e.g., Cox's Bazar)"
                        value={destination.address}
                        onChange={(e) => setDestination({ ...destination, address: e.target.value })}
                        className="location-search-input"
                      />
                      {destination.address && (
                        <button type="button" className="clear-input-btn" onClick={clearDestination}>×</button>
                      )}
                    </div>
                  )}

                  <div className="location-divider">
                    <span>or</span>
                  </div>

                  <button
                    type="button"
                    className={`pin-on-map-btn ${activePin === 'destination' ? 'active' : ''}`}
                    onClick={() => setActivePin(activePin === 'destination' ? null : 'destination')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {activePin === 'destination' ? 'Click map to set destination...' : 'Pin Destination on Map'}
                  </button>
                </div>
              )}

              {/* Show selected destination */}
              {destination.lat && (
                <div className="selected-location-badge destination-badge">
                  <span className="badge-icon">🏁</span>
                  <span className="badge-text">{destination.address || `${Number(destination.lat).toFixed(4)}, ${Number(destination.lng).toFixed(4)}`}</span>
                  <button type="button" className="badge-remove" onClick={clearDestination}>×</button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="fare-filters">
              <div className="filter-group">
                <label>Vehicle Type</label>
                <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                  {vehicleTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Rental Mode</label>
                <div className="rental-mode-toggle">
                  <button
                    type="button"
                    className={`mode-btn ${rentalMode === 'with_driver' ? 'active' : ''}`}
                    onClick={() => setRentalMode('with_driver')}
                  >
                    With Driver
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${rentalMode === 'self_drive' ? 'active' : ''}`}
                    onClick={() => setRentalMode('self_drive')}
                  >
                    Self Drive
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="fare-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block estimate-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Calculating...
                </span>
              ) : (
                'Estimate Fare'
              )}
            </button>
          </form>
        </div>

        {/* Right: Interactive Map */}
        <div className="fare-map-card">
          <div className="map-header">
            <h3>🗺️ Interactive Map</h3>
            {activePin && (
              <div className="map-pin-indicator">
                <span className={`pin-pulse ${activePin}`}></span>
                Click on the map to set {activePin === 'pickup' ? 'pickup' : 'destination'}
              </div>
            )}
          </div>
          <div className="map-container">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={mapZoom}
                onClick={handleMapClick}
                onLoad={(map) => (mapRef.current = map)}
                options={{
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  zoomControl: true,
                  styles: [
                    {
                      featureType: 'poi',
                      elementType: 'labels',
                      stylers: [{ visibility: 'off' }],
                    },
                  ],
                }}
              >
                {/* Pickup Marker */}
                {pickup.lat && pickup.lng && (
                  <Marker
                    position={{ lat: Number(pickup.lat), lng: Number(pickup.lng) }}
                    draggable={true}
                    onDragEnd={handlePickupDrag}
                    label={{
                      text: 'P',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                    icon={window.google ? {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: '#4caf50',
                      fillOpacity: 1,
                      strokeColor: '#fff',
                      strokeWeight: 3,
                      scale: 14,
                    } : undefined}
                    title="Pickup Location (drag to adjust)"
                  />
                )}

                {/* Destination Marker */}
                {destination.lat && destination.lng && (
                  <Marker
                    position={{ lat: Number(destination.lat), lng: Number(destination.lng) }}
                    draggable={true}
                    onDragEnd={handleDestinationDrag}
                    label={{
                      text: 'D',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                    icon={window.google ? {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: '#ff4757',
                      fillOpacity: 1,
                      strokeColor: '#fff',
                      strokeWeight: 3,
                      scale: 14,
                    } : undefined}
                    title="Destination (drag to adjust)"
                  />
                )}

                {/* Route Direction Line */}
                {directions && !activePin && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#667eea',
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                      },
                    }}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="map-placeholder">
                <div className="map-placeholder-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" width="48" height="48">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <p>Map requires Google Maps API key</p>
                  <span>Set <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> in your .env file</span>
                  <p className="map-fallback-note">You can still use the form to enter locations manually</p>
                </div>
              </div>
            )}
          </div>
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-dot pickup-legend"></span> Pickup
            </div>
            <div className="legend-item">
              <span className="legend-dot destination-legend"></span> Destination
            </div>
            <div className="legend-hint">💡 Drag markers to adjust locations</div>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="fare-results">
          {/* Route Summary */}
          <div className="route-summary">
            <div className="route-summary-item">
              <span className="summary-icon">📍</span>
              <div>
                <span className="summary-label">Distance</span>
                <span className="summary-value">{results.route.distanceText}</span>
              </div>
            </div>
            <div className="route-summary-divider"></div>
            <div className="route-summary-item">
              <span className="summary-icon">⏱️</span>
              <div>
                <span className="summary-label">Est. Duration</span>
                <span className="summary-value">{results.route.durationText}</span>
              </div>
            </div>
            <div className="route-summary-divider"></div>
            <div className="route-summary-item">
              <span className="summary-icon">🚗</span>
              <div>
                <span className="summary-label">Vehicles Found</span>
                <span className="summary-value">{results.totalVehiclesFound}</span>
              </div>
            </div>
          </div>

          {/* Fare Cards by Vehicle Type */}
          {results.estimates.length === 0 ? (
            <div className="fare-no-results">
              <span>🔍</span>
              <h3>No vehicles available</h3>
              <p>No vehicles found for this route. Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            results.estimates.map((group) => (
              <div key={group.vehicleType} className="fare-type-section">
                <div className="fare-type-header">
                  <h3>{getVehicleEmoji(group.vehicleType)} {group.vehicleType}</h3>
                  <div className="fare-range">
                    <span className="fare-range-label">Price Range:</span>
                    <span className="fare-range-value">
                      {formatPrice(group.fareRange.min)} — {formatPrice(group.fareRange.max)}
                    </span>
                  </div>
                  <span className="vendor-count-badge">{group.vendorCount} vendor{group.vendorCount !== 1 ? 's' : ''}</span>
                </div>

                <div className="fare-offers-grid">
                  {group.vendorOffers.map((offer, index) => (
                    <FareComparisonCard
                      key={index}
                      offer={offer}
                      formatPrice={formatPrice}
                      getVehicleEmoji={getVehicleEmoji}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Popular Routes */}
      {!results && popularRoutes.length > 0 && (
        <div className="popular-routes-section">
          <h2>Popular Routes</h2>
          <p className="popular-routes-subtitle">Explore frequently traveled routes in Bangladesh</p>
          <div className="popular-routes-grid">
            {popularRoutes.map((route) => (
              <div
                key={route.id}
                className="popular-route-card"
                onClick={() => handlePopularRouteClick(route)}
              >
                <span className="popular-route-icon">{route.image}</span>
                <div className="popular-route-info">
                  <h4>{route.name}</h4>
                  <div className="popular-route-details">
                    <span>📍 {route.distanceKm} km</span>
                    <span>⏱️ {route.estimatedTime}</span>
                  </div>
                  <span className="popular-route-price">
                    from {formatPrice(route.startingFare)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function getVehicleEmoji(type) {
  const emojis = {
    car: '🚗',
    motorcycle: '🏍️',
    microbus: '🚐',
    van: '🚚',
    pickup: '🛻',
    bus: '🚌',
  };
  return emojis[type] || '🚗';
}

export default FareEstimator;
