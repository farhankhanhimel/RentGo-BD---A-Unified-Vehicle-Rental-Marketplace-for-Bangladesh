const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

/**
 * Report Generator Utility
 * Generates CSV and summary reports for vendor bookings
 * Feature 13 — Tasfy
 */

// Generate CSV from bookings
const generateBookingCSV = (bookings) => {
  const fields = [
    { label: 'Booking ID', value: 'bookingId' },
    { label: 'Customer Name', value: 'customer.name' },
    { label: 'Customer Phone', value: 'customer.phone' },
    { label: 'Vehicle', value: (row) => `${row.vehicle?.make || ''} ${row.vehicle?.model || ''} (${row.vehicle?.year || ''})` },
    { label: 'Vehicle Type', value: 'vehicle.vehicleType' },
    { label: 'Pickup Location', value: 'tripDetails.pickupLocation' },
    { label: 'Dropoff Location', value: 'tripDetails.dropoffLocation' },
    { label: 'Pickup Date', value: (row) => row.tripDetails?.pickupDate ? new Date(row.tripDetails.pickupDate).toLocaleDateString() : '' },
    { label: 'Return Date', value: (row) => row.tripDetails?.returnDate ? new Date(row.tripDetails.returnDate).toLocaleDateString() : '' },
    { label: 'Trip Type', value: 'tripDetails.tripType' },
    { label: 'Base Rate (৳)', value: 'pricing.baseRate' },
    { label: 'Driver Fee (৳)', value: 'pricing.driverFee' },
    { label: 'Fuel Charge (৳)', value: 'pricing.fuelCharge' },
    { label: 'Service Fee (৳)', value: 'pricing.serviceFee' },
    { label: 'Coupon Discount (৳)', value: 'pricing.couponDiscount' },
    { label: 'Total Amount (৳)', value: 'pricing.totalAmount' },
    { label: 'Advance Paid (৳)', value: 'pricing.advancePaid' },
    { label: 'Balance Due (৳)', value: 'pricing.balanceDue' },
    { label: 'Status', value: 'status' },
    { label: 'Payment Status', value: 'paymentStatus' },
    { label: 'Booking Mode', value: 'bookingMode' },
    { label: 'Created At', value: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '' },
  ];

  const parser = new Parser({ fields });
  return parser.parse(bookings);
};

// Generate summary statistics from bookings
const generateBookingSummary = (bookings) => {
  const summary = {
    totalBookings: bookings.length,
    statusBreakdown: {},
    paymentBreakdown: {},
    totalRevenue: 0,
    totalAdvanceReceived: 0,
    totalBalanceDue: 0,
    avgBookingValue: 0,
    vehicleTypeBreakdown: {},
    tripTypeBreakdown: {},
    monthlyRevenue: {},
  };

  bookings.forEach((booking) => {
    // Status breakdown
    const status = booking.status || 'unknown';
    summary.statusBreakdown[status] = (summary.statusBreakdown[status] || 0) + 1;

    // Payment breakdown
    const payStatus = booking.paymentStatus || 'unknown';
    summary.paymentBreakdown[payStatus] = (summary.paymentBreakdown[payStatus] || 0) + 1;

    // Revenue 
    summary.totalRevenue += booking.pricing?.totalAmount || 0;
    summary.totalAdvanceReceived += booking.pricing?.advancePaid || 0;
    summary.totalBalanceDue += booking.pricing?.balanceDue || 0;

    // Vehicle type
    const vType = booking.vehicle?.vehicleType || 'unknown';
    summary.vehicleTypeBreakdown[vType] = (summary.vehicleTypeBreakdown[vType] || 0) + 1;

    // Trip type
    const tType = booking.tripDetails?.tripType || 'other';
    summary.tripTypeBreakdown[tType] = (summary.tripTypeBreakdown[tType] || 0) + 1;

    // Monthly revenue
    if (booking.createdAt) {
      const month = new Date(booking.createdAt).toISOString().substring(0, 7);
      summary.monthlyRevenue[month] = (summary.monthlyRevenue[month] || 0) + (booking.pricing?.totalAmount || 0);
    }
  });

  summary.avgBookingValue = summary.totalBookings > 0
    ? Math.round(summary.totalRevenue / summary.totalBookings)
    : 0;

  return summary;
};

