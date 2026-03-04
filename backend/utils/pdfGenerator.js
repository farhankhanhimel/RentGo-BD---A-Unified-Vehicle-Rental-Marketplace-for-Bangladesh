const PDFDocument = require('pdfkit');

/**
 * Invoice PDF Generator
 * Feature 12 — Tasfy
 * Generates professional PDF invoices for bookings
 */

const generateInvoicePDF = (booking, stream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice - ${booking.bookingId}`,
          Author: 'RentGo BD',
          Subject: 'Booking Invoice',
        },
      });

      doc.pipe(stream);

      // ============ HEADER ============
      // Company branding
      doc
        .fontSize(26)
        .fillColor('#667eea')
        .text('RentGo BD', 50, 50)
        .fontSize(9)
        .fillColor('#666')
        .text('A Unified Vehicle Rental Marketplace for Bangladesh', 50, 80)
        .text('support@rentgo.bd | www.rentgo.bd', 50, 92);

      // Invoice title on right
      doc
        .fontSize(20)
        .fillColor('#333')
        .text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .fillColor('#666')
        .text(`Invoice #: ${booking.bookingId}`, 400, 75, { align: 'right' })
        .text(
          `Date: ${new Date(booking.createdAt).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
          400,
          90,
          { align: 'right' }
        );

      // Divider
      doc
        .moveTo(50, 115)
        .lineTo(545, 115)
        .strokeColor('#667eea')
        .lineWidth(2)
        .stroke();

      // ============ CUSTOMER & VENDOR INFO ============
      let y = 135;

      // Customer (Bill To)
      doc
        .fontSize(10)
        .fillColor('#667eea')
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, y)
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#333')
        .text(booking.customer?.name || 'Customer', 50, y + 15)
        .fontSize(9)
        .fillColor('#666')
        .text(booking.customer?.email || '', 50, y + 28)
        .text(booking.customer?.phone || '', 50, y + 41);

      // Vendor (From)
      doc
        .fontSize(10)
        .fillColor('#667eea')
        .font('Helvetica-Bold')
        .text('FROM:', 350, y, { align: 'right' })
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#333')
        .text(booking.vendorName || 'Vendor', 350, y + 15, { align: 'right' })
        .fontSize(9)
        .fillColor('#666')
        .text(booking.vendorPhone || '', 350, y + 28, { align: 'right' });

      // ============ BOOKING DETAILS SECTION ============
      y = 210;
      doc
        .moveTo(50, y)
        .lineTo(545, y)
        .strokeColor('#e0e0e0')
        .lineWidth(1)
        .stroke();

      y += 15;
      doc
        .fontSize(12)
        .fillColor('#667eea')
        .font('Helvetica-Bold')
        .text('Booking Details', 50, y);

      y += 25;

      // Details table
      const detailsData = [
        ['Booking ID', booking.bookingId],
        ['Booking Mode', booking.bookingMode === 'instant' ? 'Instant Booking' : 'Request Booking'],
        ['Status', booking.status.replace(/_/g, ' ').toUpperCase()],
        [
          'Vehicle',
          booking.vehicle
            ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})`
            : 'N/A',
        ],
        ['Vehicle Type', booking.vehicle?.vehicleType || 'N/A'],
        ['Pickup Location', booking.tripDetails?.pickupLocation || 'N/A'],
        ['Dropoff Location', booking.tripDetails?.dropoffLocation || 'N/A'],
        [
          'Pickup Date',
          booking.tripDetails?.pickupDate
            ? new Date(booking.tripDetails.pickupDate).toLocaleDateString('en-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'N/A',
        ],
        [
          'Return Date',
          booking.tripDetails?.returnDate
            ? new Date(booking.tripDetails.returnDate).toLocaleDateString('en-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'N/A',
        ],
        ['Trip Type', (booking.tripDetails?.tripType || 'other').charAt(0).toUpperCase() + (booking.tripDetails?.tripType || 'other').slice(1)],
      ];

      detailsData.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#555').text(label, 60, y, { width: 150 });
        doc.font('Helvetica').fontSize(9).fillColor('#333').text(String(value), 220, y, { width: 300 });
        y += 18;
      });

      // ============ DRIVER DETAILS ============
      if (booking.driverDetails || booking.vehicle?.driverIncluded) {
        y += 10;
        doc
          .moveTo(50, y)
          .lineTo(545, y)
          .strokeColor('#e0e0e0')
          .lineWidth(1)
          .stroke();

        y += 15;
        doc
          .fontSize(12)
          .fillColor('#667eea')
          .font('Helvetica-Bold')
          .text('Driver Details', 50, y);

        y += 25;

        const driverData = [
          ['Driver Name', booking.driverDetails?.name || 'Assigned by vendor'],
          ['Driver Phone', booking.driverDetails?.phone || 'To be provided'],
          ['License No.', booking.driverDetails?.licenseNumber || 'On file'],
          ['Experience', booking.driverDetails?.experience || 'N/A'],
        ];

        driverData.forEach(([label, value]) => {
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#555').text(label, 60, y, { width: 150 });
          doc.font('Helvetica').fontSize(9).fillColor('#333').text(String(value), 220, y, { width: 300 });
          y += 18;
        });
      }

      // ============ FARE BREAKDOWN ============
      y += 10;
      doc
        .moveTo(50, y)
        .lineTo(545, y)
        .strokeColor('#e0e0e0')
        .lineWidth(1)
        .stroke();

      y += 15;
      doc
        .fontSize(12)
        .fillColor('#667eea')
        .font('Helvetica-Bold')
        .text('Fare Breakdown', 50, y);

      y += 25;

      // Table header
      doc
        .rect(50, y, 495, 25)
        .fillColor('#667eea')
        .fill();

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('white')
        .text('Description', 60, y + 7, { width: 300 })
        .text('Amount (৳)', 400, y + 7, { width: 120, align: 'right' });

      y += 25;

      // Fare rows
      const fareRows = [
        { label: 'Base Rate', amount: booking.pricing?.baseRate || 0 },
      ];

      if (booking.pricing?.driverFee > 0) {
        fareRows.push({ label: 'Driver Fee', amount: booking.pricing.driverFee });
      }
      if (booking.pricing?.fuelCharge > 0) {
        fareRows.push({ label: 'Fuel Charge', amount: booking.pricing.fuelCharge });
      }
      if (booking.pricing?.serviceFee > 0) {
        fareRows.push({ label: 'Service Fee', amount: booking.pricing.serviceFee });
      }

      fareRows.forEach((row, index) => {
        const bg = index % 2 === 0 ? '#f9fbfd' : 'white';
        doc.rect(50, y, 495, 22).fillColor(bg).fill();
        doc.font('Helvetica').fontSize(9).fillColor('#333').text(row.label, 60, y + 6, { width: 300 });
        doc.text(`${row.amount.toLocaleString()}`, 400, y + 6, { width: 120, align: 'right' });
        y += 22;
      });

      // Discount row
      if (booking.pricing?.couponDiscount > 0) {
        doc.rect(50, y, 495, 22).fillColor('#e8f5e9').fill();
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#2e7d32')
          .text(`Coupon Discount (${booking.pricing.couponCode || 'Applied'})`, 60, y + 6, { width: 300 })
          .text(`-${booking.pricing.couponDiscount.toLocaleString()}`, 400, y + 6, {
            width: 120,
            align: 'right',
          });
        y += 22;
      }

      // Total row
      doc.rect(50, y, 495, 30).fillColor('#667eea').fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('white')
        .text('TOTAL', 60, y + 8, { width: 300 })
        .text(`${(booking.pricing?.totalAmount || 0).toLocaleString()}`, 400, y + 8, {
          width: 120,
          align: 'right',
        });

      y += 40;

      // Payment info
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#555')
        .text(`Advance Paid: ৳${(booking.pricing?.advancePaid || 0).toLocaleString()}`, 60, y)
        .text(
          `Balance Due: ৳${(booking.pricing?.balanceDue || 0).toLocaleString()}`,
          300,
          y,
          { align: 'right' }
        );

      y += 15;
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(booking.paymentStatus === 'paid' ? '#4caf50' : '#ff9800')
        .text(`Payment Status: ${(booking.paymentStatus || 'pending').toUpperCase()}`, 60, y);

      if (booking.transactionId) {
        y += 15;
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#666')
          .text(`Transaction ID: ${booking.transactionId}`, 60, y);
      }

      // ============ CANCELLATION POLICY ============
      y += 35;
      if (y < 680) {
        doc
          .fontSize(8)
          .fillColor('#999')
          .font('Helvetica-Bold')
          .text('Cancellation Policy:', 50, y)
          .font('Helvetica')
          .text(
            booking.cancellationPolicy ||
              'Free cancellation up to 24 hours before pickup. 50% refund for cancellation within 24 hours.',
            50,
            y + 12,
            { width: 495, lineGap: 2 }
          );
      }

      // ============ SIGNATURE PLACEHOLDERS ============
      const sigY = 700;
      doc
        .moveTo(50, sigY)
        .lineTo(220, sigY)
        .strokeColor('#ccc')
        .lineWidth(0.5)
        .stroke();

      doc
        .moveTo(370, sigY)
        .lineTo(545, sigY)
        .strokeColor('#ccc')
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(8)
        .fillColor('#999')
        .font('Helvetica')
        .text('Customer Signature', 50, sigY + 5, { width: 170, align: 'center' })
        .text('Vendor / Authorized Signature', 370, sigY + 5, { width: 175, align: 'center' });

      // ============ FOOTER ============
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          'This is a computer-generated invoice. Thank you for choosing RentGo BD!',
          50,
          750,
          { align: 'center', width: 495 }
        )
        .text('© 2024 RentGo BD — All Rights Reserved', 50, 762, {
          align: 'center',
          width: 495,
        });

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
