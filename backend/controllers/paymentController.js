const axios = require('axios');
const Booking = require('../models/Booking');
const PaymentTransaction = require('../models/PaymentTransaction');

const getEnv = (key, fallback = '') => process.env[key] || fallback;

const isSandbox = getEnv('SSLCOMMERZ_SANDBOX', 'true') === 'true';
const storeId = getEnv('SSLCOMMERZ_STORE_ID');
const storePassword = getEnv('SSLCOMMERZ_STORE_PASSWORD');
const advancePercentConfig = Number(getEnv('ADVANCE_PAYMENT_PERCENT', '30'));
const backendBase = getEnv('BACKEND_BASE_URL', 'http://localhost:5000');
const frontendBase = getEnv('FRONTEND_BASE_URL', 'http://localhost:3000');

const gatewayInitUrl = isSandbox
  ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
  : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

const gatewayValidationUrl = isSandbox
  ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
  : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

const generateTransactionId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `RGO-TXN-${Date.now()}-${random}`;
};

const generateReceiptNo = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RGO-RCPT-${Date.now()}-${random}`;
};

const round2 = (value) => Math.round(Number(value) * 100) / 100;

const getBookingPaymentSummary = (booking) => {
  const totalAmount = Number(booking.totalAmount || 0);
  const paidAmount = Number(booking.paidAmount || 0);
  const dueAmount = Math.max(0, round2(totalAmount - paidAmount));

  return {
    totalAmount,
    paidAmount,
    dueAmount,
  };
};

const prepareAmountByMode = (booking, paymentMode) => {
  const { totalAmount, paidAmount, dueAmount } = getBookingPaymentSummary(booking);
  if (totalAmount <= 0) {
    throw new Error('Booking total amount is missing. Please set an amount before payment.');
  }

  if (dueAmount <= 0) {
    throw new Error('This booking is already fully paid.');
  }

  let amount = dueAmount;
  let mode = paymentMode;

  if (paymentMode === 'advance' && paidAmount === 0) {
    amount = round2((totalAmount * advancePercentConfig) / 100);
    if (amount <= 0) {
      amount = dueAmount;
      mode = 'full';
    }
    if (amount > dueAmount) {
      amount = dueAmount;
    }
  }

  return {
    amount,
    mode,
    dueAfterPayment: round2(Math.max(0, dueAmount - amount)),
  };
};

const callSslCommerzInit = async ({ booking, transaction, customer }) => {
  const payload = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: String(transaction.amount),
    currency: 'BDT',
    tran_id: transaction.transactionId,
    success_url: `${backendBase}/api/payments/success`,
    fail_url: `${backendBase}/api/payments/fail`,
    cancel_url: `${backendBase}/api/payments/cancel`,
    ipn_url: `${backendBase}/api/payments/fail`,
    shipping_method: 'NO',
    product_name: booking.vehicleName,
    product_category: 'Vehicle Rental',
    product_profile: 'general',
    cus_name: customer.name || 'RentGo Customer',
    cus_email: customer.email || 'customer@rentgo.com',
    cus_add1: 'Dhaka',
    cus_city: 'Dhaka',
    cus_postcode: '1207',
    cus_country: 'Bangladesh',
    cus_phone: customer.phone || '01700000000',
    ship_name: customer.name || 'RentGo Customer',
    ship_add1: 'Dhaka',
    ship_city: 'Dhaka',
    ship_postcode: '1207',
    ship_country: 'Bangladesh',
    multi_card_name: 'bkash,nagad,rocket,visa,mastercard,amex',
    value_a: String(booking._id),
    value_b: transaction.paymentMode,
    value_c: String(customer._id),
  });

  const response = await axios.post(gatewayInitUrl, payload.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 20000,
  });

  return response.data;
};

const validateSslCommerzPayment = async (valId) => {
  if (!valId) {
    return null;
  }

  const response = await axios.get(gatewayValidationUrl, {
    params: {
      val_id: valId,
      store_id: storeId,
      store_passwd: storePassword,
      format: 'json',
    },
    timeout: 20000,
  });

  return response.data;
};

const updateBookingAfterPayment = async (booking, amount, isSuccess) => {
  if (!isSuccess) {
    booking.paymentStatus = booking.paidAmount > 0 ? 'partial_paid' : 'failed';
    await booking.save();
    return booking;
  }

  booking.paidAmount = round2(Number(booking.paidAmount || 0) + Number(amount || 0));

  if (booking.paidAmount >= booking.totalAmount) {
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
  } else if (booking.paidAmount > 0) {
    booking.paymentStatus = 'partial_paid';
  } else {
    booking.paymentStatus = 'unpaid';
  }

  await booking.save();
  return booking;
};

exports.getCustomerBookingsForPayment = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('vendor', 'name vendorDetails.businessName')
      .sort({ createdAt: -1 });

    const bookingIds = bookings.map((booking) => booking._id);
    const transactions = await PaymentTransaction.find({ booking: { $in: bookingIds } }).sort({ createdAt: -1 });

    const latestByBooking = new Map();
    transactions.forEach((tx) => {
      const key = String(tx.booking);
      if (!latestByBooking.has(key)) {
        latestByBooking.set(key, tx);
      }
    });

    const payload = bookings.map((booking) => {
      const summary = getBookingPaymentSummary(booking);
      const latestTransaction = latestByBooking.get(String(booking._id));
      return {
        _id: booking._id,
        vehicleName: booking.vehicleName,
        pickupDate: booking.pickupDate,
        status: booking.status,
        totalAmount: summary.totalAmount,
        paidAmount: summary.paidAmount,
        dueAmount: summary.dueAmount,
        paymentStatus: booking.paymentStatus,
        vendor: booking.vendor,
        lastTransactionId: booking.lastTransactionId,
        latestTransaction: latestTransaction
          ? {
              transactionId: latestTransaction.transactionId,
              status: latestTransaction.status,
              amount: latestTransaction.amount,
              paymentMode: latestTransaction.paymentMode,
              errorMessage: latestTransaction.errorMessage,
              createdAt: latestTransaction.createdAt,
            }
          : null,
      };
    });

    return res.json({
      advancePaymentPercent: advancePercentConfig,
      bookings: payload,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.initiatePayment = async (req, res) => {
  try {
    if (!storeId || !storePassword) {
      return res.status(500).json({ message: 'SSLCommerz credentials are not configured' });
    }

    const { bookingId, paymentMode = 'full' } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    if (!['full', 'advance'].includes(paymentMode)) {
      return res.status(400).json({ message: 'paymentMode must be either full or advance' });
    }

    const booking = await Booking.findOne({ _id: bookingId, customer: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const paymentPlan = prepareAmountByMode(booking, paymentMode);

    const transaction = await PaymentTransaction.create({
      booking: booking._id,
      customer: req.user._id,
      transactionId: generateTransactionId(),
      paymentMode: paymentPlan.mode,
      amount: paymentPlan.amount,
      advancePercent: paymentPlan.mode === 'advance' ? advancePercentConfig : 0,
      dueAfterPayment: paymentPlan.dueAfterPayment,
      status: 'pending',
    });

    const gatewayResponse = await callSslCommerzInit({
      booking,
      transaction,
      customer: req.user,
    });

    if (!gatewayResponse || gatewayResponse.status !== 'SUCCESS' || !gatewayResponse.GatewayPageURL) {
      transaction.status = 'failed';
      transaction.errorMessage = 'Could not initialize SSLCommerz payment session';
      await transaction.save();
      return res.status(502).json({
        message: 'Payment initialization failed. Please retry.',
        transactionId: transaction.transactionId,
      });
    }

    transaction.sessionKey = gatewayResponse.sessionkey || '';
    transaction.gatewayUrl = gatewayResponse.GatewayPageURL;
    await transaction.save();

    booking.lastTransactionId = transaction.transactionId;
    await booking.save();

    return res.status(201).json({
      message: 'Payment session created',
      transactionId: transaction.transactionId,
      paymentMode: transaction.paymentMode,
      amount: transaction.amount,
      dueAfterPayment: transaction.dueAfterPayment,
      gatewayUrl: transaction.gatewayUrl,
      supportedMethods: ['bKash', 'Nagad', 'Rocket', 'Cards'],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.retryPayment = async (req, res) => {
  try {
    const existing = await PaymentTransaction.findOne({
      transactionId: req.params.transactionId,
      customer: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (!['failed', 'cancelled'].includes(existing.status)) {
      return res.status(400).json({ message: 'Only failed or cancelled transactions can be retried' });
    }

    const booking = await Booking.findOne({ _id: existing.booking, customer: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found for retry' });
    }

    const paymentPlan = prepareAmountByMode(booking, 'full');

    const transaction = await PaymentTransaction.create({
      booking: booking._id,
      customer: req.user._id,
      transactionId: generateTransactionId(),
      paymentMode: 'full',
      amount: paymentPlan.amount,
      dueAfterPayment: paymentPlan.dueAfterPayment,
      status: 'pending',
      retryOf: existing._id,
    });

    const gatewayResponse = await callSslCommerzInit({
      booking,
      transaction,
      customer: req.user,
    });

    if (!gatewayResponse || gatewayResponse.status !== 'SUCCESS' || !gatewayResponse.GatewayPageURL) {
      transaction.status = 'failed';
      transaction.errorMessage = 'Retry session could not be started';
      await transaction.save();
      return res.status(502).json({
        message: 'Retry failed to start. Please try again.',
        transactionId: transaction.transactionId,
      });
    }

    transaction.sessionKey = gatewayResponse.sessionkey || '';
    transaction.gatewayUrl = gatewayResponse.GatewayPageURL;
    await transaction.save();

    booking.lastTransactionId = transaction.transactionId;
    await booking.save();

    return res.json({
      message: 'Retry payment session created',
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      gatewayUrl: transaction.gatewayUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getTransactionReceipt = async (req, res) => {
  try {
    const transaction = await PaymentTransaction.findOne({
      transactionId: req.params.transactionId,
      customer: req.user._id,
    })
      .populate('booking', 'vehicleName pickupDate totalAmount paidAmount paymentStatus')
      .populate('customer', 'name email phone');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'success' || !transaction.receipt?.receiptNo) {
      return res.status(400).json({ message: 'Receipt is only available for successful payments' });
    }

    return res.json({
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      paymentMode: transaction.paymentMode,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      receipt: transaction.receipt,
      booking: transaction.booking,
      customer: transaction.customer,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const finalizePayment = async ({ transactionId, nextStatus, valId, amount, cardType, bankTxnId, failMessage }) => {
  const transaction = await PaymentTransaction.findOne({ transactionId }).populate('booking');
  if (!transaction) {
    return null;
  }

  if (transaction.status === 'success') {
    return transaction;
  }

  if (nextStatus === 'success') {
    let validation = null;
    try {
      validation = await validateSslCommerzPayment(valId);
    } catch (error) {
      transaction.status = 'failed';
      transaction.errorMessage = 'Payment validation failed at SSLCommerz';
      await transaction.save();
      await updateBookingAfterPayment(transaction.booking, 0, false);
      return transaction;
    }

    if (validation && validation.status && validation.status !== 'VALID') {
      transaction.status = 'failed';
      transaction.errorMessage = 'Payment could not be validated as valid';
      await transaction.save();
      await updateBookingAfterPayment(transaction.booking, 0, false);
      return transaction;
    }

    transaction.status = 'success';
    transaction.valId = valId || '';
    transaction.bankTransactionId = bankTxnId || '';
    transaction.paymentMethod = cardType || 'SSLCommerz';

    const settledAmount = amount ? Number(amount) : Number(transaction.amount || 0);

    transaction.receipt = {
      receiptNo: generateReceiptNo(),
      issuedAt: new Date(),
      details: {
        bookingId: transaction.booking._id,
        vehicleName: transaction.booking.vehicleName,
        amount: settledAmount,
        currency: transaction.currency,
        paidBy: transaction.customer,
        paymentMethod: transaction.paymentMethod,
        gateway: transaction.gateway,
      },
    };

    await transaction.save();

    const booking = await Booking.findById(transaction.booking._id);
    booking.lastTransactionId = transaction.transactionId;
    await updateBookingAfterPayment(booking, settledAmount, true);

    // notify customer and vendor about successful payment
    try {
      const { createNotification } = require('../services/notificationService');
      const { emitToCustomer, emitToVendor } = require('../services/socketService');
      await createNotification(transaction.customer, 'payment_success', 'Payment successful', `Payment of BDT ${settledAmount} received for booking ${booking._id}`, { bookingId: booking._id, customerId: transaction.customer });
      emitToCustomer(transaction.customer, 'payment:success', { bookingId: booking._id, transactionId: transaction.transactionId });
      if (booking.vendor) {
        await createNotification(booking.vendor, 'payment_received', 'Payment received', `Customer paid BDT ${settledAmount} for booking ${booking._id}`, { bookingId: booking._id, vendorId: booking.vendor });
        emitToVendor(booking.vendor, 'payment:received', { bookingId: booking._id, transactionId: transaction.transactionId });
      }
    } catch (e) {
      // ignore notification errors
    }

    return transaction;
  }

  transaction.status = nextStatus;
  transaction.errorMessage = failMessage || (nextStatus === 'cancelled' ? 'Payment cancelled by customer' : 'Payment failed');
  await transaction.save();

  const booking = await Booking.findById(transaction.booking._id);
  booking.lastTransactionId = transaction.transactionId;
  await updateBookingAfterPayment(booking, 0, false);

  // notify customer about failed/cancelled payment
  try {
    const { createNotification } = require('../services/notificationService');
    const { emitToCustomer } = require('../services/socketService');
    await createNotification(transaction.customer, 'payment_failed', 'Payment failed', `Payment for booking ${booking._id} failed or cancelled`, { bookingId: booking._id, customerId: transaction.customer });
    emitToCustomer(transaction.customer, 'payment:failed', { bookingId: booking._id, transactionId: transaction.transactionId });
  } catch (e) {
    // ignore
  }

  return transaction;
};

const redirectToFrontendResult = (res, status, txId, message = '') => {
  const params = new URLSearchParams({
    status,
    transactionId: txId || '',
    message,
  });

  return res.redirect(`${frontendBase}/payment-result?${params.toString()}`);
};

exports.paymentSuccessCallback = async (req, res) => {
  try {
    const payload = { ...req.query, ...req.body };
    const txId = payload.tran_id;

    if (!txId) {
      return redirectToFrontendResult(res, 'failed', '', 'Missing transaction ID in success callback');
    }

    const transaction = await finalizePayment({
      transactionId: txId,
      nextStatus: 'success',
      valId: payload.val_id,
      amount: payload.amount,
      cardType: payload.card_type,
      bankTxnId: payload.bank_tran_id,
    });

    if (!transaction || transaction.status !== 'success') {
      return redirectToFrontendResult(res, 'failed', txId, 'Payment validation failed. Please retry.');
    }

    return redirectToFrontendResult(res, 'success', txId, 'Payment successful and receipt generated');
  } catch (error) {
    return redirectToFrontendResult(res, 'failed', '', error.message);
  }
};

exports.paymentFailCallback = async (req, res) => {
  try {
    const payload = { ...req.query, ...req.body };
    const txId = payload.tran_id;

    if (txId) {
      await finalizePayment({
        transactionId: txId,
        nextStatus: 'failed',
        failMessage: payload.error || 'Payment failed at gateway',
      });
    }

    return redirectToFrontendResult(res, 'failed', txId, 'Payment failed. Please retry.');
  } catch (error) {
    return redirectToFrontendResult(res, 'failed', '', error.message);
  }
};

exports.paymentCancelCallback = async (req, res) => {
  try {
    const payload = { ...req.query, ...req.body };
    const txId = payload.tran_id;

    if (txId) {
      await finalizePayment({
        transactionId: txId,
        nextStatus: 'cancelled',
        failMessage: 'Payment cancelled before completion',
      });
    }

    return redirectToFrontendResult(res, 'cancelled', txId, 'Payment cancelled. You can retry any time.');
  } catch (error) {
    return redirectToFrontendResult(res, 'failed', '', error.message);
  }
};
