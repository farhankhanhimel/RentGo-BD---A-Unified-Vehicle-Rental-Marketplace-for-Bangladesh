const Vehicle = require('../models/Vehicle');
const PromoCode = require('../models/PromoCode');

exports.calculateTotalCost = async (req, res) => {
  try {
    const { vehicleId, days, withDriver, couponCode } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const baseRate = vehicle.pricing.dailyRate * days;
    const driverFee = withDriver ? 1000 * days : 0;
    const serviceFee = baseRate * 0.05;
    
    let discount = 0;
    
    // --- UPDATED PROMO CODE LOGIC ---
    if (couponCode) {
      const codeTyped = couponCode.toUpperCase().trim();
      
      // The Presentation Master Key: Automatically gives 20% off
      if (codeTyped === 'RIZBI20') {
        discount = baseRate * 0.20; 
      } else {
        // Fallback: checks the database for any other codes your groupmates might make
        const validCoupon = await PromoCode.findOne({ code: codeTyped, isActive: true });
        if (validCoupon) {
          discount = baseRate * (validCoupon.discountPercentage / 100);
        }
      }
    }

    const total = baseRate + driverFee + serviceFee - discount;
    const advance = total * 0.25;
    const balance = total - advance;

    res.status(200).json({
      success: true,
      breakdown: { baseRate, driverFee, serviceFee, discount, total, advance, balance }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};