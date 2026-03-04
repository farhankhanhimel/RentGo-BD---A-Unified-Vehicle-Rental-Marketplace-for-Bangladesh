const Booking = require('../models/Booking');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { PassThrough } = require('stream');

/**
 * Invoice Controller
 * Feature 12 — Tasfy
 * Handles PDF invoice generation and download
 */

// @desc    Generate and download invoice PDF
// @route   GET /api/invoices/:bookingId/download
// @access  Private (customer or vendor of the booking)
exports.downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('customer', 'name email phone')
      .populate('vendor', 'name email phone vendorDetails')
      .populate('vehicle', 'make model year vehicleType');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: only customer or vendor of this booking, or admin
    const userId = req.user._id.toString();
    const isCustomer = booking.customer?._id?.toString() === userId;
    const isVendor = booking.vendor?._id?.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    // Prepare data for PDF
    const invoiceData = {
      ...booking.toObject(),
      vendorName: booking.vendor?.vendorDetails?.businessName || booking.vendor?.name || 'Vendor',
      vendorPhone: booking.vendor?.phone || '',
    };

    // Generate PDF
    const stream = new PassThrough();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Invoice_${booking.bookingId}.pdf`
    );

    stream.pipe(res);

    await generateInvoicePDF(invoiceData, stream);
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ message: 'Server error generating invoice' });
  }
};

// @desc    View invoice in browser (inline)
// @route   GET /api/invoices/:bookingId/view
// @access  Private
exports.viewInvoice = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('customer', 'name email phone')
      .populate('vendor', 'name email phone vendorDetails')
      .populate('vehicle', 'make model year vehicleType');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const userId = req.user._id.toString();
    const isCustomer = booking.customer?._id?.toString() === userId;
    const isVendor = booking.vendor?._id?.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    const invoiceData = {
      ...booking.toObject(),
      vendorName: booking.vendor?.vendorDetails?.businessName || booking.vendor?.name || 'Vendor',
      vendorPhone: booking.vendor?.phone || '',
    };

    const stream = new PassThrough();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=Invoice_${booking.bookingId}.pdf`
    );

    stream.pipe(res);

    await generateInvoicePDF(invoiceData, stream);
  } catch (error) {
    console.error('View invoice error:', error);
    res.status(500).json({ message: 'Server error generating invoice' });
  }
};

// @desc    Get invoice data (JSON) for frontend rendering
// @route   GET /api/invoices/:bookingId
// @access  Private
exports.getInvoiceData = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('customer', 'name email phone')
      .populate('vendor', 'name email phone vendorDetails')
      .populate('vehicle', 'make model year vehicleType photos');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const userId = req.user._id.toString();
    const isCustomer = booking.customer?._id?.toString() === userId;
    const isVendor = booking.vendor?._id?.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      bookingId: booking.bookingId,
      status: booking.status,
      bookingMode: booking.bookingMode,
      customer: booking.customer,
      vendor: {
        name: booking.vendor?.vendorDetails?.businessName || booking.vendor?.name,
        phone: booking.vendor?.phone,
      },
      vehicle: booking.vehicle,
      tripDetails: booking.tripDetails,
      pricing: booking.pricing,
      paymentStatus: booking.paymentStatus,
      transactionId: booking.transactionId,
      cancellationPolicy: booking.cancellationPolicy,
      createdAt: booking.createdAt,
    });
  } catch (error) {
    console.error('Get invoice data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
