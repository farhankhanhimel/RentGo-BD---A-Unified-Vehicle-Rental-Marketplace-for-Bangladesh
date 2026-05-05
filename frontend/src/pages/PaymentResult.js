import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getReceipt, retryPayment } from '../services/paymentService';

const PaymentResult = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const status = params.get('status') || 'failed';
  const transactionId = params.get('transactionId') || '';
  const message = params.get('message') || '';
  const [receipt, setReceipt] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReceipt = async () => {
      if (status !== 'success' || !transactionId) return;
      setLoadingReceipt(true);
      try {
        const data = await getReceipt(transactionId);
        setReceipt(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Receipt is not available yet');
      } finally {
        setLoadingReceipt(false);
      }
    };

    loadReceipt();
  }, [status, transactionId]);

  const handleRetry = async () => {
    if (!transactionId) return;
    setRetrying(true);
    setError('');
    try {
      const data = await retryPayment(transactionId);
      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
        return;
      }
      setError('Retry session created but no payment URL was returned.');
    } catch (err) {
      setError(err.response?.data?.message || 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  const titleMap = {
    success: 'Payment Successful',
    failed: 'Payment Failed',
    cancelled: 'Payment Cancelled',
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{titleMap[status] || 'Payment Update'}</h1>
        <p className="dashboard-subtitle">SSLCommerz payment status</p>
      </div>

      <div className="account-info-section">
        <h2>Transaction Summary</h2>
        <div className="info-box">
          <div className="info-row">
            <span className="label">Status:</span>
            <span className="value">{status}</span>
          </div>
          <div className="info-row">
            <span className="label">Transaction ID:</span>
            <span className="value">{transactionId || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Message:</span>
            <span className="value">{message || 'No details provided'}</span>
          </div>
        </div>
        {loadingReceipt && <p>Loading receipt...</p>}
        {receipt && (
          <div className="info-box" style={{ marginTop: '1rem' }}>
            <div className="info-row"><span className="label">Receipt No:</span><span className="value">{receipt.receipt?.receiptNo}</span></div>
            <div className="info-row"><span className="label">Paid Amount:</span><span className="value">৳{Number(receipt.amount || 0).toLocaleString()}</span></div>
            <div className="info-row"><span className="label">Method:</span><span className="value">{receipt.paymentMethod || 'SSLCommerz'}</span></div>
          </div>
        )}
        {error && <div className="error" style={{ marginTop: '1rem' }}>{error}</div>}
        {(status === 'failed' || status === 'cancelled') && transactionId && (
          <button className="btn btn-primary" onClick={handleRetry} disabled={retrying} style={{ marginTop: '1rem' }}>
            {retrying ? 'Preparing Retry...' : 'Retry Payment'}
          </button>
        )}
        <Link className="btn btn-primary" to="/dashboard/customer">Back to Customer Dashboard</Link>
      </div>
    </div>
  );
};

export default PaymentResult;
