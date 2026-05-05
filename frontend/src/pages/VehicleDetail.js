import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ReviewsList from '../components/ReviewsList';
import { getVehicleDriverRatings } from '../services/driverService';
import '../styles/VehiclePages.css';
import '../styles/ReviewComponents.css';

const VehicleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDates, setSelectedDates] = useState({ start: '', end: '' });
    const [withDriver, setWithDriver] = useState(false);
    const [estimate, setEstimate] = useState(null);
    const [driverRatings, setDriverRatings] = useState([]);

    const normalizePhotos = (photos = []) => (photos || [])
        .map((photo) => (typeof photo === 'string' ? { url: photo } : photo))
        .filter((photo) => photo && (photo.url || typeof photo === 'string'));

    const normalizeVehicle = (vehicle = {}) => {
        const specs = vehicle.specs || {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            seats: vehicle.features?.seats,
            fuelType: vehicle.features?.fuelType,
            transmission: vehicle.features?.transmission,
            ac: vehicle.features?.ac,
            gps: vehicle.features?.gps,
            registrationNo: vehicle.registration?.number,
            insuranceExpiry: vehicle.registration?.insuranceExpiry,
            conditionDescription: vehicle.conditionDescription || vehicle.description,
        };

        const rentalModes = vehicle.rentalModes || {
            selfDrive: vehicle.rentalMode === 'self_drive' || vehicle.rentalMode === 'both',
            withDriver: vehicle.rentalMode === 'with_driver' || vehicle.rentalMode === 'both',
        };

        const media = vehicle.media || {
            photos: normalizePhotos(vehicle.photos || vehicle.media?.photos || []),
            primaryPhotoIndex: vehicle.media?.primaryPhotoIndex || 0,
        };

        return {
            ...vehicle,
            specs,
            rentalModes,
            media,
            location: vehicle.location || {},
        };
    };

    const normalizeDetailPayload = (payload) => {
        if (!payload) return null;
        if (payload.vehicle) {
            const vehicle = normalizeVehicle(payload.vehicle);
            return {
                vehicle,
                vendor: payload.vendor || vehicle?.vendor || null,
                bookedDateRanges: payload.bookedDateRanges || [],
            };
        }
        const vehicle = normalizeVehicle(payload);
        return {
            vehicle,
            vendor: payload.vendor || null,
            bookedDateRanges: payload.bookedDateRanges || [],
        };
    };

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/vehicles/${id}/detail`);
                setData(normalizeDetailPayload(res.data));
            } catch (err) {
                try {
                    const res = await api.get(`/vehicles/${id}`);
                    setData(normalizeDetailPayload(res.data));
                } catch (fallbackErr) {
                    console.error(fallbackErr);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    useEffect(() => {
        if (selectedDates.start && selectedDates.end) {
            const timer = setTimeout(async () => {
                try {
                    const res = await api.post(`/vehicles/${id}/estimate`, {
                        startDate: selectedDates.start,
                        endDate: selectedDates.end,
                        withDriver,
                    });
                    setEstimate(res.data);
                } catch (err) {
                    console.error(err);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [selectedDates, withDriver, id]);

    useEffect(() => {
        if (!data?.vendor?._id || !withDriver) {
            setDriverRatings([]);
            return;
        }

        const loadDriverRatings = async () => {
            try {
                const res = await getVehicleDriverRatings(data.vendor._id);
                setDriverRatings(Array.isArray(res) ? res : res?.drivers || []);
            } catch (err) {
                console.error(err);
            }
        };

        loadDriverRatings();
    }, [data?.vendor?._id, withDriver]);

    if (loading) return <div className="vehicle-detail-container"><div className="empty-state-card"><div className="emoji">⏳</div><h3>Loading vehicle details...</h3></div></div>;
    if (!data || !data.vehicle) return <div className="vehicle-detail-container"><div className="empty-state-card"><div className="emoji">❌</div><h3>Vehicle not found</h3></div></div>;

    const { vehicle, vendor, bookedDateRanges } = data;
    const photos = vehicle.media?.photos || [];
    const canBook = Boolean(selectedDates.start && selectedDates.end);
    const hasEstimate = Boolean(estimate?.total);

    const handleBookNow = () => {
        // Determine default booking mode from vehicle rental modes
        const defaultMode = vehicle.rentalModes?.selfDrive ? 'instant' : 'request';
        navigate(`/booking/${id}`, {
            state: {
                vehicleId: id,
                dates: selectedDates,
                estimate,
                vehicleName: `${vehicle.specs.make} ${vehicle.specs.model}`,
                withDriver,
                bookingMode: defaultMode,
            },
        });
    };

    return (
        <div className="vehicle-detail-container">
            {/* Photo Gallery — Swiper */}
            {photos.length > 0 && (
                <div className="photo-gallery">
                    <Swiper
                        modules={[Navigation, Pagination]}
                        navigation
                        pagination={{ clickable: true }}
                        spaceBetween={0}
                        slidesPerView={1}
                        initialSlide={vehicle.media?.primaryPhotoIndex || 0}
                        style={{ borderRadius: '16px', overflow: 'hidden' }}
                    >
                        {photos.map((p, i) => {
                            const photoUrl = typeof p === 'string' ? p : p?.url;
                            if (!photoUrl) return null;
                            return (
                                <SwiperSlide key={i}>
                                    <img
                                        src={photoUrl}
                                        alt={`${vehicle.specs.make} ${vehicle.specs.model} ${i + 1}`}
                                        className="gallery-main-image"
                                        style={{ width: '100%', objectFit: 'cover' }}
                                    />
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
            )}

            {/* Title */}
            <div className="detail-section">
                <h1 style={{ fontSize: '1.6rem', margin: 0 }}>
                    {vehicle.specs.make} {vehicle.specs.model} ({vehicle.specs.year})
                </h1>
                <p style={{ color: '#718096', margin: '0.5rem 0' }}>
                    📍 {vehicle.location.city}{vehicle.location.district ? `, ${vehicle.location.district}` : ''}
                    {vehicle.location.area ? ` — ${vehicle.location.area}` : ''}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${vehicle.vehicleType}`} style={{ background: '#ebf4ff', color: '#3182ce' }}>
                        {vehicle.vehicleType}
                    </span>
                    {vehicle.rentalModes?.selfDrive && <span className="status-badge" style={{ background: '#c6f6d5', color: '#22543d' }}>Self-Drive</span>}
                    {vehicle.rentalModes?.withDriver && <span className="status-badge" style={{ background: '#e9d5ff', color: '#553c9a' }}>With Driver</span>}
                </div>
            </div>

            {/* Specs */}
            <div className="detail-section">
                <h2>⚙️ Specifications</h2>
                <div className="specs-grid">
                    <div className="spec-item"><span className="spec-icon">💺</span><div className="spec-info"><div className="spec-label">Seats</div><div className="spec-value">{vehicle.specs.seats}</div></div></div>
                    <div className="spec-item"><span className="spec-icon">⚡</span><div className="spec-info"><div className="spec-label">Fuel</div><div className="spec-value">{vehicle.specs.fuelType}</div></div></div>
                    <div className="spec-item"><span className="spec-icon">🔧</span><div className="spec-info"><div className="spec-label">Transmission</div><div className="spec-value">{vehicle.specs.transmission}</div></div></div>
                    {vehicle.specs.ac && <div className="spec-item"><span className="spec-icon">❄️</span><div className="spec-info"><div className="spec-label">AC</div><div className="spec-value">Yes</div></div></div>}
                    {vehicle.specs.gps && <div className="spec-item"><span className="spec-icon">📡</span><div className="spec-info"><div className="spec-label">GPS</div><div className="spec-value">Yes</div></div></div>}
                    <div className="spec-item"><span className="spec-icon">📋</span><div className="spec-info"><div className="spec-label">Reg. No</div><div className="spec-value">{vehicle.specs.registrationNo}</div></div></div>
                    {vehicle.specs.insuranceExpiry && (
                        <div className="spec-item">
                            <span className="spec-icon">🛡️</span>
                            <div className="spec-info">
                                <div className="spec-label">Insurance Expiry</div>
                                <div className="spec-value">
                                    {new Date(vehicle.specs.insuranceExpiry).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {vehicle.specs.conditionDescription && (
                    <p style={{ marginTop: '1rem', color: '#4a5568', fontSize: '0.9rem' }}>{vehicle.specs.conditionDescription}</p>
                )}
            </div>

            {/* Vendor Info */}
            <div className="detail-section">
                <h2>👤 Vendor Information</h2>
                <div className="vendor-card">
                    <div className="vendor-avatar">{vendor.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="vendor-info">
                        <h3>
                            {vendor.name}
                            {vendor.isVerified && <span className="verified-badge">✓ Verified Vendor</span>}
                        </h3>
                        <p style={{ color: '#718096', fontSize: '0.85rem', margin: '0.25rem 0' }}>📞 {vendor.contactNumber}</p>
                    </div>
                </div>
            </div>

            {vehicle.rentalModes?.withDriver && (
                <div className="detail-section">
                    <h2>🧑‍✈️ Driver Profile</h2>
                    {vehicle.driverProfile?.name ? (
                        <div className="driver-card">
                            <div className="driver-avatar">
                                {vehicle.driverProfile.photoUrl ? (
                                    <img src={vehicle.driverProfile.photoUrl} alt={vehicle.driverProfile.name} />
                                ) : (
                                    <span>{vehicle.driverProfile.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="driver-info">
                                <h3>{vehicle.driverProfile.name}</h3>
                                <p>📞 {vehicle.driverProfile.phone || 'Phone not provided'}</p>
                                <p>🪪 License: {vehicle.driverProfile.licenseNumber || 'N/A'}</p>
                                {vehicle.driverProfile.licenseExpiry && (
                                    <p>📅 License Expiry: {new Date(vehicle.driverProfile.licenseExpiry).toLocaleDateString()}</p>
                                )}
                                {vehicle.driverProfile.yearsExperience != null && (
                                    <p>⭐ Experience: {vehicle.driverProfile.yearsExperience} years</p>
                                )}
                                {vehicle.driverProfile.languages?.length > 0 && (
                                    <p>🗣️ Languages: {vehicle.driverProfile.languages.join(', ')}</p>
                                )}
                                {vehicle.driverProfile.rating != null && (
                                    <p>✅ Rating: {vehicle.driverProfile.rating}/5</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: '#718096' }}>Driver profile not provided.</p>
                    )}
                </div>
            )}

            {vehicle.rentalModes?.withDriver && withDriver && driverRatings.length > 0 && (
                <div className="detail-section">
                    <h2>⭐ Available Driver Ratings</h2>
                    <div className="driver-list-grid" style={{ display: 'grid', gap: '1rem' }}>
                        {driverRatings.map((driver) => (
                            <div key={driver._id || driver.fullName} className="driver-card">
                                <div className="driver-avatar">
                                    {driver.photoUrl ? <img src={driver.photoUrl} alt={driver.fullName} /> : <span>{driver.fullName?.charAt(0)?.toUpperCase()}</span>}
                                </div>
                                <div className="driver-info">
                                    <h3>{driver.fullName}</h3>
                                    <p>⭐ Rating: {driver.averageRating?.toFixed ? driver.averageRating.toFixed(1) : (driver.averageRating || 0)}/5</p>
                                    <p>🗣️ Languages: {Array.isArray(driver.languages) ? driver.languages.join(', ') : 'N/A'}</p>
                                    <p>🪪 License: {driver.licenseNumber || 'N/A'}</p>
                                    <p>📅 Experience: {driver.experienceYears || 0} years</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Availability Calendar */}
            <div className="detail-section">
                <h2>📅 Availability</h2>
                <AvailabilityCalendar
                    vehicleId={id}
                    bookedDateRanges={bookedDateRanges}
                    onDateRangeSelect={(start, end) => setSelectedDates({ start, end })}
                />
            </div>

            {/* Cost Estimator */}
            <div className="detail-section cost-estimator">
                <h2>💰 Price Estimator</h2>
                <div className="estimate-inputs">
                    <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" value={selectedDates.start} onChange={(e) => setSelectedDates((prev) => ({ ...prev, start: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input type="date" value={selectedDates.end} onChange={(e) => setSelectedDates((prev) => ({ ...prev, end: e.target.value }))} />
                    </div>
                </div>
                {vehicle.rentalModes?.withDriver && (
                    <div className="checkbox-group">
                        <input type="checkbox" checked={withDriver} onChange={(e) => setWithDriver(e.target.checked)} id="est-driver" />
                        <label htmlFor="est-driver">Include Driver (+৳{vehicle.pricing.driverSurcharge}/day)</label>
                    </div>
                )}
                {estimate && (
                    <div style={{ marginTop: '1rem' }}>
                        <div className="estimate-row"><span>Base Rate ({estimate.days} days)</span><span>৳{estimate.baseRate?.toLocaleString()}</span></div>
                        {estimate.driverFee > 0 && <div className="estimate-row"><span>Driver Fee</span><span>৳{estimate.driverFee?.toLocaleString()}</span></div>}
                        <div className="estimate-row"><span>Service Fee (8%)</span><span>৳{estimate.serviceFee?.toLocaleString()}</span></div>
                        {estimate.multiDayDiscount > 0 && <div className="estimate-row" style={{ color: '#48bb78' }}><span>Multi-Day Discount</span><span>-৳{estimate.multiDayDiscount?.toLocaleString()}</span></div>}
                        <div className="estimate-row total"><span>Total</span><span>৳{estimate.total?.toLocaleString()}</span></div>
                        <div className="estimate-row" style={{ fontSize: '0.85rem', color: '#667eea' }}><span>Advance (30%)</span><span>৳{estimate.advanceAmount?.toLocaleString()}</span></div>
                    </div>
                )}
                <p style={{ textAlign: 'center', color: '#a0aec0', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Daily Rate: ৳{vehicle.pricing.dailyRate?.toLocaleString()}/day
                </p>
            </div>

            {/* Reviews */}
            <div className="detail-section">
                <h2>⭐ Reviews ({vehicle.meta?.totalReviews || 0})</h2>
                <ReviewsList vehicleId={id} />
            </div>

            {/* Book Now Bar */}
            <div className="book-now-bar">
                <div>
                    <div className="price-display">
                        {hasEstimate ? `৳${estimate.total?.toLocaleString()}` : 'Select dates'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                        {canBook ? `${selectedDates.start} → ${selectedDates.end}` : 'Choose dates to enable booking'}
                    </div>
                </div>
                <button className="btn-book" onClick={handleBookNow} disabled={!canBook}>📋 Book Now</button>
            </div>
        </div>
    );
};

export default VehicleDetail;
