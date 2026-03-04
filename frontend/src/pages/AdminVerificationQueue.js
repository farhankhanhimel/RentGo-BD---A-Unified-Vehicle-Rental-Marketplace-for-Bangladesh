import React, { useState, useEffect, useCallback } from 'react';
import verificationService from '../services/verificationService';
import VerifiedBadge from '../components/VerifiedBadge';
import './AdminVerificationQueue.css';

const AdminVerificationQueue = () => {
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const data = await verificationService.getVerificationStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await verificationService.getVerificationQueue({
        status: filter,
        page: pagination.page,
      });
      setVendors(data.vendors || []);
      setPagination((prev) => ({ ...prev, pages: data.pages, total: data.total }));
    } catch (err) {
      setError('Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page]);

  useEffect(() => {
    fetchStats();
    fetchQueue();
  }, [fetchStats, fetchQueue]);

  const handleApprove = async (vendorId) => {
    if (!window.confirm('Approve this vendor?')) return;
    setError('');
    try {
      await verificationService.approveVerification(vendorId);
      setSuccess('Vendor approved successfully!');
      fetchQueue();
      fetchStats();
      setSelectedVendor(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (vendorId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setError('');
    try {
      await verificationService.rejectVerification(vendorId, rejectReason);
      setSuccess('Vendor rejected');
      setRejectReason('');
      setShowRejectForm(false);
      fetchQueue();
      fetchStats();
      setSelectedVendor(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleRevoke = async (vendorId) => {
    const reason = window.prompt('Enter revocation reason:');
    if (!reason) return;
    setError('');
    try {
      await verificationService.revokeVerification(vendorId, reason);
      setSuccess('Verification revoked');
      fetchQueue();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke');
    }
  };

  return (
    <div className="avq-container">
      <div className="avq-header">
        <h1>Verification Management</h1>
        <p>Review and manage vendor verification requests</p>
      </div>

      {error && <div className="avq-error">{error}</div>}
      {success && <div className="avq-success">{success}</div>}

      {/* Stats */}
      <div className="avq-stats">
        <div className="avq-stat pending">
          <span className="avq-stat-value">{stats.pending || 0}</span>
          <span className="avq-stat-label">Pending</span>
        </div>
        <div className="avq-stat approved">
          <span className="avq-stat-value">{stats.approved || 0}</span>
          <span className="avq-stat-label">Approved</span>
        </div>
        <div className="avq-stat rejected">
          <span className="avq-stat-value">{stats.rejected || 0}</span>
          <span className="avq-stat-label">Rejected</span>
        </div>
        <div className="avq-stat total">
          <span className="avq-stat-value">{stats.total || 0}</span>
          <span className="avq-stat-label">Total Vendors</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="avq-filters">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            className={`avq-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => { setFilter(f); setPagination((p) => ({ ...p, page: 1 })); }}
          >
            {f === 'pending' && '⏳ '}
            {f === 'approved' && '✅ '}
            {f === 'rejected' && '❌ '}
            {f === 'all' && '📋 '}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="avq-loading"><div className="avq-spinner"></div><p>Loading...</p></div>
      ) : vendors.length === 0 ? (
        <div className="avq-empty">
          <span>📭</span>
          <h3>No {filter} verifications</h3>
          <p>No vendors found with {filter} status</p>
        </div>
      ) : (
        <>
          <div className="avq-list">
            {vendors.map((vendor) => {
              const vd = vendor.vendorDetails || {};
              const isSelected = selectedVendor?._id === vendor._id;
              return (
                <div key={vendor._id} className={`avq-card ${isSelected ? 'expanded' : ''}`}>
                  <div className="avq-card-main" onClick={() => setSelectedVendor(isSelected ? null : vendor)}>
                    <div className="avq-card-avatar">
                      {vendor.avatar ? (
                        <img src={vendor.avatar} alt={vendor.name} />
                      ) : (
                        <span>{vendor.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="avq-card-info">
                      <h3>
                        {vendor.name}
                        {vd.isVerified && <VerifiedBadge isVerified={true} size="small" />}
                      </h3>
                      <p className="avq-card-business">{vd.businessName || 'N/A'} • {vd.businessType?.replace('_', ' ') || 'N/A'}</p>
                      <p className="avq-card-contact">{vendor.email} • {vendor.phone}</p>
                    </div>
                    <div className="avq-card-meta">
                      <span className={`avq-status-badge ${vd.verificationStatus}`}>
                        {vd.verificationStatus?.replace('_', ' ') || 'not submitted'}
                      </span>
                      {vd.verificationSubmittedAt && (
                        <span className="avq-card-date">{new Date(vd.verificationSubmittedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="avq-detail">
                      <div className="avq-detail-grid">
                        <div className="avq-detail-item">
                          <label>Business Name</label>
                          <span>{vd.businessName || 'N/A'}</span>
                        </div>
                        <div className="avq-detail-item">
                          <label>Business Type</label>
                          <span>{vd.businessType?.replace('_', ' ') || 'N/A'}</span>
                        </div>
                        <div className="avq-detail-item">
                          <label>Business Address</label>
                          <span>{vd.businessAddress || 'N/A'}</span>
                        </div>
                        <div className="avq-detail-item">
                          <label>Company Registration</label>
                          <span>{vd.companyRegistration || 'N/A'}</span>
                        </div>
                        <div className="avq-detail-item">
                          <label>Trade License</label>
                          {vd.tradeLicense ? (
                            <a href={vd.tradeLicense} target="_blank" rel="noreferrer">View Document ↗</a>
                          ) : <span>Not provided</span>}
                        </div>
                        <div className="avq-detail-item">
                          <label>NID / Passport</label>
                          {vd.nid ? (
                            <a href={vd.nid} target="_blank" rel="noreferrer">View Document ↗</a>
                          ) : <span>Not provided</span>}
                        </div>
                        {vd.bankDetails && (
                          <>
                            <div className="avq-detail-item">
                              <label>Bank</label>
                              <span>{vd.bankDetails.bankName} — {vd.bankDetails.accountHolder}</span>
                            </div>
                            <div className="avq-detail-item">
                              <label>Account #</label>
                              <span>{vd.bankDetails.accountNumber}</span>
                            </div>
                          </>
                        )}
                        {vd.rejectionReason && (
                          <div className="avq-detail-item avq-full-span avq-rejection">
                            <label>Rejection Reason</label>
                            <span>{vd.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="avq-actions">
                        {vd.verificationStatus === 'pending' && (
                          <>
                            <button className="btn btn-primary" onClick={() => handleApprove(vendor._id)}>✓ Approve</button>
                            <button className="btn btn-danger" onClick={() => setShowRejectForm(true)}>✗ Reject</button>
                          </>
                        )}
                        {vd.isVerified && (
                          <button className="btn btn-danger" onClick={() => handleRevoke(vendor._id)}>Revoke Verification</button>
                        )}
                        {vd.verificationStatus === 'rejected' && (
                          <span className="avq-rejected-note">Vendor can resubmit documents</span>
                        )}
                      </div>

                      {/* Reject Form */}
                      {showRejectForm && vd.verificationStatus === 'pending' && (
                        <div className="avq-reject-form">
                          <label>Rejection Reason *</label>
                          <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explain why the verification is being rejected..."
                          />
                          <div className="avq-reject-actions">
                            <button className="btn btn-secondary" onClick={() => { setShowRejectForm(false); setRejectReason(''); }}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleReject(vendor._id)}>Confirm Reject</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="avq-pagination">
              <button disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>← Prev</button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button disabled={pagination.page >= pagination.pages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminVerificationQueue;
