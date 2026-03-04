/**
 * Seed Script — Create comprehensive demo data for testing all features
 * Run: node seed-demo.js
 *
 * Creates: Users, Vehicles, Bookings, Wishlists, Notifications, Coupons, Event Packages
 * Password for all demo accounts: demo1234
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Booking = require('./models/Booking');
const Wishlist = require('./models/Wishlist');
const Notification = require('./models/Notification');
const Coupon = require('./models/Coupon');
const EventPackage = require('./models/EventPackage');

const MONGODB_URI = process.env.MONGODB_URI;

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo1234', salt);
    const now = new Date();

    // ─── 1. USERS ──────────────────────────────────────────────
    console.log('--- Seeding Users ---');

    let customer = await User.findOne({ email: 'demo.customer@rentgo.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Demo Customer',
        email: 'demo.customer@rentgo.com',
        phone: '+8801700000001',
        password: hashedPassword,
        role: 'customer',
        isPhoneVerified: true,
        isActive: true,
        savedAddresses: [
          { label: 'Home', address: 'Dhanmondi 27, Dhaka', city: 'Dhaka', zipCode: '1209', isDefault: true },
          { label: 'Office', address: 'Motijheel, Dhaka', city: 'Dhaka', zipCode: '1000', isDefault: false },
        ],
      });
      console.log('✅ Demo Customer created');
    } else {
      console.log('⏭️  Demo Customer already exists');
    }

    let vendor1 = await User.findOne({ email: 'demo.vendor@rentgo.com' });
    if (!vendor1) {
      vendor1 = await User.create({
        name: 'Demo Vendor',
        email: 'demo.vendor@rentgo.com',
        phone: '+8801700000002',
        password: hashedPassword,
        role: 'vendor',
        isPhoneVerified: true,
        isActive: true,
        vendorDetails: {
          businessName: 'Dhaka Premium Rentals',
          businessType: 'rental_agency',
          tradeLicense: 'https://example.com/trade-license.jpg',
          nid: 'https://example.com/nid.jpg',
          businessAddress: 'Gulshan 2, Dhaka',
          companyRegistration: 'REG-2024-001',
          bankDetails: { accountHolder: 'Demo Vendor', accountNumber: '1234567890', bankName: 'Dutch Bangla Bank', routingNumber: '090261234' },
          isVerified: true,
          verificationStatus: 'approved',
          verificationSubmittedAt: now,
          verificationReviewedAt: now,
        },
      });
      console.log('✅ Demo Vendor created (verified)');
    } else {
      console.log('⏭️  Demo Vendor already exists');
    }

    let vendor2 = await User.findOne({ email: 'demo.vendor2@rentgo.com' });
    if (!vendor2) {
      vendor2 = await User.create({
        name: 'BD Travel Cars',
        email: 'demo.vendor2@rentgo.com',
        phone: '+8801700000004',
        password: hashedPassword,
        role: 'vendor',
        isPhoneVerified: true,
        isActive: true,
        vendorDetails: {
          businessName: 'BD Travel Cars',
          businessType: 'fleet_operator',
          tradeLicense: 'https://example.com/trade-license2.jpg',
          nid: 'https://example.com/nid2.jpg',
          businessAddress: 'Banani, Dhaka',
          companyRegistration: 'REG-2024-002',
          bankDetails: { accountHolder: 'BD Travel', accountNumber: '9876543210', bankName: 'BRAC Bank', routingNumber: '060261234' },
          isVerified: true,
          verificationStatus: 'approved',
          verificationSubmittedAt: now,
          verificationReviewedAt: now,
        },
      });
      console.log('✅ Demo Vendor 2 created (BD Travel Cars)');
    } else {
      console.log('⏭️  Demo Vendor 2 already exists');
    }

    let vendor3 = await User.findOne({ email: 'demo.vendor3@rentgo.com' });
    if (!vendor3) {
      vendor3 = await User.create({
        name: 'Chittagong Wheels',
        email: 'demo.vendor3@rentgo.com',
        phone: '+8801700000005',
        password: hashedPassword,
        role: 'vendor',
        isPhoneVerified: true,
        isActive: true,
        vendorDetails: {
          businessName: 'Chittagong Wheels',
          businessType: 'individual',
          tradeLicense: 'https://example.com/trade-license3.jpg',
          nid: 'https://example.com/nid3.jpg',
          businessAddress: 'Agrabad, Chittagong',
          isVerified: false,
          verificationStatus: 'pending',
          verificationSubmittedAt: now,
        },
      });
      console.log('✅ Demo Vendor 3 created (unverified, Chittagong)');
    } else {
      console.log('⏭️  Demo Vendor 3 already exists');
    }

    let admin = await User.findOne({ email: 'demo.admin@rentgo.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Demo Admin',
        email: 'demo.admin@rentgo.com',
        phone: '+8801700000003',
        password: hashedPassword,
        role: 'admin',
        isPhoneVerified: true,
        isActive: true,
      });
      console.log('✅ Demo Admin created');
    } else {
      console.log('⏭️  Demo Admin already exists');
    }

    // ─── 2. VEHICLES ──────────────────────────────────────────
    console.log('\n--- Seeding Vehicles ---');

    // Clear existing demo vehicles
    await Vehicle.deleteMany({ description: /DEMO SEED/i });

    const vehicles = await Vehicle.insertMany([
      // Vendor 1 — Dhaka Premium Rentals
      {
        vendor: vendor1._id,
        make: 'Toyota', model: 'Corolla', year: 2023,
        vehicleType: 'car',
        description: 'DEMO SEED — Comfortable sedan with great fuel economy. Perfect for city and highway travel.',
        photos: [],
        features: { seats: 5, ac: true, fuelType: 'octane', transmission: 'automatic', engineCC: 1800, mileage: '14 km/l' },
        registration: { number: 'DHA-1234' },
        pricing: { dailyRate: 3500, hourlyRate: 500, weeklyRate: 20000, driverSurcharge: 800, fuelPolicy: 'excluded' },
        location: { address: 'Gulshan 2, Dhaka', city: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7925, lng: 90.4078 } },
        rentalMode: 'both',
        isAvailable: true, isApproved: true,
        rating: { average: 4.5, count: 12 },
      },
      {
        vendor: vendor1._id,
        make: 'Toyota', model: 'Noah', year: 2022,
        vehicleType: 'microbus',
        description: 'DEMO SEED — Spacious microbus for family trips and group travel. Very comfortable.',
        photos: [],
        features: { seats: 8, ac: true, fuelType: 'octane', transmission: 'automatic', engineCC: 2000 },
        registration: { number: 'DHA-5678' },
        pricing: { dailyRate: 6000, hourlyRate: 800, weeklyRate: 35000, driverSurcharge: 1000, fuelPolicy: 'excluded' },
        location: { address: 'Gulshan 2, Dhaka', city: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7925, lng: 90.4078 } },
        rentalMode: 'with_driver',
        isAvailable: true, isApproved: true,
        rating: { average: 4.2, count: 8 },
      },
      {
        vendor: vendor1._id,
        make: 'Honda', model: 'CBR 150R', year: 2024,
        vehicleType: 'motorcycle',
        description: 'DEMO SEED — Sporty motorcycle for quick city rides.',
        photos: [],
        features: { seats: 2, ac: false, fuelType: 'octane', transmission: 'manual', engineCC: 150 },
        registration: { number: 'DHA-MC-01' },
        pricing: { dailyRate: 800, hourlyRate: 150, driverSurcharge: 0, fuelPolicy: 'excluded' },
        location: { address: 'Dhanmondi, Dhaka', city: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7461, lng: 90.3742 } },
        rentalMode: 'self_drive',
        isAvailable: true, isApproved: true,
        rating: { average: 4.8, count: 20 },
      },
      // Vendor 2 — BD Travel Cars
      {
        vendor: vendor2._id,
        make: 'Toyota', model: 'Allion', year: 2021,
        vehicleType: 'car',
        description: 'DEMO SEED — Premium sedan with leather interior. Great for business trips.',
        photos: [],
        features: { seats: 5, ac: true, fuelType: 'octane', transmission: 'automatic', engineCC: 1500 },
        registration: { number: 'DHA-9012' },
        pricing: { dailyRate: 3000, hourlyRate: 450, weeklyRate: 18000, driverSurcharge: 700, fuelPolicy: 'excluded' },
        location: { address: 'Banani, Dhaka', city: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7937, lng: 90.4066 } },
        rentalMode: 'both',
        isAvailable: true, isApproved: true,
        rating: { average: 4.3, count: 15 },
      },
      {
        vendor: vendor2._id,
        make: 'Hyundai', model: 'H-1', year: 2023,
        vehicleType: 'van',
        description: 'DEMO SEED — Large van perfect for cargo or group transfers.',
        photos: [],
        features: { seats: 11, ac: true, fuelType: 'diesel', transmission: 'manual', engineCC: 2500 },
        registration: { number: 'DHA-3456' },
        pricing: { dailyRate: 7000, hourlyRate: 1000, driverSurcharge: 1200, fuelPolicy: 'excluded' },
        location: { address: 'Uttara, Dhaka', city: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.8759, lng: 90.3795 } },
        rentalMode: 'with_driver',
        isAvailable: true, isApproved: true,
        rating: { average: 4.0, count: 6 },
      },
      {
        vendor: vendor2._id,
        make: 'Toyota', model: 'Hiace', year: 2022,
        vehicleType: 'bus',
        description: 'DEMO SEED — 30-seater bus for large group travel and events.',
        photos: [],
        features: { seats: 30, ac: true, fuelType: 'diesel', transmission: 'manual', engineCC: 3000 },
        registration: { number: 'DHA-7890' },
        pricing: { dailyRate: 12000, hourlyRate: 1500, driverSurcharge: 1500, fuelPolicy: 'included' },
        location: { address: 'Mirpur, Dhaka', city: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.8223, lng: 90.3654 } },
        rentalMode: 'with_driver',
        isAvailable: true, isApproved: true,
        rating: { average: 3.8, count: 4 },
      },
      // Vendor 3 — Chittagong Wheels (unverified)
      {
        vendor: vendor3._id,
        make: 'Mitsubishi', model: 'Pajero', year: 2020,
        vehicleType: 'car',
        description: 'DEMO SEED — Off-road SUV for hill trips and beach routes in Chittagong.',
        photos: [],
        features: { seats: 7, ac: true, fuelType: 'diesel', transmission: 'automatic', engineCC: 2400 },
        registration: { number: 'CTG-1111' },
        pricing: { dailyRate: 5000, hourlyRate: 700, driverSurcharge: 900, fuelPolicy: 'excluded' },
        location: { address: 'Agrabad, Chittagong', city: 'Chittagong', district: 'Chittagong', coordinates: { lat: 22.3269, lng: 91.8090 } },
        rentalMode: 'both',
        isAvailable: true, isApproved: true,
        rating: { average: 4.6, count: 10 },
      },
      {
        vendor: vendor3._id,
        make: 'Toyota', model: 'Hilux', year: 2022,
        vehicleType: 'pickup',
        description: 'DEMO SEED — Rugged pickup truck for Cox\'s Bazar and hill tracts.',
        photos: [],
        features: { seats: 5, ac: true, fuelType: 'diesel', transmission: 'manual', engineCC: 2800 },
        registration: { number: 'CTG-2222' },
        pricing: { dailyRate: 4500, hourlyRate: 600, driverSurcharge: 800, fuelPolicy: 'excluded' },
        location: { address: 'Nasirabad, Chittagong', city: 'Chittagong', district: 'Chittagong', coordinates: { lat: 22.3600, lng: 91.8200 } },
        rentalMode: 'with_driver',
        isAvailable: false, isApproved: true,
        rating: { average: 4.1, count: 7 },
      },
      // Dhaka — one more car available
      {
        vendor: vendor1._id,
        make: 'Honda', model: 'Civic', year: 2024,
        vehicleType: 'car',
        description: 'DEMO SEED — Brand new Honda Civic with all modern features.',
        photos: [],
        features: { seats: 5, ac: true, fuelType: 'octane', transmission: 'automatic', engineCC: 1500 },
        registration: { number: 'DHA-0001' },
        pricing: { dailyRate: 4000, hourlyRate: 600, weeklyRate: 24000, driverSurcharge: 900, fuelPolicy: 'excluded' },
        location: { address: 'Mohammadpur, Dhaka', city: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7662, lng: 90.3587 } },
        rentalMode: 'both',
        isAvailable: true, isApproved: true,
        rating: { average: 4.9, count: 3 },
      },
    ]);
    console.log(`✅ ${vehicles.length} vehicles created`);

    // ─── 3. BOOKINGS ──────────────────────────────────────────
    console.log('\n--- Seeding Bookings ---');

    await Booking.deleteMany({ bookingId: /DEMO-/ });

    const bookings = await Booking.insertMany([
      {
        bookingId: 'DEMO-BK-001',
        customer: customer._id,
        vendor: vendor1._id,
        vehicle: vehicles[0]._id, // Toyota Corolla
        bookingMode: 'instant',
        tripDetails: {
          pickupLocation: 'Dhanmondi 27, Dhaka',
          dropoffLocation: 'Cox\'s Bazar Beach',
          pickupDate: new Date('2026-03-10'),
          returnDate: new Date('2026-03-12'),
          tripType: 'tourism',
        },
        pricing: {
          baseRate: 7000,
          driverFee: 1600,
          fuelCharge: 2500,
          serviceFee: 300,
          couponDiscount: 0,
          totalAmount: 11400,
          advancePaid: 3000,
          balanceDue: 8400,
        },
        status: 'confirmed',
        statusHistory: [
          { status: 'pending', timestamp: new Date('2026-03-01'), note: 'Booking placed' },
          { status: 'confirmed', timestamp: new Date('2026-03-01T01:00:00'), note: 'Vendor confirmed' },
        ],
      },
      {
        bookingId: 'DEMO-BK-002',
        customer: customer._id,
        vendor: vendor2._id,
        vehicle: vehicles[3]._id, // Toyota Allion
        bookingMode: 'request',
        tripDetails: {
          pickupLocation: 'Uttara, Dhaka',
          dropoffLocation: 'Sylhet City',
          pickupDate: new Date('2026-03-15'),
          returnDate: new Date('2026-03-16'),
          tripType: 'tourism',
        },
        pricing: {
          baseRate: 3000,
          driverFee: 700,
          fuelCharge: 1800,
          serviceFee: 200,
          couponDiscount: 500,
          couponCode: 'WELCOME500',
          totalAmount: 5200,
          advancePaid: 0,
          balanceDue: 5200,
        },
        status: 'pending',
        statusHistory: [
          { status: 'pending', timestamp: new Date('2026-03-02'), note: 'Booking request submitted' },
        ],
      },
      {
        bookingId: 'DEMO-BK-003',
        customer: customer._id,
        vendor: vendor1._id,
        vehicle: vehicles[1]._id, // Toyota Noah microbus
        bookingMode: 'instant',
        tripDetails: {
          pickupLocation: 'Gulshan, Dhaka',
          dropoffLocation: 'Gazipur',
          pickupDate: new Date('2026-02-20'),
          returnDate: new Date('2026-02-20'),
          tripType: 'office',
        },
        pricing: {
          baseRate: 6000,
          driverFee: 1000,
          fuelCharge: 500,
          serviceFee: 200,
          couponDiscount: 0,
          totalAmount: 7700,
          advancePaid: 7700,
          balanceDue: 0,
        },
        status: 'trip_completed',
        statusHistory: [
          { status: 'pending', timestamp: new Date('2026-02-18') },
          { status: 'confirmed', timestamp: new Date('2026-02-18T02:00:00') },
          { status: 'vehicle_handed_over', timestamp: new Date('2026-02-20T08:00:00') },
          { status: 'trip_started', timestamp: new Date('2026-02-20T08:30:00') },
          { status: 'trip_completed', timestamp: new Date('2026-02-20T18:00:00') },
        ],
      },
    ]);
    console.log(`✅ ${bookings.length} bookings created`);

    // ─── 4. WISHLISTS ─────────────────────────────────────────
    console.log('\n--- Seeding Wishlists ---');

    await Wishlist.deleteMany({ user: customer._id });

    const wishlists = await Wishlist.insertMany([
      {
        user: customer._id,
        vehicle: vehicles[0]._id, // Toyota Corolla — price 3500
        priceAtSave: 4000, // saved at higher price → price dropped!
        notifyOnPriceDrop: true,
        notifyOnAvailability: true,
      },
      {
        user: customer._id,
        vehicle: vehicles[6]._id, // Mitsubishi Pajero — Chittagong
        priceAtSave: 5000,
        notifyOnPriceDrop: true,
        notifyOnAvailability: true,
      },
      {
        user: customer._id,
        vehicle: vehicles[7]._id, // Toyota Hilux — currently unavailable
        priceAtSave: 4500,
        notifyOnPriceDrop: false,
        notifyOnAvailability: true,
      },
      {
        user: customer._id,
        vehicle: vehicles[8]._id, // Honda Civic
        priceAtSave: 4000,
        notifyOnPriceDrop: true,
        notifyOnAvailability: false,
      },
    ]);
    console.log(`✅ ${wishlists.length} wishlist items created`);

    // ─── 5. NOTIFICATIONS ─────────────────────────────────────
    console.log('\n--- Seeding Notifications ---');

    await Notification.deleteMany({ user: customer._id });

    const notifications = await Notification.insertMany([
      {
        user: customer._id,
        type: 'price_drop',
        title: 'Price Drop Alert!',
        message: 'Toyota Corolla 2023 price dropped from ৳4,000 to ৳3,500/day. Save ৳500!',
        relatedVehicle: vehicles[0]._id,
        actionUrl: `/vehicles/${vehicles[0]._id}`,
        isRead: false,
      },
      {
        user: customer._id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        message: 'Your booking DEMO-BK-001 for Toyota Corolla has been confirmed by the vendor.',
        relatedBooking: bookings[0]._id,
        actionUrl: '/customer/bookings',
        isRead: false,
      },
      {
        user: customer._id,
        type: 'coupon_available',
        title: 'New Coupon Available!',
        message: 'Use code WELCOME500 to get ৳500 off your next booking!',
        actionUrl: '/fare-estimator',
        isRead: true,
      },
      {
        user: customer._id,
        type: 'vehicle_available',
        title: 'Vehicle Now Available!',
        message: 'Honda Civic 2024 is now available for booking. Don\'t miss out!',
        relatedVehicle: vehicles[8]._id,
        actionUrl: `/vehicles/${vehicles[8]._id}`,
        isRead: false,
      },
      {
        user: customer._id,
        type: 'general',
        title: 'Welcome to RentGo BD!',
        message: 'Thank you for joining RentGo BD. Explore vehicles and start your journey!',
        isRead: true,
      },
      // Vendor notifications
      {
        user: vendor1._id,
        type: 'verification_approved',
        title: 'Verification Approved!',
        message: 'Your vendor account has been verified. You can now receive bookings.',
        isRead: true,
      },
      {
        user: vendor1._id,
        type: 'booking_confirmed',
        title: 'New Booking!',
        message: 'Demo Customer has booked your Toyota Corolla 2023 for Mar 10-12, 2026.',
        relatedBooking: bookings[0]._id,
        isRead: false,
      },
    ]);
    console.log(`✅ ${notifications.length} notifications created`);

    // ─── 6. COUPONS ───────────────────────────────────────────
    console.log('\n--- Seeding Coupons ---');

    await Coupon.deleteMany({ code: /^DEMO/ });

    const coupons = await Coupon.insertMany([
      {
        code: 'DEMO500',
        description: 'Welcome discount — ৳500 off any booking',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 2000,
        applicableVehicleTypes: ['car', 'microbus', 'van'],
        vendor: null, // platform-wide
        usageLimit: 100,
        usedCount: 3,
        perUserLimit: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
        createdBy: admin._id,
      },
      {
        code: 'DEMO20',
        description: '20% off — max ৳2,000 discount',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: 2000,
        minOrderAmount: 5000,
        applicableVehicleTypes: [],
        vendor: null,
        usageLimit: 50,
        usedCount: 0,
        perUserLimit: 2,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-30'),
        isActive: true,
        createdBy: admin._id,
      },
      {
        code: 'DEMO-VENDOR',
        description: 'Dhaka Premium Rentals — ৳300 off',
        discountType: 'fixed',
        discountValue: 300,
        minOrderAmount: 1500,
        applicableVehicleTypes: ['car'],
        vendor: vendor1._id,
        usageLimit: 20,
        usedCount: 1,
        perUserLimit: 1,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-05-31'),
        isActive: true,
        createdBy: vendor1._id,
      },
      {
        code: 'DEMO-EXPIRED',
        description: 'This coupon has expired',
        discountType: 'percentage',
        discountValue: 10,
        vendor: null,
        usageLimit: 10,
        usedCount: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: false,
        createdBy: admin._id,
      },
    ]);
    console.log(`✅ ${coupons.length} coupons created`);

    // ─── 7. EVENT PACKAGES ────────────────────────────────────
    console.log('\n--- Seeding Event Packages ---');

    await EventPackage.deleteMany({ title: /DEMO/ });

    const eventPackages = await EventPackage.insertMany([
      {
        vendor: vendor1._id,
        title: 'DEMO — Royal Wedding Package',
        description: 'Complete wedding transport solution with decorated cars, microbus for guests, and professional drivers.',
        eventType: 'wedding',
        vehicles: [
          { vehicle: vehicles[0]._id, quantity: 1, role: "Bride & Groom's Car" },
          { vehicle: vehicles[1]._id, quantity: 2, role: 'Guest Shuttle' },
        ],
        includes: ['Decorated vehicles', 'Professional drivers', 'Red carpet setup', 'Flower arrangements', 'AC throughout'],
        pricing: { basePrice: 25000, pricePerAdditionalHour: 2000, pricePerAdditionalVehicle: 5000, deposit: 5000 },
        duration: { hours: 8, maxHours: 14 },
        maxGuests: 50,
        coverageArea: { cities: ['Dhaka', 'Gazipur', 'Narayanganj'], district: 'Dhaka' },
        availability: { daysOfWeek: [0, 4, 5, 6] },
        rating: { average: 4.7, count: 5 },
        bookingsCount: 8,
        isActive: true,
      },
      {
        vendor: vendor2._id,
        title: 'DEMO — Corporate Day Out',
        description: 'Fleet of vehicles for corporate events, conferences, and team outings. Includes coordination.',
        eventType: 'corporate',
        vehicles: [
          { vehicle: vehicles[3]._id, quantity: 3, role: 'Executive Cars' },
          { vehicle: vehicles[4]._id, quantity: 1, role: 'Equipment Van' },
        ],
        includes: ['Professional drivers', 'Fleet coordinator', 'Fuel included', 'Water bottles'],
        pricing: { basePrice: 18000, pricePerAdditionalHour: 1500, deposit: 3000 },
        duration: { hours: 10, maxHours: 16 },
        maxGuests: 30,
        coverageArea: { cities: ['Dhaka', 'Gazipur'], district: 'Dhaka' },
        availability: { daysOfWeek: [0, 1, 2, 3, 4] },
        rating: { average: 4.4, count: 3 },
        bookingsCount: 5,
        isActive: true,
      },
      {
        vendor: vendor1._id,
        title: 'DEMO — Airport Shuttle Package',
        description: 'Reliable airport transfer service. Includes flight tracking and meet & greet.',
        eventType: 'airport_transfer',
        vehicles: [
          { vehicle: vehicles[0]._id, quantity: 1, role: 'Airport Transfer' },
        ],
        includes: ['Flight tracking', 'Meet & greet with name board', 'Free 30-min waiting', 'AC vehicle'],
        pricing: { basePrice: 2500, pricePerAdditionalHour: 500, deposit: 500 },
        duration: { hours: 3, maxHours: 6 },
        maxGuests: 4,
        coverageArea: { cities: ['Dhaka'], district: 'Dhaka' },
        availability: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        rating: { average: 4.9, count: 15 },
        bookingsCount: 22,
        isActive: true,
      },
    ]);
    console.log(`✅ ${eventPackages.length} event packages created`);

    // ─── SUMMARY ──────────────────────────────────────────────
    console.log('\n========================================');
    console.log('  SEED COMPLETE — Demo Data Summary');
    console.log('========================================');
    console.log(`  Users:          5 (1 customer, 3 vendors, 1 admin)`);
    console.log(`  Vehicles:       ${vehicles.length}`);
    console.log(`  Bookings:       ${bookings.length}`);
    console.log(`  Wishlists:      ${wishlists.length}`);
    console.log(`  Notifications:  ${notifications.length}`);
    console.log(`  Coupons:        ${coupons.length}`);
    console.log(`  Event Packages: ${eventPackages.length}`);
    console.log('========================================');
    console.log('');
    console.log('  LOGIN CREDENTIALS (password: demo1234)');
    console.log('  ──────────────────────────────────────');
    console.log('  Customer:  demo.customer@rentgo.com');
    console.log('  Vendor 1:  demo.vendor@rentgo.com    (Dhaka, verified)');
    console.log('  Vendor 2:  demo.vendor2@rentgo.com   (Dhaka, verified)');
    console.log('  Vendor 3:  demo.vendor3@rentgo.com   (Chittagong, unverified)');
    console.log('  Admin:     demo.admin@rentgo.com');
    console.log('========================================\n');
    console.log('  Test Features:');
    console.log('  • Fare Estimator:  Try Dhaka → Chittagong (has vehicles in both cities)');
    console.log('  • Wishlist:        Customer has 4 saved vehicles (1 with price drop)');
    console.log('  • Notifications:   Customer has 3 unread notifications');
    console.log('  • Coupons:         Try DEMO500 or DEMO20 at checkout');
    console.log('  • Event Packages:  3 packages (wedding, corporate, airport)');
    console.log('  • Vendor Bookings: Vendor 1 has 2 bookings to manage');
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Done! Visit http://localhost:3000/login');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