// Generate PDF report from bookings
const generateBookingPDFReport = (bookings, vendorName, dateRange, stream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        layout: 'landscape',
        info: {
          Title: `Booking Report - ${vendorName}`,
          Author: 'RentGo BD',
        },
      });

      doc.pipe(stream);

      const summary = generateBookingSummary(bookings);

      // ============ HEADER ============
      doc
        .fontSize(22)
        .fillColor('#667eea')
        .text('RentGo BD — Booking Report', { align: 'center' })
        .moveDown(0.3);

      doc
        .fontSize(11)
        .fillColor('#555')
        .text(`Vendor: ${vendorName}`, { align: 'center' })
        .text(`Period: ${dateRange.from} — ${dateRange.to}`, { align: 'center' })
        .text(`Generated: ${new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' })
        .moveDown(1);

      // ============ SUMMARY SECTION ============
      doc
        .fontSize(14)
        .fillColor('#667eea')
        .font('Helvetica-Bold')
        .text('Summary')
        .moveDown(0.5);

      const summaryItems = [
        `Total Bookings: ${summary.totalBookings}`,
        `Total Revenue: ৳${summary.totalRevenue.toLocaleString()}`,
        `Average Booking Value: ৳${summary.avgBookingValue.toLocaleString()}`,
        `Advance Received: ৳${summary.totalAdvanceReceived.toLocaleString()}`,
        `Balance Due: ৳${summary.totalBalanceDue.toLocaleString()}`,
      ];

      doc.font('Helvetica').fontSize(10).fillColor('#333');
      summaryItems.forEach((item) => {
        doc.text(`  •  ${item}`);
      });
      doc.moveDown(0.5);

      // Status breakdown inline
      const statusLine = Object.entries(summary.statusBreakdown)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join('  |  ');
      doc.fontSize(9).fillColor('#666').text(`Status Breakdown:  ${statusLine}`).moveDown(1);

      // ============ BOOKINGS TABLE ============
      doc
        .fontSize(14)
        .fillColor('#667eea')
        .font('Helvetica-Bold')
        .text('Booking Details')
        .moveDown(0.5);

      const tableTop = doc.y;
      const colWidths = [85, 90, 100, 85, 70, 75, 70, 75, 65];
      const headers = ['Booking ID', 'Customer', 'Vehicle', 'Pickup Date', 'Trip Type', 'Total (৳)', 'Paid (৳)', 'Status', 'Payment'];

      // Table header
      let x = 50;
      doc.rect(50, tableTop, 715, 20).fillColor('#667eea').fill();

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('white');
      headers.forEach((header, i) => {
        doc.text(header, x + 3, tableTop + 5, { width: colWidths[i] - 6, align: 'left' });
        x += colWidths[i];
      });

      // Table rows
      let rowY = tableTop + 20;
      const maxRows = Math.min(bookings.length, 30); // Limit to 30 rows per page

      doc.font('Helvetica').fontSize(7).fillColor('#333');

      for (let i = 0; i < maxRows; i++) {
        const b = bookings[i];
        const bg = i % 2 === 0 ? '#f9fbfd' : 'white';
        doc.rect(50, rowY, 715, 18).fillColor(bg).fill();

        const rowData = [
          b.bookingId || '',
          b.customer?.name || 'N/A',
          b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : 'N/A',
          b.tripDetails?.pickupDate ? new Date(b.tripDetails.pickupDate).toLocaleDateString() : 'N/A',
          b.tripDetails?.tripType || 'other',
          (b.pricing?.totalAmount || 0).toLocaleString(),
          (b.pricing?.advancePaid || 0).toLocaleString(),
          (b.status || '').replace(/_/g, ' '),
          b.paymentStatus || 'pending',
        ];

        x = 50;
        doc.fillColor('#333');
        rowData.forEach((cell, j) => {
          doc.text(String(cell), x + 3, rowY + 5, { width: colWidths[j] - 6, align: 'left' });
          x += colWidths[j];
        });

        rowY += 18;

        // New page if needed
        if (rowY > 520) {
          doc.addPage();
          rowY = 50;
        }
      }

      if (bookings.length > maxRows) {
        doc.moveDown(1).fontSize(9).fillColor('#999')
          .text(`... and ${bookings.length - maxRows} more bookings (see CSV export for full data)`, 50);
      }

      // ============ FOOTER ============
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          '© 2024 RentGo BD — This report is auto-generated. All amounts in BDT (৳).',
          50,
          550,
          { align: 'center', width: 715 }
        );

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateBookingCSV,
  generateBookingSummary,
  generateBookingPDFReport,
};
