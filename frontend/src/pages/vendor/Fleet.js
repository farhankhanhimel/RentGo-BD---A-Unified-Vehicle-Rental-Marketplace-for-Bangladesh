import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/VehiclePages.css';

const Fleet = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const res = await api.get(`/vehicles/my${params}`);
            setVehicles(res.data.vehicles);
        } catch (err) {
            console.error('Failed to fetch vehicles:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, [filter]);

    const handleDeactivate = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this vehicle?')) return;
        try {
            await api.patch(`/vehicles/${id}/deactivate`);
            setToast({ type: 'success', msg: 'Vehicle deactivated' });
            setTimeout(() => setToast(null), 3000);
            fetchVehicles();
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.message || 'Failed' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const statuses = ['all', 'pending_approval', 'approved', 'rejected', 'deactivated'];

    const getPhotoUrl = (v) => {
        if (v.media?.photos?.length > 0) {
            const idx = v.media.primaryPhotoIndex || 0;
            return v.media.photos[idx]?.url || v.media.photos[0]?.url;
        }
        return null;
    };

    return (
        <div className="fleet-container">
            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

            <div className="fleet-header">
                <h1>My Fleet</h1>
                <Link to="/vendor/add-vehicle" className="btn-add">+ Add Vehicle</Link>
            </div>

            <div className="status-tabs">
                {statuses.map((s) => (
                    <button
                        key={s}
                        className={`status-tab ${filter === s ? 'active' : ''}`}
                        onClick={() => setFilter(s)}
                    >
                        {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="empty-state-card">
                    <div className="emoji">⏳</div>
                    <h3>Loading...</h3>
                </div>
            ) : vehicles.length === 0 ? (
                <div className="empty-state-card">
                    <div className="emoji">🚗</div>
                    <h3>No vehicles found</h3>
                    <p>{filter === 'all' ? 'Start by adding your first vehicle!' : `No ${filter.replace(/_/g, ' ')} vehicles`}</p>
                </div>
            ) : (
                <div className="vehicle-grid">
                    {vehicles.map((v) => (
                        <div key={v._id} className="vehicle-card">
                            <div className="vehicle-card-image">
                                {getPhotoUrl(v) ? (
                                    <img src={getPhotoUrl(v)} alt={`${v.specs.make} ${v.specs.model}`} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a0aec0', fontSize: '3rem' }}>🚗</div>
                                )}
                            </div>
                            <div className="vehicle-card-body">
                                <h3>{v.specs.make} {v.specs.model} ({v.specs.year})</h3>
                                <div className="vehicle-card-meta">
                                    <span className={`status-badge ${v.status}`}>
                                        {v.status.replace(/_/g, ' ')}
                                    </span>
                                    <span className="daily-rate">৳{v.pricing.dailyRate}/day</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.8rem' }}>
                                    {v.vehicleType} • {v.specs.seats} seats • {v.location.city}
                                    {v.meta?.totalBookings > 0 && ` • ${v.meta.totalBookings} bookings`}
                                </p>
                                <div className="vehicle-card-actions">
                                    <Link to={`/vendor/fleet/edit/${v._id}`} className="btn-edit">✏️ Edit</Link>
                                    {v.status !== 'deactivated' && (
                                        <button className="btn-deactivate" onClick={() => handleDeactivate(v._id)}>
                                            🚫 Deactivate
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Fleet;
