const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendSMS } = require('./twilioService');
const { emitToVendor, emitToCustomer, emitToAdmins } = require('./socketService');

const emergencyTimers = new Map();

const responseWindowMinutes = Number(process.env.EMERGENCY_RESPONSE_WINDOW_MINUTES || 30);
const adminAlertPhoneNumber = process.env.ADMIN_ALERT_PHONE_NUMBER || '';

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const scoreVendorMatch = (bookingLocation, vendorAddress) => {
  const bookingTokens = new Set(normalizeText(bookingLocation));
  const vendorTokens = normalizeText(vendorAddress);

  if (!bookingTokens.size || !vendorTokens.length) {
    return 0;
  }

  return vendorTokens.reduce((score, token) => (bookingTokens.has(token) ? score + 1 : score), 0);
};

const buildEmergencyMessage = (booking) => {
  const pickupLocation = booking.pickupLocation || 'unspecified location';
  const pickupDate = booking.pickupDate ? new Date(booking.pickupDate).toLocaleString() : 'soon';

  return [
    'RentGo Emergency Request',
    `Vehicle: ${booking.vehicleName}`,
    `Pickup: ${pickupLocation}`,
    `Time: ${pickupDate}`,
    `Response needed within ${responseWindowMinutes} minutes`,
  ].join(' | ');
};

const getEmergencyWindowAt = () => new Date(Date.now() + responseWindowMinutes * 60 * 1000);

const findNearbyVendors = async (booking) => {
  const vendors = await User.find({
    role: 'vendor',
    isActive: true,
    'vendorDetails.isVerified': true,
  })
    .select('name phone vendorDetails.businessName vendorDetails.businessAddress')
    .sort({ createdAt: -1 });

  if (!booking.pickupLocation) {
    return vendors;
  }

  const scoredVendors = vendors
    .map((vendor) => ({
      vendor,
      score: scoreVendorMatch(booking.pickupLocation, vendor.vendorDetails?.businessAddress),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (scoredVendors.length > 0) {
    return scoredVendors.map((item) => item.vendor);
  }

  return vendors;
};

const scheduleEmergencyEscalation = (bookingId, dueAt) => {
  const key = String(bookingId);

  if (emergencyTimers.has(key)) {
    clearTimeout(emergencyTimers.get(key));
  }

  const delay = Math.max(new Date(dueAt).getTime() - Date.now(), 0);

  const timer = setTimeout(async () => {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('customer', 'name phone')
        .populate('preferredVendor', 'name phone vendorDetails.businessName')
        .populate('vendor', 'name phone vendorDetails.businessName');

      if (!booking || !booking.isEmergency) {
        return;
      }

      if (booking.vendor || booking.emergencyStatus === 'claimed') {
        return;
      }

      booking.emergencyStatus = 'escalated';
      await booking.save();

      const payload = {
        bookingId: booking._id,
        customerId: booking.customer?._id,
        vehicleName: booking.vehicleName,
        pickupLocation: booking.pickupLocation,
        pickupDate: booking.pickupDate,
        responseDueAt: booking.responseDueAt,
        emergencyStatus: booking.emergencyStatus,
        message: 'Emergency booking has not been claimed within the response window.',
      };

      emitToAdmins('emergency:escalated', payload);

      if (adminAlertPhoneNumber) {
        await sendSMS(
          adminAlertPhoneNumber,
          `RentGo emergency escalation: ${booking.vehicleName} at ${booking.pickupLocation || 'unspecified location'} has not been claimed within ${responseWindowMinutes} minutes.`
        );
      }
    } catch (error) {
      console.error('Emergency escalation failed:', error);
    }
  }, delay);

  emergencyTimers.set(key, timer);
};

const buildEmergencyPayload = (booking, vendors) => ({
  bookingId: booking._id,
  customerId: booking.customer?._id,
  customerName: booking.customer?.name || 'Customer',
  customerPhone: booking.customer?.phone || '',
  preferredVendorId: booking.preferredVendor?._id || null,
  vehicleName: booking.vehicleName,
  pickupLocation: booking.pickupLocation || '',
  pickupDate: booking.pickupDate,
  responseDueAt: booking.responseDueAt,
  emergencyStatus: booking.emergencyStatus,
  vendorCount: vendors.length,
  notificationTargets: vendors.map((vendor) => ({
    vendorId: vendor._id,
    businessName: vendor.vendorDetails?.businessName || vendor.name,
    phone: vendor.phone,
  })),
});

const notifyEmergencyBooking = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate('customer', 'name phone')
    .populate('preferredVendor', 'name phone vendorDetails.businessName')
    .populate('vendor', 'name phone vendorDetails.businessName');

  if (!booking) {
    throw new Error('Emergency booking not found');
  }

  const vendors = await findNearbyVendors(booking);

  booking.emergencyNotifiedVendorIds = vendors.map((vendor) => vendor._id);
  booking.emergencyAlertSentAt = new Date();
  booking.emergencyStatus = 'broadcast';
  if (!booking.responseDueAt) {
    booking.responseDueAt = getEmergencyWindowAt();
  }
  await booking.save();

  const payload = buildEmergencyPayload(booking, vendors);

  await Promise.all(
    vendors.map(async (vendor) => {
      emitToVendor(vendor._id, 'emergency:new', payload);

      if (vendor.phone) {
        await sendSMS(
          vendor.phone,
          `RentGo emergency booking: ${buildEmergencyMessage(booking)}. Reply in the app to claim it.`
        );
      }
    })
  );

  emitToAdmins('emergency:new', payload);

  if (adminAlertPhoneNumber) {
    await sendSMS(
      adminAlertPhoneNumber,
      `RentGo emergency request alert: ${booking.vehicleName} at ${booking.pickupLocation || 'unspecified location'} needs monitoring.`
    );
  }

  emitToCustomer(booking.customer?._id, 'emergency:created', payload);
  scheduleEmergencyEscalation(booking._id, booking.responseDueAt);

  return payload;
};

const bootstrapEmergencyAlerts = async () => {
  try {
    const pendingBookings = await Booking.find({
      isEmergency: true,
      emergencyStatus: { $in: ['queued', 'broadcast', 'escalated'] },
      responseDueAt: { $exists: true, $ne: null },
    });

    pendingBookings.forEach((booking) => {
      scheduleEmergencyEscalation(booking._id, booking.responseDueAt);
    });
  } catch (error) {
    console.error('Emergency bootstrap failed:', error);
  }
};

module.exports = {
  bootstrapEmergencyAlerts,
  notifyEmergencyBooking,
  scheduleEmergencyEscalation,
};