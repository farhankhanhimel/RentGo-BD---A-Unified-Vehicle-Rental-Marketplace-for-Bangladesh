const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Booking = require('./models/Booking');
const Review = require('./models/Review');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected...');

        // Clear existing
        await User.deleteMany();
        await Vehicle.deleteMany();
        await Booking.deleteMany();
        await Review.deleteMany();

        console.log('Data cleared.');

        // 1. Create Admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@rentgo.com',
            phone: '01700000000',
            password: 'password123',
            role: 'admin',
            isActive: true,
            isPhoneVerified: true
        });

        // 2. Create Vendors
        const vendor1 = await User.create({
            name: 'Avis Car Rental BD',
            email: 'vendor1@rentgo.com',
            phone: '01711111111',
            password: 'password123',
            role: 'vendor',
            isActive: true,
            isPhoneVerified: true,
            vendorDetails: {
                businessName: 'Avis Car Rental BD',
                businessType: 'rental_agency',
                isVerified: true
            }
        });

        const vendor2 = await User.create({
            name: 'Rahim Transport',
            email: 'vendor2@rentgo.com',
            phone: '01722222222',
            password: 'password123',
            role: 'vendor',
            isActive: true,
            isPhoneVerified: true,
            vendorDetails: {
                businessName: 'Rahim Transport',
                businessType: 'individual',
                isVerified: true
            }
        });

        // 3. Create Customers
        const customer1 = await User.create({
            name: 'John Customer',
            email: 'customer1@rentgo.com',
            phone: '01733333333',
            password: 'password123',
            role: 'customer',
            isActive: true,
            isPhoneVerified: true
        });

        const customer2 = await User.create({
            name: 'Jane Customer',
            email: 'customer2@rentgo.com',
            phone: '01744444444',
            password: 'password123',
            role: 'customer',
            isActive: true,
            isPhoneVerified: true
        });

        console.log('Users created.');

        // 4. Create Vehicles
        const v1 = await Vehicle.create({
            vendorId: vendor1._id,
            vehicleType: 'car',
            status: 'approved',
            specs: {
                make: 'Toyota',
                model: 'Corolla',
                year: 2021,
                seats: 4,
                transmission: 'automatic',
                fuelType: 'petrol',
                registrationNo: 'DHA-KHA-1234'
            },
            pricing: {
                dailyRate: 3500,
                hourlyRate: 350,
                driverFeePerDay: 500,
                currency: 'BDT'
            },
            media: {
                photos: [
                    { url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800', publicId: 'dummy1' },
                    { url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800', publicId: 'dummy2' }
                ],
                primaryPhotoIndex: 0
            },
            location: {
                address: 'Gulshan 1',
                city: 'Dhaka',
                coordinates: { lat: 23.7925, lng: 90.4078 }
            },
            rentalModes: { selfDrive: true, withDriver: true }
        });

        const v2 = await Vehicle.create({
            vendorId: vendor1._id,
            vehicleType: 'microbus',
            status: 'approved',
            specs: {
                make: 'Toyota',
                model: 'Hiace',
                year: 2019,
                seats: 12,
                transmission: 'manual',
                fuelType: 'cng',
                registrationNo: 'DHA-CHA-5678'
            },
            pricing: {
                dailyRate: 5000,
                driverFeePerDay: 500,
                currency: 'BDT'
            },
            media: {
                photos: [
                    { url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800', publicId: 'dummy3' }
                ],
                primaryPhotoIndex: 0
            },
            location: {
                address: 'Banani',
                city: 'Dhaka'
            },
            rentalModes: { selfDrive: false, withDriver: true }
        });

        const v3 = await Vehicle.create({
            vendorId: vendor2._id,
            vehicleType: 'motorcycle',
            status: 'approved',
            specs: {
                make: 'Yamaha',
                model: 'R15',
                year: 2022,
                seats: 2,
                transmission: 'manual',
                fuelType: 'petrol',
                registrationNo: 'SYL-HA-9012'
            },
            pricing: {
                dailyRate: 1500,
                currency: 'BDT'
            },
            media: {
                photos: [
                    { url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28c4?auto=format&fit=crop&q=80&w=800', publicId: 'dummy4' }
                ],
                primaryPhotoIndex: 0
            },
            location: {
                address: 'Zindabazar',
                city: 'Sylhet'
            },
            rentalModes: { selfDrive: true, withDriver: false }
        });

        const v4 = await Vehicle.create({
            vendorId: vendor2._id,
            vehicleType: 'pickup',
            status: 'pending_approval',
            specs: {
                make: 'Mahindra',
                model: 'Bolero',
                year: 2020,
                seats: 2,
                transmission: 'manual',
                fuelType: 'diesel',
                registrationNo: 'RAJ-TA-3456'
            },
            pricing: {
                dailyRate: 3000,
                currency: 'BDT'
            },
            media: {
                photos: [
                    { url: 'https://images.unsplash.com/photo-1601002938450-4ff660429788?auto=format&fit=crop&q=80&w=800', publicId: 'dummy5' }
                ],
                primaryPhotoIndex: 0
            },
            location: {
                address: 'Shaheb Bazar',
                city: 'Rajshahi'
            },
            rentalModes: { selfDrive: false, withDriver: true }
        });

        console.log('Vehicles created.');

        // 5. Create Bookings
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const nextWeekEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

        const lastMonth = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        const lastMonthEnd = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000);

        // Booking 1: Completed (so we can review it and see it in earnings)
        const b1 = await Booking.create({
            customerId: customer1._id,
            vendorId: vendor1._id,
            vehicleId: v1._id,
            bookingMode: 'instant',
            status: 'completed',
            tripDetails: {
                startDate: lastMonth,
                endDate: lastMonthEnd,
                pickupLocation: { address: 'Mirpur DOHS', city: 'Dhaka', coordinates: { lat: 1, lng: 1 } },
                dropLocation: { address: 'Gulshan 1', city: 'Dhaka', coordinates: { lat: 1, lng: 1 } },
                tripType: 'tourism',
                withDriver: false
            },
            pricing: {
                baseRate: 10500, // 3500 * 3
                driverFee: 0,
                serviceFee: 840,
                totalAmount: 11340,
                advanceAmount: 3402,
                balanceDue: 7938,
                currency: 'BDT',
                couponDiscount: 0
            },
            payment: {
                advancePaid: true,
                fullPaid: true,
            },
            expiresAt: null
        });

        // Booking 2: Pending Vendor Approval
        const b2 = await Booking.create({
            customerId: customer2._id,
            vendorId: vendor1._id,
            vehicleId: v2._id,
            bookingMode: 'request',
            status: 'pending_vendor_approval',
            tripDetails: {
                startDate: nextWeek,
                endDate: nextWeekEnd,
                pickupLocation: { address: 'Dhanmondi', city: 'Dhaka', coordinates: { lat: 1, lng: 1 } },
                dropLocation: { address: 'Banani', city: 'Dhaka', coordinates: { lat: 1, lng: 1 } },
                tripType: 'office',
                withDriver: true
            },
            pricing: {
                baseRate: 15000,
                driverFee: 1500,
                serviceFee: 1320,
                totalAmount: 17820,
                advanceAmount: 5346,
                balanceDue: 12474,
                currency: 'BDT',
                couponDiscount: 0
            },
            payment: {
                advancePaid: false,
                fullPaid: false,
            },
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        });

        // Booking 3: Confirmed
        const b3 = await Booking.create({
            customerId: customer1._id,
            vendorId: vendor2._id,
            vehicleId: v3._id,
            bookingMode: 'instant',
            status: 'confirmed',
            tripDetails: {
                startDate: nextWeek,
                endDate: nextWeekEnd,
                pickupLocation: { address: 'Sylhet Station', city: 'Sylhet', coordinates: { lat: 1, lng: 1 } },
                dropLocation: { address: 'Jaflong', city: 'Sylhet', coordinates: { lat: 1, lng: 1 } },
                tripType: 'tourism',
                withDriver: false
            },
            pricing: {
                baseRate: 4500,
                driverFee: 0,
                serviceFee: 360,
                totalAmount: 4860,
                advanceAmount: 1458,
                balanceDue: 3402,
                currency: 'BDT',
                couponDiscount: 0
            },
            payment: {
                advancePaid: true,
                fullPaid: false,
            },
            expiresAt: null
        });

        console.log('Bookings created.');

        // 6. Create Reviews (for the completed booking)
        const r1 = await Review.create({
            bookingId: b1._id,
            vehicleId: v1._id,
            customerId: customer1._id,
            vendorId: vendor1._id,
            reviewType: 'customer_reviews_vehicle',
            vehicleRating: {
                condition: 5,
                cleanliness: 4,
                valueMoney: 5
            },
            overallRating: 4.67,
            comment: 'Great car, hybrid engine saved a lot of fuel. Highly recommended!',
            status: 'published'
        });

        // Wait, Review bookingId might need to be ObjectId.
        r1.bookingId = b1._id;
        await r1.save();

        // Update vehicle meta
        v1.meta.averageRating = 4.67;
        v1.meta.totalReviews = 1;
        await v1.save();

        console.log('Reviews created.');

        console.log('');
        console.log('🌱 Seed complete! Demo data loaded.');
        process.exit();

    } catch (error) {
        if (error.name === 'ValidationError') {
            console.error(JSON.stringify(error.errors, null, 2));
        } else {
            console.error(error);
        }
        process.exit(1);
    }
};

seedData();
