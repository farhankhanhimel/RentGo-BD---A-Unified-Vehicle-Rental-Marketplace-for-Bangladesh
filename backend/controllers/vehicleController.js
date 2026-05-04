const Vehicle = require('../models/Vehicle');
const { deleteImage } = require('../services/cloudinaryService');

// @desc    Create a vehicle listing
// @route   POST /api/vehicles/
// @access  Vendor
exports.createVehicleListing = async (req, res) => {
    try {
        const vendorId = req.user._id;

        if (!req.user?.vendorDetails?.isVerified) {
            return res.status(403).json({
                message: 'Vendor verification is required before listing vehicles',
            });
        }

        const {
            vehicleType, specs, pricing, location, rentalModes, driverProfile,
        } = req.body;

        // Parse JSON fields if sent as strings (multipart form)
        const parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : specs;
        const parsedPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
        const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
        const parsedRentalModes = typeof rentalModes === 'string' ? JSON.parse(rentalModes) : rentalModes;
        const parsedDriverProfile = typeof driverProfile === 'string'
            ? JSON.parse(driverProfile)
            : driverProfile;

        // Validate required fields
        if (!parsedSpecs?.make || !parsedSpecs?.model || !parsedSpecs?.year) {
            return res.status(400).json({ message: 'Make, model, and year are required' });
        }
        if (!parsedSpecs?.registrationNo) {
            return res.status(400).json({ message: 'Registration number is required' });
        }
        if (!parsedPricing?.dailyRate || parsedPricing.dailyRate <= 0) {
            return res.status(400).json({ message: 'Daily rate is required and must be greater than 0' });
        }
        if (!parsedLocation?.city) {
            return res.status(400).json({ message: 'City is required' });
        }

        // Build photos array from uploaded files
        const photos = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                photos.push({
                    url: file.path,
                    publicId: file.filename,
                });
            });
        }

        const vehicle = await Vehicle.create({
            vendorId,
            vehicleType,
            status: 'pending_approval',
            specs: parsedSpecs,
            pricing: parsedPricing,
            media: {
                photos,
                primaryPhotoIndex: parseInt(req.body.primaryPhotoIndex) || 0,
            },
            location: parsedLocation,
            rentalModes: parsedRentalModes || { selfDrive: true, withDriver: false },
            driverProfile: parsedDriverProfile,
        });

        // Emit Socket.io event if available
        if (req.app.get('io')) {
            req.app.get('io').to('admin_room').emit('new_vehicle_pending', {
                vehicleId: vehicle._id,
                vendorName: req.user.name,
                make: parsedSpecs.make,
                model: parsedSpecs.model,
            });
        }

        res.status(201).json({
            message: 'Vehicle listing created successfully. Pending admin approval.',
            vehicle,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending vehicle listings (admin)
// @route   GET /api/vehicles/admin/pending
// @access  Admin
exports.getPendingVehicles = async (req, res) => {
    try {
        const status = req.query.status || 'pending_approval';
        const query = { status };

        const vehicles = await Vehicle.find(query)
            .populate('vendorId', 'name email phone vendorDetails avatar')
            .sort({ createdAt: -1 });

        res.json({ vehicles, count: vehicles.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vendor's own vehicles
// @route   GET /api/vehicles/my
// @access  Vendor
exports.getVendorVehicles = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { status } = req.query;

        const query = { vendorId };
        if (status) query.status = status;

        const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });

        res.json({ vehicles, count: vehicles.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a vehicle listing
// @route   PUT /api/vehicles/:id
// @access  Vendor (owner only)
exports.updateVehicleListing = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.vendorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this vehicle' });
        }

        const { specs, pricing, location, rentalModes, vehicleType, driverProfile } = req.body;

        const parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : specs;
        const parsedPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
        const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
        const parsedRentalModes = typeof rentalModes === 'string' ? JSON.parse(rentalModes) : rentalModes;
        const parsedDriverProfile = typeof driverProfile === 'string'
            ? JSON.parse(driverProfile)
            : driverProfile;

        if (vehicleType) vehicle.vehicleType = vehicleType;
        if (parsedSpecs) vehicle.specs = { ...vehicle.specs.toObject(), ...parsedSpecs };
        if (parsedPricing) vehicle.pricing = { ...vehicle.pricing.toObject(), ...parsedPricing };
        if (parsedLocation) vehicle.location = { ...vehicle.location.toObject(), ...parsedLocation };
        if (parsedRentalModes) vehicle.rentalModes = parsedRentalModes;
        if (parsedDriverProfile) vehicle.driverProfile = parsedDriverProfile;

        // Add new photos if uploaded
        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                vehicle.media.photos.push({
                    url: file.path,
                    publicId: file.filename,
                });
            });
        }

        if (req.body.primaryPhotoIndex !== undefined) {
            vehicle.media.primaryPhotoIndex = parseInt(req.body.primaryPhotoIndex);
        }

        // If approved vehicle changes key fields, revert to pending
        if (vehicle.status === 'approved' && (parsedSpecs || parsedPricing)) {
            vehicle.status = 'pending_approval';
        }

        await vehicle.save();

        res.json({ message: 'Vehicle updated successfully', vehicle });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a vehicle photo
// @route   DELETE /api/vehicles/:id/photos
// @access  Vendor (owner only)
exports.deleteVehiclePhoto = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.vendorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({ message: 'publicId is required' });
        }

        // Delete from Cloudinary
        try {
            await deleteImage(publicId);
        } catch (err) {
            console.error('Cloudinary delete failed:', err.message);
        }

        // Remove from vehicle photos array
        vehicle.media.photos = vehicle.media.photos.filter(
            (p) => p.publicId !== publicId
        );

        // Adjust primaryPhotoIndex if needed
        if (vehicle.media.primaryPhotoIndex >= vehicle.media.photos.length) {
            vehicle.media.primaryPhotoIndex = 0;
        }

        await vehicle.save();

        res.json({ message: 'Photo deleted', photos: vehicle.media.photos });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Deactivate a vehicle (soft delete)
// @route   PATCH /api/vehicles/:id/deactivate
// @access  Vendor (owner only)
exports.deactivateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.vendorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        vehicle.status = 'deactivated';
        await vehicle.save();

        res.json({ message: 'Vehicle deactivated', vehicle });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin approve vehicle
// @route   PATCH /api/vehicles/:id/approve
// @access  Admin
exports.adminApproveVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        vehicle.status = 'approved';
        vehicle.adminRejectionReason = undefined;
        await vehicle.save();

        // Notify vendor
        if (req.app.get('io')) {
            req.app.get('io').to(`user_${vehicle.vendorId}`).emit('vehicle_approved', {
                vehicleId: vehicle._id,
                make: vehicle.specs.make,
                model: vehicle.specs.model,
            });
        }

        res.json({ message: 'Vehicle approved', vehicle });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin reject vehicle
// @route   PATCH /api/vehicles/:id/reject
// @access  Admin
exports.adminRejectVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const { reason } = req.body;

        vehicle.status = 'rejected';
        vehicle.adminRejectionReason = reason || 'No reason provided';
        await vehicle.save();

        // Notify vendor
        if (req.app.get('io')) {
            req.app.get('io').to(`user_${vehicle.vendorId}`).emit('vehicle_rejected', {
                vehicleId: vehicle._id,
                reason: vehicle.adminRejectionReason,
            });
        }

        res.json({ message: 'Vehicle rejected', vehicle });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all approved vehicles (public listing)
// @route   GET /api/vehicles/
// @access  Public
exports.getApprovedVehicles = async (req, res) => {
    try {
        const { city, vehicleType, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

        const query = { status: 'approved', availability: 'available' };
        if (city) query['location.city'] = { $regex: city, $options: 'i' };
        if (vehicleType) query.vehicleType = vehicleType;
        if (minPrice || maxPrice) {
            query['pricing.dailyRate'] = {};
            if (minPrice) query['pricing.dailyRate'].$gte = Number(minPrice);
            if (maxPrice) query['pricing.dailyRate'].$lte = Number(maxPrice);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const vehicles = await Vehicle.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Vehicle.countDocuments(query);

        res.json({
            vehicles,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalCount: total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vehicle detail (aggregated)
// @route   GET /api/vehicles/:id/detail
// @access  Public
exports.getVehicleDetail = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('vendorId', 'name email phone vendorDetails avatar');

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Get reviews
        let reviews = [];
        let ratingBreakdown = {};
        try {
            const Review = require('../models/Review');
            reviews = await Review.find({
                vehicleId: vehicle._id,
                reviewType: 'customer_reviews_vehicle',
                status: 'published',
            })
                .populate('customerId', 'name avatar')
                .sort({ createdAt: -1 })
                .limit(10);

            // Calculate rating breakdown
            if (reviews.length > 0) {
                const totals = { condition: 0, cleanliness: 0, driverBehaviour: 0, valueMoney: 0 };
                let driverCount = 0;
                reviews.forEach((r) => {
                    totals.condition += r.vehicleRating?.condition || 0;
                    totals.cleanliness += r.vehicleRating?.cleanliness || 0;
                    if (r.vehicleRating?.driverBehaviour) {
                        totals.driverBehaviour += r.vehicleRating.driverBehaviour;
                        driverCount++;
                    }
                    totals.valueMoney += r.vehicleRating?.valueMoney || 0;
                });
                ratingBreakdown = {
                    condition: (totals.condition / reviews.length).toFixed(1),
                    cleanliness: (totals.cleanliness / reviews.length).toFixed(1),
                    driverBehaviour: driverCount > 0 ? (totals.driverBehaviour / driverCount).toFixed(1) : null,
                    valueMoney: (totals.valueMoney / reviews.length).toFixed(1),
                };
            }
        } catch (e) {
            // Review model might not exist yet
        }

        // Get booked date ranges
        let bookedDateRanges = [];
        try {
            const Booking = require('../models/Booking');
            const bookings = await Booking.find({
                vehicleId: vehicle._id,
                status: { $in: ['confirmed', 'ongoing', 'pending_vendor_approval', 'vendor_approved', 'payment_awaited'] },
            }).select('tripDetails.startDate tripDetails.endDate status');

            bookedDateRanges = bookings.map((b) => ({
                startDate: b.tripDetails.startDate,
                endDate: b.tripDetails.endDate,
                status: b.status,
            }));
        } catch (e) {
            // Booking model might not exist yet
        }

        const vendor = vehicle.vendorId;
        const vendorInfo = {
            name: vendor.name,
            contactNumber: vendor.phone,
            isVerified: vendor.vendorDetails?.isVerified || false,
            avatar: vendor.avatar,
        };

        res.json({
            vehicle: vehicle.toObject(),
            vendor: vendorInfo,
            reviews,
            ratingBreakdown,
            bookedDateRanges,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get price estimate
// @route   POST /api/vehicles/:id/estimate
// @access  Public
exports.getVehiclePriceEstimate = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const { startDate, endDate, withDriver } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end - start;
        const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        const baseRate = vehicle.pricing.dailyRate * days;
        const driverFee = withDriver ? (vehicle.pricing.driverSurcharge || 0) * days : 0;
        const serviceFee = Math.round(baseRate * 0.08);

        let multiDayDiscount = 0;
        if (days >= 3 && vehicle.pricing.multiDayDiscount > 0) {
            multiDayDiscount = Math.round(baseRate * (vehicle.pricing.multiDayDiscount / 100));
        }

        const total = baseRate + driverFee + serviceFee - multiDayDiscount;
        const advanceAmount = Math.round(total * 0.30);

        res.json({
            baseRate,
            driverFee,
            serviceFee,
            multiDayDiscount,
            couponDiscount: 0,
            total,
            advanceAmount,
            balanceDue: total - advanceAmount,
            currency: 'BDT',
            days,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vehicle availability for a month
// @route   GET /api/vehicles/:id/availability
// @access  Public
exports.getVehicleAvailability = async (req, res) => {
    try {
        const { month } = req.query; // YYYY-MM

        if (!month) {
            return res.status(400).json({ message: 'month query param is required (YYYY-MM)' });
        }

        const [year, mon] = month.split('-').map(Number);
        const monthStart = new Date(year, mon - 1, 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(year, mon, 0);
        monthEnd.setHours(23, 59, 59, 999);

        let bookings = [];
        try {
            const Booking = require('../models/Booking');
            bookings = await Booking.find({
                vehicleId: req.params.id,
                status: { $in: ['confirmed', 'ongoing', 'pending_vendor_approval', 'vendor_approved', 'payment_awaited'] },
                'tripDetails.startDate': { $lte: monthEnd },
                'tripDetails.endDate': { $gte: monthStart },
            }).select('tripDetails.startDate tripDetails.endDate status');
        } catch (e) { /* Booking model may not exist yet */ }

        const dates = {};
        const daysInMonth = new Date(year, mon, 0).getDate();

        const startOfDay = (value) => {
            const d = new Date(value);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const endOfDay = (value) => {
            const d = new Date(value);
            d.setHours(23, 59, 59, 999);
            return d;
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const currentDateStart = new Date(year, mon - 1, d);
            currentDateStart.setHours(0, 0, 0, 0);
            const currentDateEnd = new Date(year, mon - 1, d);
            currentDateEnd.setHours(23, 59, 59, 999);
            let status = 'available';

            for (const booking of bookings) {
                const bStart = startOfDay(booking.tripDetails.startDate);
                const bEnd = endOfDay(booking.tripDetails.endDate);

                if (bStart <= currentDateEnd && bEnd >= currentDateStart) {
                    if (['confirmed', 'ongoing'].includes(booking.status)) {
                        status = 'booked';
                        break;
                    } else {
                        status = 'pending';
                    }
                }
            }

            dates[dateStr] = status;
        }

        res.json({
            vehicleId: req.params.id,
            month,
            dates,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
