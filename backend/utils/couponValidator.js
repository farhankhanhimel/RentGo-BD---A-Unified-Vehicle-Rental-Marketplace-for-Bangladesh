const Coupon = require('../models/Coupon');

/**
 * Coupon Validator Utility
 * Feature 18 — Tasfy
 */

const validateCoupon = async (code, userId, orderAmount, vehicleType, tripType) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  // Check active
  if (!coupon.isActive) {
    return { valid: false, error: 'This coupon is no longer active' };
  }

  // Check dates
  const now = new Date();
  if (now < new Date(coupon.startDate)) {
    return { valid: false, error: 'This coupon is not yet active' };
  }
  if (now > new Date(coupon.endDate)) {
    return { valid: false, error: 'This coupon has expired' };
  }

  // Check usage limit
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: 'This coupon has reached its usage limit' };
  }

  // Check per-user limit
  if (userId) {
    const userUsageCount = coupon.usedBy.filter(
      (u) => u.user.toString() === userId.toString()
    ).length;
    if (userUsageCount >= coupon.perUserLimit) {
      return { valid: false, error: 'You have already used this coupon' };
    }
  }

  // Check minimum order
  if (orderAmount && orderAmount < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order amount is ৳${coupon.minOrderAmount.toLocaleString()}`,
    };
  }

  // Check vehicle type
  if (
    coupon.applicableVehicleTypes &&
    coupon.applicableVehicleTypes.length > 0 &&
    vehicleType &&
    !coupon.applicableVehicleTypes.includes(vehicleType)
  ) {
    return {
      valid: false,
      error: `This coupon is not applicable for ${vehicleType} vehicles`,
    };
  }

  // Check trip type
  if (
    coupon.applicableTripTypes &&
    coupon.applicableTripTypes.length > 0 &&
    tripType &&
    !coupon.applicableTripTypes.includes(tripType)
  ) {
    return {
      valid: false,
      error: `This coupon is not applicable for ${tripType} trips`,
    };
  }

  // Calculate discount
  let discount;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((orderAmount * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    // Fixed amount
    discount = coupon.discountValue;
    if (discount > orderAmount) {
      discount = orderAmount;
    }
  }

  return {
    valid: true,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
    },
    discount,
    finalAmount: orderAmount - discount,
  };
};

// Mark coupon as used after booking completion
const markCouponUsed = async (code, userId, bookingId) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon) return;

  coupon.usedCount += 1;
  coupon.usedBy.push({
    user: userId,
    usedAt: new Date(),
    bookingId,
  });

  await coupon.save();
};

module.exports = { validateCoupon, markCouponUsed };
