const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Verification Controller — Feature 22 (Tasfy)
 * Verified Badge System for vendors
 */

// @desc    Submit verification documents (vendor)
// @route   POST /api/verification/submit
// @access  Private (Vendor)
exports.submitVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can submit verification' });
    }

    if (user.vendorDetails?.verificationStatus === 'pending') {
      return res.status(400).json({ message: 'Verification already pending review' });
    }

    const { businessName, businessType, tradeLicense, nid, businessAddress, companyRegistration, bankDetails } = req.body;

    // Validate required fields
    if (!businessName || !businessType || !tradeLicense || !nid || !businessAddress) {
      return res.status(400).json({
        message: 'Please provide all required documents: businessName, businessType, tradeLicense, nid, businessAddress',
      });
    }

    // Update vendor details
    user.vendorDetails = {
      ...user.vendorDetails,
      businessName,
      businessType,
      tradeLicense,
      nid,
      businessAddress,
      companyRegistration: companyRegistration || user.vendorDetails?.companyRegistration,
      bankDetails: bankDetails || user.vendorDetails?.bankDetails,
      verificationStatus: 'pending',
      verificationSubmittedAt: new Date(),
      rejectionReason: undefined,
    };

    await user.save();

    // Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        type: 'system',
        title: 'New Verification Request',
        message: `${user.name} (${businessName}) has submitted verification documents`,
        actionUrl: '/admin/verifications',
      });
    }

    res.status(200).json({
      message: 'Verification documents submitted successfully. Under review.',
      verificationStatus: 'pending',
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get verification status (vendor)
// @route   GET /api/verification/status
// @access  Private (Vendor)
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      isVerified: user.vendorDetails?.isVerified || false,
      verificationStatus: user.vendorDetails?.verificationStatus || 'not_submitted',
      submittedAt: user.vendorDetails?.verificationSubmittedAt,
      reviewedAt: user.vendorDetails?.verificationReviewedAt,
      rejectionReason: user.vendorDetails?.rejectionReason,
      documents: {
        businessName: user.vendorDetails?.businessName || '',
        businessType: user.vendorDetails?.businessType || '',
        tradeLicense: user.vendorDetails?.tradeLicense || '',
        nid: user.vendorDetails?.nid || '',
        businessAddress: user.vendorDetails?.businessAddress || '',
        companyRegistration: user.vendorDetails?.companyRegistration || '',
        bankDetails: user.vendorDetails?.bankDetails || null,
      },
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all pending verifications (admin)
// @route   GET /api/verification/queue
// @access  Private (Admin)
exports.getVerificationQueue = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const filter = { role: 'vendor' };
    if (status === 'all') {
      filter['vendorDetails.verificationStatus'] = { $ne: 'not_submitted' };
    } else {
      filter['vendorDetails.verificationStatus'] = status;
    }

    const total = await User.countDocuments(filter);
    const vendors = await User.find(filter)
      .select('name email phone avatar vendorDetails createdAt')
      .sort({ 'vendorDetails.verificationSubmittedAt': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      vendors,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get verification queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get verification detail (admin)
// @route   GET /api/verification/:vendorId
// @access  Private (Admin)
exports.getVerificationDetail = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.vendorId)
      .select('-password -otp');

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ vendor });
  } catch (error) {
    console.error('Get verification detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve vendor verification (admin)
// @route   PUT /api/verification/:vendorId/approve
// @access  Private (Admin)
exports.approveVerification = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.vendorId);

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (vendor.vendorDetails?.verificationStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending verification to approve' });
    }

    vendor.vendorDetails.isVerified = true;
    vendor.vendorDetails.verificationStatus = 'approved';
    vendor.vendorDetails.verificationReviewedAt = new Date();
    vendor.vendorDetails.verificationReviewedBy = req.user._id;
    vendor.vendorDetails.rejectionReason = undefined;

    await vendor.save();

    // Notify vendor
    await Notification.create({
      user: vendor._id,
      type: 'system',
      title: 'Verification Approved! ✅',
      message: 'Your business has been verified. You now have the verified badge on your profile and listings.',
      actionUrl: '/profile',
    });

    res.json({
      message: 'Vendor verified successfully',
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        isVerified: true,
        verificationStatus: 'approved',
      },
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject vendor verification (admin)
// @route   PUT /api/verification/:vendorId/reject
// @access  Private (Admin)
exports.rejectVerification = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const vendor = await User.findById(req.params.vendorId);

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (vendor.vendorDetails?.verificationStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending verification to reject' });
    }

    vendor.vendorDetails.isVerified = false;
    vendor.vendorDetails.verificationStatus = 'rejected';
    vendor.vendorDetails.verificationReviewedAt = new Date();
    vendor.vendorDetails.verificationReviewedBy = req.user._id;
    vendor.vendorDetails.rejectionReason = reason;

    await vendor.save();

    // Notify vendor
    await Notification.create({
      user: vendor._id,
      type: 'system',
      title: 'Verification Rejected',
      message: `Your verification was rejected. Reason: ${reason}. Please resubmit with the correct documents.`,
      actionUrl: '/vendor/verification',
    });

    res.json({
      message: 'Verification rejected',
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        isVerified: false,
        verificationStatus: 'rejected',
      },
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Revoke vendor verification (admin)
// @route   PUT /api/verification/:vendorId/revoke
// @access  Private (Admin)
exports.revokeVerification = async (req, res) => {
  try {
    const { reason } = req.body;

    const vendor = await User.findById(req.params.vendorId);

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (!vendor.vendorDetails?.isVerified) {
      return res.status(400).json({ message: 'Vendor is not currently verified' });
    }

    vendor.vendorDetails.isVerified = false;
    vendor.vendorDetails.verificationStatus = 'rejected';
    vendor.vendorDetails.verificationReviewedAt = new Date();
    vendor.vendorDetails.verificationReviewedBy = req.user._id;
    vendor.vendorDetails.rejectionReason = reason || 'Verification revoked by admin';

    await vendor.save();

    await Notification.create({
      user: vendor._id,
      type: 'system',
      title: 'Verification Revoked',
      message: `Your verified badge has been revoked. Reason: ${reason || 'Policy violation'}`,
      actionUrl: '/vendor/verification',
    });

    res.json({ message: 'Verification revoked' });
  } catch (error) {
    console.error('Revoke verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get verification statistics (admin)
// @route   GET /api/verification/stats
// @access  Private (Admin)
exports.getVerificationStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      User.countDocuments({ role: 'vendor', 'vendorDetails.verificationStatus': 'pending' }),
      User.countDocuments({ role: 'vendor', 'vendorDetails.isVerified': true }),
      User.countDocuments({ role: 'vendor', 'vendorDetails.verificationStatus': 'rejected' }),
      User.countDocuments({ role: 'vendor' }),
    ]);

    res.json({
      pending,
      approved,
      rejected,
      total,
      notSubmitted: total - pending - approved - rejected,
    });
  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
