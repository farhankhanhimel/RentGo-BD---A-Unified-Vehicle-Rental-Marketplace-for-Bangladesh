require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

const users = [
  {
    role: 'customer',
    name: 'Demo Customer',
    email: 'customer@rentgodemo.com',
    phone: '+8801700000001',
    password: 'Demo123!',
    isActive: true,
    isPhoneVerified: true,
    avatar: 'https://i.pravatar.cc/300?img=12',
    savedAddresses: [
      {
        label: 'Home',
        address: 'House 12, Road 5, Dhanmondi',
        city: 'Dhaka',
        zipCode: '1209',
        isDefault: true,
      },
      {
        label: 'Office',
        address: 'Plot 7, Kemal Ataturk Avenue, Banani',
        city: 'Dhaka',
        zipCode: '1213',
        isDefault: false,
      },
    ],
  },
  {
    role: 'customer',
    name: 'Demo New Customer',
    email: 'newcustomer@rentgodemo.com',
    phone: '+8801700000006',
    password: 'Demo123!',
    isActive: true,
    isPhoneVerified: true,
    avatar: '',
    savedAddresses: [],
  },
  {
    role: 'vendor',
    name: 'Demo Verified Vendor',
    email: 'vendor@rentgodemo.com',
    phone: '+8801700000002',
    password: 'Demo123!',
    isActive: true,
    isPhoneVerified: true,
    avatar: 'https://i.pravatar.cc/300?img=22',
    vendorDetails: {
      businessName: 'Dhaka Drive Rentals',
      businessType: 'rental_agency',
      businessAddress: 'Tejgaon Industrial Area, Dhaka',
      companyRegistration: 'RG-VENDOR-001',
      tradeLicense: 'https://example.com/trade-license.pdf',
      nid: 'https://example.com/nid.pdf',
      bankDetails: {
        accountHolder: 'Dhaka Drive Rentals',
        accountNumber: '1234567890',
        bankName: 'Dutch-Bangla Bank',
        routingNumber: '090261234',
      },
      isVerified: true,
    },
  },
  {
    role: 'vendor',
    name: 'Demo Pending Vendor',
    email: 'pendingvendor@rentgodemo.com',
    phone: '+8801700000003',
    password: 'Demo123!',
    isActive: true,
    isPhoneVerified: true,
    avatar: 'https://i.pravatar.cc/300?img=28',
    vendorDetails: {
      businessName: 'Chattogram Fleet Hub',
      businessType: 'fleet_operator',
      businessAddress: 'Agrabad Commercial Area, Chattogram',
      companyRegistration: 'RG-VENDOR-002',
      isVerified: false,
    },
  },
  {
    role: 'admin',
    name: 'Demo Admin',
    email: 'admin@rentgodemo.com',
    phone: '+8801700000004',
    password: 'Demo123!',
    isActive: true,
    isPhoneVerified: true,
    avatar: 'https://i.pravatar.cc/300?img=5',
    savedAddresses: [
      {
        label: 'HQ',
        address: 'ICT Tower, Agargaon',
        city: 'Dhaka',
        zipCode: '1207',
        isDefault: true,
      },
    ],
  },
  {
    role: 'customer',
    name: 'Demo OTP User',
    email: 'otpuser@rentgodemo.com',
    phone: '+8801700000005',
    password: 'Demo123!',
    isActive: false,
    isPhoneVerified: false,
    avatar: 'https://i.pravatar.cc/300?img=15',
    otp: {
      code: '123456',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    role: 'customer',
    name: 'Demo Expired OTP User',
    email: 'expiredotp@rentgodemo.com',
    phone: '+8801700000007',
    password: 'Demo123!',
    isActive: false,
    isPhoneVerified: false,
    avatar: '',
    otp: {
      code: '654321',
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
    },
  },
];

const connect = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
};

const upsertUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email }).select('+password');

  if (!existingUser) {
    const createdUser = new User(userData);
    await createdUser.save();
    return { email: userData.email, action: 'created' };
  }

  existingUser.name = userData.name;
  existingUser.phone = userData.phone;
  existingUser.role = userData.role;
  existingUser.password = userData.password;
  existingUser.isActive = userData.isActive;
  existingUser.isPhoneVerified = userData.isPhoneVerified;
  existingUser.avatar = userData.avatar || '';
  existingUser.savedAddresses = userData.savedAddresses || [];
  existingUser.vendorDetails = userData.vendorDetails || {};
  existingUser.otp = userData.otp || { code: null, expiresAt: null };
  existingUser.updatedAt = new Date();

  await existingUser.save();
  return { email: userData.email, action: 'updated' };
};

const seed = async () => {
  try {
    await connect();

    const results = [];
    for (const user of users) {
      const result = await upsertUser(user);
      results.push(result);
    }

    console.log('Demo data seeded successfully.');
    results.forEach((result) => {
      console.log(`${result.action.toUpperCase()}: ${result.email}`);
    });
  } catch (error) {
    console.error('Demo seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();