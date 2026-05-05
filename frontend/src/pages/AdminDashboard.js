import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  approveVehicle,
  deleteUser,
  getAnalytics,
  getConfig,
  getDisputes,
  getPendingVendors,
  getPendingVehicles,
  getUsers,
  rejectVehicle,
  setCommission,
  updateDispute,
  updateUser,
  verifyVendor,
} from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [commissionPercent, setCommissionPercent] = useState(10);

  const refreshAll = async () => {
    setLoading(true);
    setError('');

    try {
      const [usersRes, vendorsRes, vehiclesRes, disputesRes, analyticsRes, configRes] = await Promise.all([
        getUsers({ limit: 100 }),
        getPendingVendors(),
        getPendingVehicles(),
        getDisputes(),
        getAnalytics(),
        getConfig(),
      ]);

      setUsers(usersRes.users || []);
      setPendingVendors(vendorsRes.vendors || []);
      setPendingVehicles(vehiclesRes.vehicles || []);
      setDisputes(disputesRes.disputes || []);
      setAnalytics(analyticsRes || null);
      setCommissionPercent(Number(configRes.commission?.percent || 10));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const activeVendors = users.filter((u) => u.role === 'vendor' && u.vendorDetails?.isVerified).length;
    const bookings = analytics?.bookings || 0;
    const revenue = analytics?.totalRevenue || 0;

    return {
      totalUsers,
      activeVendors,
      bookings,
      revenue,
    };
  }, [users, analytics]);

  const updateUserRole = async (userId, role) => {
    setSaving(true);
    try {
      await updateUser(userId, { role });
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (user) => {
    setSaving(true);
    try {
      await updateUser(user._id, { isActive: !user.isActive });
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (userId) => {
    setSaving(true);
    try {
      await deleteUser(userId);
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const handleVendorDecision = async (vendorId, approve) => {
    setSaving(true);
    try {
      await verifyVendor(vendorId, approve);
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const handleVehicleDecision = async (vehicleId, approve) => {
    setSaving(true);
    try {
      if (approve) {
        await approveVehicle(vehicleId);
      } else {
        await rejectVehicle(vehicleId, 'Rejected by admin moderation');
      }
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDisputeStatus = async (id, status) => {
    setSaving(true);
    try {
      await updateDispute(id, { status });
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const handleCommissionSave = async () => {
    setSaving(true);
    try {
      await setCommission(commissionPercent);
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading admin analytics...</p></div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard & Platform Analytics</h1>
          <p>Control users, vendors, vehicles, disputes, and platform-wide health signals.</p>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <section className="admin-kpis">
        <article>
          <h3>Total Users</h3>
          <strong>{summary.totalUsers}</strong>
        </article>
        <article>
          <h3>Verified Vendors</h3>
          <strong>{summary.activeVendors}</strong>
        </article>
        <article>
          <h3>Bookings (30d)</h3>
          <strong>{summary.bookings}</strong>
        </article>
        <article>
          <h3>Revenue (30d)</h3>
          <strong>BDT {Number(summary.revenue).toLocaleString()}</strong>
        </article>
      </section>

      <section className="admin-grid two-col">
        <article className="admin-card">
          <div className="admin-card-title-row">
            <h2>Fraud & Risk Alerts</h2>
          </div>
          {(analytics?.fraudAlerts || []).length === 0 ? (
            <p className="muted">No active anomaly alerts in the recent monitoring window.</p>
          ) : (
            <ul className="alert-list">
              {(analytics?.fraudAlerts || []).map((alert) => (
                <li key={alert.code} className={`severity-${alert.severity}`}>
                  <strong>{alert.code}</strong>
                  <span>{alert.message}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-card">
          <div className="admin-card-title-row">
            <h2>Commission Config</h2>
          </div>
          <div className="commission-row">
            <input
              type="number"
              min="0"
              max="100"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(Number(e.target.value || 0))}
            />
            <button onClick={handleCommissionSave} disabled={saving}>Save</button>
          </div>
          <small>Applies platform-wide vendor commission percentage.</small>
        </article>
      </section>

      <section className="admin-grid two-col">
        <article className="admin-card">
          <h2>Top Routes</h2>
          <div className="simple-list">
            {(analytics?.topRoutes || []).map((item) => (
              <div key={item._id} className="simple-list-item">
                <span>{item._id}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <h2>Top Vehicle Types</h2>
          <div className="simple-list">
            {(analytics?.topVehicleTypes || []).map((item) => (
              <div key={item._id} className="simple-list-item">
                <span>{item._id}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-card">
        <h2>User & Role Management</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 30).map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>
                    <select
                      value={item.role}
                      onChange={(e) => updateUserRole(item._id, e.target.value)}
                      disabled={saving}
                    >
                      <option value="customer">customer</option>
                      <option value="vendor">vendor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{item.isActive ? 'Active' : 'Blocked'}</td>
                  <td className="action-row">
                    <button onClick={() => toggleUserStatus(item)} disabled={saving}>
                      {item.isActive ? 'Ban' : 'Unban'}
                    </button>
                    <button onClick={() => removeUser(item._id)} disabled={saving} className="danger-btn">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-grid two-col">
        <article className="admin-card">
          <h2>Vendor Verification Queue</h2>
          <div className="simple-list">
            {pendingVendors.length === 0 && <p className="muted">No pending vendor requests.</p>}
            {pendingVendors.map((vendor) => (
              <div key={vendor._id} className="simple-list-item stacked">
                <div>
                  <strong>{vendor.vendorDetails?.businessName || vendor.name}</strong>
                  <small>{vendor.email}</small>
                </div>
                <div className="action-row">
                  <button onClick={() => handleVendorDecision(vendor._id, true)} disabled={saving}>Approve</button>
                  <button onClick={() => handleVendorDecision(vendor._id, false)} disabled={saving} className="danger-btn">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <h2>Vehicle Moderation Queue</h2>
          <div className="simple-list">
            {pendingVehicles.length === 0 && <p className="muted">No pending vehicle listings.</p>}
            {pendingVehicles.map((vehicle) => (
              <div key={vehicle._id} className="simple-list-item stacked">
                <div>
                  <strong>{vehicle.make} {vehicle.model} {vehicle.year}</strong>
                  <small>{vehicle.vendor?.vendorDetails?.businessName || vehicle.vendor?.name} | {vehicle.vehicleType}</small>
                </div>
                <div className="action-row">
                  <button onClick={() => handleVehicleDecision(vehicle._id, true)} disabled={saving}>Approve</button>
                  <button onClick={() => handleVehicleDecision(vehicle._id, false)} disabled={saving} className="danger-btn">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-card">
        <h2>Dispute Management</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Raised By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {disputes.slice(0, 20).map((item) => (
                <tr key={item._id}>
                  <td>{item.type || 'General'}</td>
                  <td>{item.status}</td>
                  <td>{item.raisedBy?.name || 'Unknown'}</td>
                  <td>
                    <select
                      value={item.status || 'open'}
                      onChange={(e) => handleDisputeStatus(item._id, e.target.value)}
                      disabled={saving}
                    >
                      <option value="open">open</option>
                      <option value="in_review">in_review</option>
                      <option value="resolved">resolved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
