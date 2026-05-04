const Booking = require('../models/Booking');

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

async function checkVehicleAvailability(vehicleId, startDate, endDate, excludeBookingId = null) {
    const requestedStart = startOfDay(startDate);
    const requestedEnd = endOfDay(endDate);

    const query = {
        vehicleId,
        status: {
            $in: [
                'confirmed',
                'ongoing',
                'pending_vendor_approval',
                'vendor_approved',
                'payment_awaited',
            ],
        },
        // Overlap exists when existingStart <= requestedEnd AND existingEnd >= requestedStart.
        'tripDetails.startDate': { $lte: requestedEnd },
        'tripDetails.endDate': { $gte: requestedStart },
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const conflict = await Booking.findOne(query);
    return { available: !conflict, conflictingBooking: conflict };
}

module.exports = { checkVehicleAvailability };
