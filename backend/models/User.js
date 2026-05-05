const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin'],
    default: 'customer',
  },
  // OTP Verification
  otp: {
    code: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  // Profile
  avatar: {
    type: String,
    default: '',
  },
  savedAddresses: [
    {
      label: String,
      address: String,
      city: String,
      zipCode: String,
      isDefault: Boolean,
    },
  ],
  // Vendor-specific fields
  vendorDetails: {
    businessName: {
      type: String,
    },
    businessType: {
      type: String,
      enum: ['rental_agency', 'individual', 'fleet_operator'],
    },
    tradeLicense: {
      type: String, // Cloudinary URL
    },
    nid: {
      type: String, // Cloudinary URL
    },
    businessAddress: {
      type: String,
    },
    companyRegistration: {
      type: String,
    },
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      bankName: String,
      routingNumber: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    verificationSubmittedAt: {
      type: Date,
    },
    verificationReviewedAt: {
      type: Date,
    },
    verificationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate 6-digit OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  };
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (enteredOTP) {
  if (this.otp.code === enteredOTP && this.otp.expiresAt > new Date()) {
    this.isPhoneVerified = true;
    this.otp = { code: null, expiresAt: null };
    return true;
  }
  return false;
};

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Change password method
userSchema.methods.changePassword = async function (oldPassword, newPassword) {
  const isMatch = await this.matchPassword(oldPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(newPassword, salt);
};

module.exports = mongoose.model('User', userSchema);
