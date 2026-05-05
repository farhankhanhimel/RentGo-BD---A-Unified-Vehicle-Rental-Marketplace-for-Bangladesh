const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');

/**
 * Check wishlist for price drops when a vehicle's price changes.
 * Called by the vehicle update controller when pricing is modified.
 * @param {String} vehicleId - The vehicle ObjectId
 * @param {String} vehicleName - Display name of the vehicle (e.g., "Toyota Corolla 2023")
 * @param {Number} oldPrice - Previous daily rate
 * @param {Number} newPrice - New daily rate
 */
async function checkWishlistPriceDrops(vehicleId, vehicleName, oldPrice, newPrice) {
  try {
    if (newPrice >= oldPrice) return; // Only notify on price drops

    const wishlistEntries = await Wishlist.find({
      vehicle: vehicleId,
      notifyOnPriceDrop: true,
    });

    const notifications = wishlistEntries.map((entry) => ({
      user: entry.user,
      type: 'price_drop',
      title: 'Price Drop Alert!',
      message: `${vehicleName} price dropped from ৳${oldPrice.toLocaleString()} to ৳${newPrice.toLocaleString()}/day. Save ৳${(oldPrice - newPrice).toLocaleString()}!`,
      relatedVehicle: vehicleId,
      actionUrl: `/vehicles/${vehicleId}`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications.length;
  } catch (error) {
    console.error('Error checking wishlist price drops:', error);
    return 0;
  }
}

/**
 * Check wishlist for availability changes when a vehicle becomes available.
 * Called by the vehicle update controller when availability changes.
 * @param {String} vehicleId - The vehicle ObjectId
 * @param {String} vehicleName - Display name of the vehicle
 */
async function checkWishlistAvailability(vehicleId, vehicleName) {
  try {
    const wishlistEntries = await Wishlist.find({
      vehicle: vehicleId,
      notifyOnAvailability: true,
    });

    const notifications = wishlistEntries.map((entry) => ({
      user: entry.user,
      type: 'vehicle_available',
      title: 'Vehicle Now Available!',
      message: `${vehicleName} is now available for booking. Don't miss out!`,
      relatedVehicle: vehicleId,
      actionUrl: `/vehicles/${vehicleId}`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications.length;
  } catch (error) {
    console.error('Error checking wishlist availability:', error);
    return 0;
  }
}

module.exports = {
  checkWishlistPriceDrops,
  checkWishlistAvailability,
};
