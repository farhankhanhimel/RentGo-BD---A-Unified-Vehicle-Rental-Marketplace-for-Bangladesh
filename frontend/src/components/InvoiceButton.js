import React, { useState } from 'react';
import invoiceService from '../services/invoiceService';
import './InvoiceButton.css';

const InvoiceButton = ({ bookingId, variant = 'default', size = 'medium' }) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!bookingId) return;
    setDownloading(true);
    setError('');
    try {
      await invoiceService.downloadPDF(bookingId);
    } catch (err) {
      setError('Failed to download invoice');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`invoice-btn-wrapper ${size}`}>
      <button
        className={`invoice-btn ${variant} ${downloading ? 'loading' : ''}`}
        onClick={handleDownload}
        disabled={downloading}
        title={`Download Invoice ${bookingId}`}
      >
        {downloading ? (
          <>
            <span className="invoice-spinner"></span>
            Generating...
          </>
        ) : (
          <>
            <svg
              className="invoice-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {variant === 'icon-only' ? '' : 'Invoice PDF'}
          </>
        )}
      </button>
      {error && <span className="invoice-error">{error}</span>}
    </div>
  );
};

export default InvoiceButton;
