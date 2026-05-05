import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import routeService from '../services/routeService';
import './RoutePackages.css';

const today = new Date().toISOString().split('T')[0];

const formatCurrency = (value) => `BDT ${Math.round(Number(value || 0)).toLocaleString()}`;

const getTripDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
};

const getOfferEstimate = (offer, tripDays, withDriver) => {
  const packageDurationDays = Math.max(1, Number(offer.packageDurationDays || 1));
  const packageUnits = Math.max(1, Math.ceil(tripDays / packageDurationDays));
  const baseRate = offer.packagePrice
    ? Number(offer.packagePrice || 0) * packageUnits
    : Number(offer.dailyRate || 0) * tripDays;
  const driverFee = withDriver && !offer.packageWithDriver && !offer.packageInclusions?.some((item) => /driver/i.test(item))
    ? Number(offer.driverSurcharge || 0) * tripDays
    : 0;
  const serviceFee = Math.round((baseRate + driverFee) * 0.08);
  const total = baseRate + driverFee + serviceFee;

  return {
    days: tripDays,
    baseRate,
    driverFee,
    serviceFee,
    multiDayDiscount: 0,
    total,
    advanceAmount: Math.round(total * 0.3),
  };
};

const RoutePackages = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [tripPlan, setTripPlan] = useState({
    startDate: '',
    endDate: '',
    passengers: 4,
    withDriver: true,
    returnTrip: false,
    pickupPoint: '',
    dropPoint: '',
  });

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const data = await routeService.getRoutePackages();
        const routePackages = Array.isArray(data) ? data : [];
        setPackages(routePackages);
        setSelectedPackage(routePackages[0] || null);
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

  const filteredPackages = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return packages;

    return packages.filter((pkg) => (
      `${pkg.routeName} ${pkg.origin} ${pkg.destination}`.toLowerCase().includes(term)
    ));
  }, [packages, searchText]);

  const tripDays = getTripDays(tripPlan.startDate, tripPlan.endDate);
  const dateError = tripPlan.startDate && tripPlan.endDate && new Date(tripPlan.endDate) <= new Date(tripPlan.startDate);

  const visibleOffers = useMemo(() => {
    const passengerCount = Number(tripPlan.passengers || 1);
    const withDriver = Boolean(tripPlan.withDriver);

    const nextOffers = offers.filter((offer) => {
      const typeMatches = !vehicleType || offer.vehicleType === vehicleType;
      const seatMatches = !offer.seats || offer.seats >= passengerCount;
      const modeMatches = !withDriver || ['with_driver', 'both'].includes(offer.rentalMode);
      return typeMatches && seatMatches && modeMatches;
    });

    return nextOffers.sort((a, b) => {
      if (sortBy === 'price') {
        return getOfferEstimate(a, tripDays, withDriver).total - getOfferEstimate(b, tripDays, withDriver).total;
      }
      if (sortBy === 'rating') {
        return Number(b.rating || 0) - Number(a.rating || 0);
      }
      if (sortBy === 'seats') {
        return Number(b.seats || 0) - Number(a.seats || 0);
      }
      const aRecommended = selectedPackage?.recommendedVehicleTypes?.includes(a.vehicleType) ? 1 : 0;
      const bRecommended = selectedPackage?.recommendedVehicleTypes?.includes(b.vehicleType) ? 1 : 0;
      return bRecommended - aRecommended || Number(a.dailyRate || 0) - Number(b.dailyRate || 0);
    });
  }, [offers, selectedPackage, sortBy, tripDays, tripPlan.passengers, tripPlan.withDriver, vehicleType]);

  const bestOffer = visibleOffers[0];
  const bestEstimate = bestOffer ? getOfferEstimate(bestOffer, tripDays, tripPlan.withDriver) : null;

  const handleTripPlanChange = (event) => {
    const { name, value, type, checked } = event.target;
    setTripPlan((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setVehicleType('');
    setTripPlan((prev) => ({
      ...prev,
      pickupPoint: '',
      dropPoint: '',
    }));
  };

  const handleBookOffer = (offer) => {
    if (!tripPlan.startDate || !tripPlan.endDate || dateError) {
      setError('Please select valid start and end dates before booking a route package.');
      return;
    }

    const estimate = getOfferEstimate(offer, tripDays, tripPlan.withDriver);
    const pickupAddress = `${selectedPackage.origin}${tripPlan.pickupPoint ? ` - ${tripPlan.pickupPoint}` : ''}`;
    const dropAddress = `${selectedPackage.destination}${tripPlan.dropPoint ? ` - ${tripPlan.dropPoint}` : ''}`;
    const packageNote = [
      `Intercity package: ${selectedPackage.routeName}`,
      `Passengers: ${tripPlan.passengers}`,
      tripPlan.returnTrip ? 'Customer requested return trip support.' : 'One-way intercity trip.',
    ].join(' | ');

    navigate(`/booking/${offer._id}`, {
      state: {
        vehicleId: offer._id,
        dates: { start: tripPlan.startDate, end: tripPlan.endDate },
        estimate,
        vehicleName: offer.vehicleName,
        withDriver: tripPlan.withDriver,
        bookingMode: 'request',
        pickupAddress,
        dropAddress,
        tripType: 'tourism',
        specialNotes: packageNote,
        routePackage: {
          id: selectedPackage._id,
          routeName: selectedPackage.routeName,
          origin: selectedPackage.origin,
          destination: selectedPackage.destination,
          returnTrip: tripPlan.returnTrip,
          passengers: tripPlan.passengers,
        },
      },
    });
  };

  return (
    <div className="route-packages-page">
      <section className="route-hero">
        <div>
          <p className="route-kicker">Intercity travel</p>
          <h1>Book Route Packages Across Bangladesh</h1>
          <p>
            Choose a popular city route, set your travel details, compare matching vendor vehicles,
            and send a booking request directly from the package.
          </p>
        </div>
        <div className="route-hero-summary">
          <span>{packages.length}</span>
          <small>vendor packages</small>
        </div>
      </section>

      {error && (
        <div className="route-alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <section className="route-layout">
        <aside className="route-sidebar">
          <div className="route-panel">
            <div className="route-panel-header">
              <h2>Routes</h2>
              <span>{filteredPackages.length} found</span>
            </div>
            <input
              className="route-search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search Dhaka, Sylhet, Cox's Bazar..."
            />

            {loading ? (
              <p className="route-muted">Loading route packages...</p>
            ) : filteredPackages.length === 0 ? (
              <p className="route-muted">No route packages match your search.</p>
            ) : (
              <div className="route-list">
                {filteredPackages.map((pkg) => (
                  <button
                    type="button"
                    key={pkg._id}
                    className={`route-card ${selectedPackage?._id === pkg._id ? 'active' : ''}`}
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    <strong>{pkg.routeName}</strong>
                    <span>{pkg.origin} to {pkg.destination}</span>
                    <span>{pkg.vendor?.vendorDetails?.businessName || pkg.vendor?.name || 'Route marketplace'}</span>
                    <small>{formatCurrency(pkg.priceMin)} - {formatCurrency(pkg.priceMax)}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="route-main">
          {selectedPackage && (
            <>
              <section className="route-panel route-planner">
                <div className="route-heading-row">
                  <div>
                    <h2>{selectedPackage.routeName}</h2>
                    <p>
                      {selectedPackage.origin} to {selectedPackage.destination}
                      {' '}by {selectedPackage.vendor?.vendorDetails?.businessName || selectedPackage.vendor?.name || 'RentGo route marketplace'}
                    </p>
                  </div>
                  <div className="route-price-pill">
                    <span>Vendor price</span>
                    <strong>{formatCurrency(selectedPackage.priceMin)}+</strong>
                  </div>
                </div>

                {selectedPackage.description && (
                  <p className="route-package-description">{selectedPackage.description}</p>
                )}

                <div className="route-package-benefits">
                  {(selectedPackage.inclusions || []).slice(0, 6).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                  {selectedPackage.returnTripAvailable && <span>Return trip available</span>}
                  {selectedPackage.fuelIncluded && <span>Fuel included</span>}
                  {selectedPackage.vehicle?.make && (
                    <span>{selectedPackage.vehicle.make} {selectedPackage.vehicle.model}</span>
                  )}
                </div>

                <div className="route-steps">
                  <div>
                    <span>1</span>
                    Pick route
                  </div>
                  <div>
                    <span>2</span>
                    Add trip details
                  </div>
                  <div>
                    <span>3</span>
                    Book vendor offer
                  </div>
                </div>

                <div className="route-form-grid">
                  <label>
                    Start date
                    <input type="date" min={today} name="startDate" value={tripPlan.startDate} onChange={handleTripPlanChange} />
                  </label>
                  <label>
                    End date
                    <input type="date" min={tripPlan.startDate || today} name="endDate" value={tripPlan.endDate} onChange={handleTripPlanChange} />
                  </label>
                  <label>
                    Passengers
                    <input type="number" min="1" max="50" name="passengers" value={tripPlan.passengers} onChange={handleTripPlanChange} />
                  </label>
                  <label>
                    Vehicle type
                    <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)}>
                      <option value="">Any recommended type</option>
                      <option value="car">Car</option>
                      <option value="microbus">Microbus</option>
                      <option value="van">Van</option>
                      <option value="pickup">Pickup</option>
                      <option value="bus">Bus</option>
                    </select>
                  </label>
                  <label>
                    Pickup point in {selectedPackage.origin}
                    <input name="pickupPoint" value={tripPlan.pickupPoint} onChange={handleTripPlanChange} placeholder="Hotel, area, terminal..." />
                  </label>
                  <label>
                    Drop point in {selectedPackage.destination}
                    <input name="dropPoint" value={tripPlan.dropPoint} onChange={handleTripPlanChange} placeholder="Hotel, area, terminal..." />
                  </label>
                </div>

                {dateError && <p className="route-field-error">End date must be after start date.</p>}

                <div className="route-options">
                  <label>
                    <input type="checkbox" name="withDriver" checked={tripPlan.withDriver} onChange={handleTripPlanChange} />
                    Include driver
                  </label>
                  <label>
                    <input type="checkbox" name="returnTrip" checked={tripPlan.returnTrip} onChange={handleTripPlanChange} />
                    Need return trip support
                  </label>
                  <label>
                    Sort offers
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                      <option value="recommended">Recommended</option>
                      <option value="price">Lowest estimated total</option>
                      <option value="rating">Highest rating</option>
                      <option value="seats">Most seats</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="route-panel route-insights">
                <div>
                  <span className="route-stat-label">Trip duration</span>
                  <strong>{tripDays} day{tripDays === 1 ? '' : 's'}</strong>
                </div>
                <div>
                  <span className="route-stat-label">Matching offers</span>
                  <strong>{visibleOffers.length}</strong>
                </div>
                <div>
                  <span className="route-stat-label">Best visible total</span>
                  <strong>{bestEstimate ? formatCurrency(bestEstimate.total) : 'No offer'}</strong>
                </div>
                <div>
                  <span className="route-stat-label">Recommended</span>
                  <strong>{selectedPackage.recommendedVehicleTypes?.join(', ') || 'Any'}</strong>
                </div>
              </section>

              <section className="route-panel">
                <div className="route-panel-header">
                  <h2>Book an Available Vendor Offer</h2>
                  <span>{loadingOffers ? 'Loading...' : `${visibleOffers.length} offers`}</span>
                </div>

                {loadingOffers ? (
                  <p className="route-muted">Finding vehicles for this route...</p>
                ) : visibleOffers.length === 0 ? (
                  <div className="route-empty-offers">
                    <h3>No matching vehicles found</h3>
                    <p>Try reducing passenger count, choosing any vehicle type, or turning off driver requirement.</p>
                  </div>
                ) : (
                  <div className="route-offer-grid">
                    {visibleOffers.map((offer) => {
                      const estimate = getOfferEstimate(offer, tripDays, tripPlan.withDriver);
                      const vendorName = offer.vendor?.vendorDetails?.businessName || offer.vendor?.name || 'Vendor';
                      const isRecommended = selectedPackage.recommendedVehicleTypes?.includes(offer.vehicleType);

                      return (
                        <article key={offer._id} className="route-offer-card">
                          <div className="route-offer-photo">
                            {offer.photos?.[0] ? (
                              <img src={offer.photos[0]} alt={offer.vehicleName} />
                            ) : (
                              <span>{offer.vehicleType}</span>
                            )}
                          </div>
                          <div className="route-offer-body">
                            <div className="route-offer-title">
                              <div>
                                <h3>{offer.vehicleName}</h3>
                                <p>{vendorName}</p>
                              </div>
                              {isRecommended && <span className="route-badge">Best fit</span>}
                            </div>

                            <div className="route-offer-meta">
                              <span>{offer.vehicleType}</span>
                              <span>{offer.seats || '-'} seats</span>
                              <span>{offer.ac ? 'AC' : 'Non-AC'}</span>
                              <span>{offer.rating || 0}/5 rating</span>
                              <span>Fuel {offer.fuelPolicy || 'excluded'}</span>
                            </div>

                            <div className="route-cost-breakdown">
                              <div><span>Vehicle rent</span><strong>{formatCurrency(estimate.baseRate)}</strong></div>
                              {tripPlan.withDriver && <div><span>Driver fee</span><strong>{formatCurrency(estimate.driverFee)}</strong></div>}
                              <div><span>Service fee</span><strong>{formatCurrency(estimate.serviceFee)}</strong></div>
                              <div className="total"><span>Estimated total</span><strong>{formatCurrency(estimate.total)}</strong></div>
                              <div><span>Advance</span><strong>{formatCurrency(estimate.advanceAmount)}</strong></div>
                            </div>

                            <div className="route-offer-actions">
                              <button type="button" className="route-secondary-btn" onClick={() => navigate(`/vehicles/${offer._id}`)}>
                                View vehicle
                              </button>
                              <button type="button" className="route-primary-btn" onClick={() => handleBookOffer(offer)}>
                                Book package
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </section>
    </div>
  );
};

export default RoutePackages;
