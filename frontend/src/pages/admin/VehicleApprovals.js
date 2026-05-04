import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import '../../styles/Dashboard.css';

const VehicleApprovals = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [reasonById, setReasonById] = useState({});

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles/admin/pending');
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      setToast({ type: 'error', msg: 'Failed to load pending vehicles' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/vehicles/${id}/approve`);
      setToast({ type: 'success', msg: 'Vehicle approved' });
      setTimeout(() => setToast(null), 3000);
      fetchPending();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.message || 'Approve failed' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleReject = async (id) => {
    try {
      const reason = reasonById[id] || 'No reason provided';
      await api.patch(`/vehicles/${id}/reject`, { reason });
      setToast({ type: 'success', msg: 'Vehicle rejected' });
      setTimeout(() => setToast(null), 3000);
      fetchPending();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.message || 'Reject failed' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getPhotoUrl = (v) => {
    if (v.media?.photos?.length > 0) {
      const idx = v.media.primaryPhotoIndex || 0;
      return v.media.photos[idx]?.url || v.media.photos[0]?.url;
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Vehicle Approvals</h1>
        <p className="dashboard-subtitle">Review and approve vendor listings</p>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="pending-section">
        <h2>Pending Vehicles</h2>

        {loading ? (
          <div className="empty-state">
            <p>Loading pending vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="empty-state">
            <p>No pending vehicles right now.</p>
          </div>
        ) : (
          <div className="approval-list">
            {vehicles.map((v) => (
              <div key={v._id} className="approval-card">
                <div className="approval-photo">
                  {getPhotoUrl(v) ? (
                    <img src={getPhotoUrl(v)} alt={`${v.specs?.make} ${v.specs?.model}`} />
                  ) : (
                    <div className="approval-photo-fallback">🚗</div>
                  )}
                </div>

                <div className="approval-details">
                  <div className="approval-title">
                    {v.specs?.make} {v.specs?.model} ({v.specs?.year})
                  </div>
                  <div className="approval-meta">
                    <span>{v.vehicleType}</span>
                    <span>৳{v.pricing?.dailyRate}/day</span>
                    <span>{v.location?.city}</span>
                    <span>{v.specs?.seats} seats</span>
                  </div>
                  <div className="approval-vendor">
                    <strong>Vendor:</strong> {v.vendorId?.name || 'Unknown'}
                    <span> • {v.vendorId?.phone || 'No phone'}</span>
                    <span> • {v.vendorId?.email || 'No email'}</span>
                  </div>
                </div>

                <div className="approval-actions">
                  <button className="btn-approve" onClick={() => handleApprove(v._id)}>
                    Approve
                  </button>
                  <input
                    className="approval-reason"
                    placeholder="Rejection reason (optional)"
                    value={reasonById[v._id] || ''}
                    onChange={(e) =>
                      setReasonById((prev) => ({ ...prev, [v._id]: e.target.value }))
                    }
                  />
                  <button className="btn-reject" onClick={() => handleReject(v._id)}>
                    Reject
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

export default VehicleApprovals;
