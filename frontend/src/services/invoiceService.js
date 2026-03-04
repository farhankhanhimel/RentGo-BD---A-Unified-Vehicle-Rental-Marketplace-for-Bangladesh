import api from '../utils/api';

const invoiceService = {
  // Get invoice data (JSON)
  getInvoiceData: async (bookingId) => {
    const response = await api.get(`/invoices/${bookingId}`);
    return response.data;
  },

  // Download invoice as PDF
  downloadPDF: async (bookingId) => {
    const response = await api.get(`/invoices/${bookingId}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${bookingId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // View invoice in new tab
  viewPDF: (bookingId) => {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    // Open in new window with auth
    window.open(
      `${baseURL}/invoices/${bookingId}/view?token=${token}`,
      '_blank'
    );
  },
};

export default invoiceService;
