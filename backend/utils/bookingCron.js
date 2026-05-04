const cron = require('node-cron');
const Booking = require('../models/Booking');

function startBookingCronJobs() {
    // Run every 15 minutes to expire pending bookings past 24h
    cron.schedule('*/15 * * * *', async () => {
        try {
            const expired = await Booking.updateMany(
                {
                    status: 'pending_vendor_approval',
                    expiresAt: { $lt: new Date() },
                },
                {
                    $set: { status: 'expired' },
                    $push: {
                        statusHistory: {
                            status: 'expired',
                            changedAt: new Date(),
                            note: 'Auto-expired: vendor did not respond within 24 hours',
                        },
                    },
                }
            );
            if (expired.modifiedCount > 0) {
                console.log(`[CRON] Expired ${expired.modifiedCount} pending bookings`);
            }
        } catch (error) {
            console.error('[CRON] Error expiring bookings:', error.message);
        }
    });

    console.log('[CRON] Booking expiry cron job started (runs every 15 min)');
}

module.exports = { startBookingCronJobs };
