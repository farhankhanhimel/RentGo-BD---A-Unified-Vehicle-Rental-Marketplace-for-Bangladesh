const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// @desc    Get vendor earnings
// @route   GET /api/vendor/earnings
// @access  Vendor
exports.getVendorEarnings = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { period, startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (period === 'monthly') {
            const now = new Date();
            dateFilter['tripDetails.endDate'] = {
                $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
            };
        } else if (period === 'last30') {
            dateFilter['tripDetails.endDate'] = {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            };
        } else if (period === 'custom' && startDate && endDate) {
            dateFilter['tripDetails.endDate'] = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        // 'all' → no date filter

        const query = {
            vendorId,
            status: 'completed',
            ...dateFilter,
        };

        const bookings = await Booking.find(query)
            .populate('vehicleId', 'specs.make specs.model media.photos vehicleType')
            .populate('customerId', 'name')
            .sort({ 'tripDetails.endDate': -1 });

        // Calculate summary
        let totalGross = 0;
        let totalCommission = 0;

        const perBooking = bookings.map((b) => {
            const gross = b.pricing.totalAmount || 0;
            const commission = b.pricing.serviceFee || 0;
            const net = gross - commission;
            totalGross += gross;
            totalCommission += commission;

            return {
                bookingId: b.bookingId,
                vehicleName: b.vehicleId
                    ? `${b.vehicleId.specs.make} ${b.vehicleId.specs.model}`
                    : 'Unknown',
                vehicleId: b.vehicleId?._id,
                startDate: b.tripDetails.startDate,
                endDate: b.tripDetails.endDate,
                customerName: b.customerId?.name || 'Unknown',
                gross,
                commission,
                net,
            };
        });

        // Monthly breakdown
        const monthlyMap = {};
        perBooking.forEach((b) => {
            const date = new Date(b.endDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!monthlyMap[key]) {
                monthlyMap[key] = { month: monthName, gross: 0, net: 0, bookings: 0 };
            }
            monthlyMap[key].gross += b.gross;
            monthlyMap[key].net += b.net;
            monthlyMap[key].bookings += 1;
        });

        const monthlyBreakdown = Object.values(monthlyMap).sort((a, b) =>
            a.month.localeCompare(b.month)
        );

        // Top vehicles by revenue
        const vehicleMap = {};
        perBooking.forEach((b) => {
            const vid = b.vehicleId?.toString() || 'unknown';
            if (!vehicleMap[vid]) {
                vehicleMap[vid] = {
                    vehicleId: vid,
                    name: b.vehicleName,
                    totalRevenue: 0,
                    totalBookings: 0,
                };
            }
            vehicleMap[vid].totalRevenue += b.net;
            vehicleMap[vid].totalBookings += 1;
        });

        const topVehicles = Object.values(vehicleMap)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        // Upcoming bookings
        const upcomingBookings = await Booking.find({
            vendorId,
            status: { $in: ['confirmed', 'payment_awaited', 'vendor_approved'] },
            'tripDetails.startDate': { $gte: new Date() },
        })
            .populate('vehicleId', 'specs.make specs.model')
            .populate('customerId', 'name')
            .sort({ 'tripDetails.startDate': 1 })
            .limit(5);

        res.json({
            summary: {
                totalGross,
                totalCommission,
                totalNet: totalGross - totalCommission,
                totalBookings: bookings.length,
                period: period || 'all',
            },
            monthlyBreakdown,
            perBooking,
            topVehicles,
            upcomingBookings: upcomingBookings.map((b) => ({
                bookingId: b.bookingId,
                vehicleName: b.vehicleId
                    ? `${b.vehicleId.specs.make} ${b.vehicleId.specs.model}`
                    : 'Unknown',
                startDate: b.tripDetails.startDate,
                endDate: b.tripDetails.endDate,
                customerName: b.customerId?.name || 'Unknown',
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export earnings as CSV
// @route   GET /api/vendor/earnings/export/csv
// @access  Vendor
exports.exportEarningsCSV = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { period, startDate, endDate } = req.query;

        const dateFilter = {};
        if (period === 'custom' && startDate && endDate) {
            dateFilter['tripDetails.endDate'] = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const bookings = await Booking.find({
            vendorId,
            status: 'completed',
            ...dateFilter,
        })
            .populate('vehicleId', 'specs.make specs.model')
            .sort({ 'tripDetails.endDate': -1 });

        const data = bookings.map((b) => ({
            'Booking ID': b.bookingId,
            'Vehicle': b.vehicleId ? `${b.vehicleId.specs.make} ${b.vehicleId.specs.model}` : 'Unknown',
            'Start Date': b.tripDetails.startDate?.toISOString().split('T')[0],
            'End Date': b.tripDetails.endDate?.toISOString().split('T')[0],
            'Gross (BDT)': b.pricing.totalAmount || 0,
            'Commission (BDT)': b.pricing.serviceFee || 0,
            'Net (BDT)': (b.pricing.totalAmount || 0) - (b.pricing.serviceFee || 0),
        }));

        const { Parser } = require('json2csv');
        const parser = new Parser();
        const csv = parser.parse(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=earnings.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export earnings as PDF
// @route   GET /api/vendor/earnings/export/pdf
// @access  Vendor
exports.exportEarningsPDF = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { period, startDate, endDate } = req.query;

        const dateFilter = {};
        if (period === 'custom' && startDate && endDate) {
            dateFilter['tripDetails.endDate'] = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const bookings = await Booking.find({
            vendorId,
            status: 'completed',
            ...dateFilter,
        })
            .populate('vehicleId', 'specs.make specs.model')
            .sort({ 'tripDetails.endDate': -1 });

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=earnings.pdf');
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('RentGo BD Earnings Report', { align: 'center' });
        doc.fontSize(12).text(`Vendor: ${req.user.name}`, { align: 'center' });
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();

        // Summary
        let totalGross = 0;
        let totalCommission = 0;
        bookings.forEach((b) => {
            totalGross += b.pricing.totalAmount || 0;
            totalCommission += b.pricing.serviceFee || 0;
        });

        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(11);
        doc.text(`Total Gross: ৳${totalGross.toLocaleString()}`);
        doc.text(`Commission (8%): ৳${totalCommission.toLocaleString()}`);
        doc.text(`Net Earnings: ৳${(totalGross - totalCommission).toLocaleString()}`);
        doc.text(`Total Bookings: ${bookings.length}`);
        doc.moveDown();

        // Per-booking table
        doc.fontSize(14).text('Booking Details', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9);

        bookings.forEach((b, i) => {
            const vehicleName = b.vehicleId
                ? `${b.vehicleId.specs.make} ${b.vehicleId.specs.model}`
                : 'Unknown';
            const gross = b.pricing.totalAmount || 0;
            const commission = b.pricing.serviceFee || 0;
            const net = gross - commission;

            doc.text(
                `${i + 1}. ${b.bookingId} | ${vehicleName} | ` +
                `${b.tripDetails.startDate?.toISOString().split('T')[0]} - ${b.tripDetails.endDate?.toISOString().split('T')[0]} | ` +
                `Gross: ৳${gross} | Comm: ৳${commission} | Net: ৳${net}`
            );
        });

        doc.moveDown(2);
        doc.fontSize(8).text('Powered by RentGo BD', { align: 'center' });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
