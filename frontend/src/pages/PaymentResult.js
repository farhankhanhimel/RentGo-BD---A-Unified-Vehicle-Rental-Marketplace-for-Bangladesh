import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentResult = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const status = params.get('status') || 'failed';
  const transactionId = params.get('transactionId') || '';
  const message = params.get('message') || '';

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
        <Link className="btn btn-primary" to="/dashboard/customer">Back to Customer Dashboard</Link>
      </div>
    </div>
  );
};

export default PaymentResult;
