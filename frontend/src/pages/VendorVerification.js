import React, { useState, useEffect } from 'react';
import verificationService from '../services/verificationService';
import VerifiedBadge from '../components/VerifiedBadge';
import './VendorVerification.css';

const businessTypes = [
  { value: 'rental_agency', label: 'Rental Agency' },
  { value: 'individual', label: 'Individual Owner' },
  { value: 'fleet_operator', label: 'Fleet Operator' },
];

const VendorVerification = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    businessType: 'rental_agency',
    tradeLicense: '',
    nid: '',
    businessAddress: '',
    companyRegistration: '',
    accountHolder: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await verificationService.getVerificationStatus();
      setStatus(data);
      if (data.documents) {
        setForm({
          businessName: data.documents.businessName || '',
          businessType: data.documents.businessType || 'rental_agency',
          tradeLicense: data.documents.tradeLicense || '',
          nid: data.documents.nid || '',
          businessAddress: data.documents.businessAddress || '',
          companyRegistration: data.documents.companyRegistration || '',
          accountHolder: data.documents.bankDetails?.accountHolder || '',
          accountNumber: data.documents.bankDetails?.accountNumber || '',
          bankName: data.documents.bankDetails?.bankName || '',
          routingNumber: data.documents.bankDetails?.routingNumber || '',
        });
      }
    } catch (err) {
      setError('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        businessName: form.businessName,
        businessType: form.businessType,
        tradeLicense: form.tradeLicense,
        nid: form.nid,
        businessAddress: form.businessAddress,
        companyRegistration: form.companyRegistration || undefined,
        bankDetails: form.accountNumber ? {
          accountHolder: form.accountHolder,
          accountNumber: form.accountNumber,
          bankName: form.bankName,
          routingNumber: form.routingNumber,
        } : undefined,
      };

      await verificationService.submitVerification(payload);
      setSuccess('Documents submitted successfully! We will review within 24-48 hours.');
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="vv-container">
        <div className="vv-loading"><div className="vv-spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  const isPending = status?.verificationStatus === 'pending';
  const isApproved = status?.verificationStatus === 'approved';
  const isRejected = status?.verificationStatus === 'rejected';

  return (
    <div className="vv-container">
      <div className="vv-header">
        <h1>Business Verification</h1>
        <p>Get verified to build trust with your customers</p>
      </div>

      {error && <div className="vv-error">{error}</div>}
      {success && <div className="vv-success">{success}</div>}

      {/* Status Card */}
      <div className={`vv-status-card ${status?.verificationStatus || 'not_submitted'}`}>
        <div className="vv-status-icon">
          {isApproved && '✅'}
          {isPending && '⏳'}
          {isRejected && '❌'}
          {!isApproved && !isPending && !isRejected && '📋'}
        </div>
        <div className="vv-status-info">
          <h3>
            {isApproved && <>Verified <VerifiedBadge isVerified={true} size="medium" showLabel={false} /></>}
            {isPending && 'Under Review'}
            {isRejected && 'Verification Rejected'}
            {!isApproved && !isPending && !isRejected && 'Not Submitted'}
          </h3>
          <p>
            {isApproved && 'Your business is verified. The badge is displayed on your profile and vehicle listings.'}
            {isPending && `Submitted on ${new Date(status.submittedAt).toLocaleDateString()}. We'll review within 24-48 hours.`}
            {isRejected && `Reason: ${status.rejectionReason || 'Not specified'}. You can resubmit below.`}
            {!isApproved && !isPending && !isRejected && 'Submit your business documents to get the verified badge.'}
          </p>
        </div>
      </div>

      {/* Benefits */}
      {!isApproved && (
        <div className="vv-benefits">
          <h2>Why Get Verified?</h2>
          <div className="vv-benefits-grid">
            <div className="vv-benefit">
              <span className="vv-benefit-icon">🛡️</span>
              <h4>Build Trust</h4>
              <p>Verified badge shows customers your business is legitimate</p>
            </div>
            <div className="vv-benefit">
              <span className="vv-benefit-icon">📈</span>
              <h4>More Bookings</h4>
              <p>Verified vendors get 40% more bookings on average</p>
            </div>
            <div className="vv-benefit">
              <span className="vv-benefit-icon">⭐</span>
              <h4>Priority Listing</h4>
              <p>Your vehicles appear higher in search results</p>
            </div>
            <div className="vv-benefit">
              <span className="vv-benefit-icon">💰</span>
              <h4>Higher Earnings</h4>
              <p>Customers are willing to pay more for verified vendors</p>
            </div>
          </div>
        </div>
      )}

      {/* Document Form */}
      {(!isApproved && !isPending) && (
        <div className="vv-form-card">
          <h2>{isRejected ? 'Resubmit Documents' : 'Submit Documents'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="vv-section">
              <h3 className="vv-section-title">Business Information</h3>
              <div className="vv-form-grid">
                <div className="vv-form-group">
                  <label>Business Name *</label>
                  <input type="text" value={form.businessName} onChange={(e) => handleChange('businessName', e.target.value)} placeholder="e.g., Dhaka Premium Rentals" required />
                </div>
                <div className="vv-form-group">
                  <label>Business Type *</label>
                  <select value={form.businessType} onChange={(e) => handleChange('businessType', e.target.value)}>
                    {businessTypes.map((bt) => (
                      <option key={bt.value} value={bt.value}>{bt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="vv-form-group vv-full">
                  <label>Business Address *</label>
                  <input type="text" value={form.businessAddress} onChange={(e) => handleChange('businessAddress', e.target.value)} placeholder="Full business address" required />
                </div>
                <div className="vv-form-group">
                  <label>Company Registration #</label>
                  <input type="text" value={form.companyRegistration} onChange={(e) => handleChange('companyRegistration', e.target.value)} placeholder="Optional" />
                </div>
              </div>
            </div>

            <div className="vv-section">
              <h3 className="vv-section-title">Documents</h3>
              <p className="vv-section-desc">Provide URLs to your uploaded documents (Cloudinary or other hosting)</p>
              <div className="vv-form-grid">
                <div className="vv-form-group">
                  <label>Trade License URL *</label>
                  <input type="url" value={form.tradeLicense} onChange={(e) => handleChange('tradeLicense', e.target.value)} placeholder="https://..." required />
                </div>
                <div className="vv-form-group">
                  <label>NID / Passport URL *</label>
                  <input type="url" value={form.nid} onChange={(e) => handleChange('nid', e.target.value)} placeholder="https://..." required />
                </div>
              </div>
            </div>

            <div className="vv-section">
              <h3 className="vv-section-title">Bank Details (Optional)</h3>
              <div className="vv-form-grid">
                <div className="vv-form-group">
                  <label>Account Holder Name</label>
                  <input type="text" value={form.accountHolder} onChange={(e) => handleChange('accountHolder', e.target.value)} placeholder="Full name on account" />
                </div>
                <div className="vv-form-group">
                  <label>Account Number</label>
                  <input type="text" value={form.accountNumber} onChange={(e) => handleChange('accountNumber', e.target.value)} placeholder="Account number" />
                </div>
                <div className="vv-form-group">
                  <label>Bank Name</label>
                  <input type="text" value={form.bankName} onChange={(e) => handleChange('bankName', e.target.value)} placeholder="e.g., Dutch Bangla Bank" />
                </div>
                <div className="vv-form-group">
                  <label>Routing Number</label>
                  <input type="text" value={form.routingNumber} onChange={(e) => handleChange('routingNumber', e.target.value)} placeholder="Routing number" />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary vv-submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : isRejected ? 'Resubmit for Review' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      )}

      {/* Approved info */}
      {isApproved && (
        <div className="vv-approved-info">
          <h2>Your Verified Documents</h2>
          <div className="vv-doc-grid">
            <div className="vv-doc-item">
              <span className="vv-doc-label">Business Name</span>
              <span className="vv-doc-value">{status.documents.businessName}</span>
            </div>
            <div className="vv-doc-item">
              <span className="vv-doc-label">Business Type</span>
              <span className="vv-doc-value">{status.documents.businessType?.replace('_', ' ')}</span>
            </div>
            <div className="vv-doc-item">
              <span className="vv-doc-label">Address</span>
              <span className="vv-doc-value">{status.documents.businessAddress}</span>
            </div>
            <div className="vv-doc-item">
              <span className="vv-doc-label">Verified On</span>
              <span className="vv-doc-value">{new Date(status.reviewedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorVerification;
