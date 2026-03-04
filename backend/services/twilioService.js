const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Lazy initialize Twilio client only when valid credentials are provided
let client = null;
const getClient = () => {
  if (!client) {
    if (!accountSid || !accountSid.startsWith('AC')) {
      console.warn('Twilio credentials not configured. OTP sending will be disabled.');
      return null;
    }
    client = twilio(accountSid, authToken);
  }
  return client;
};

const sendOTP = async (phoneNumber, otp) => {
  try {
    const twilioClient = getClient();
    if (!twilioClient) {
      console.warn('Twilio not configured. OTP not sent. Code:', otp);
      return null;
    }
    const message = await twilioClient.messages.create({
      body: `Your RentGo verification code is: ${otp}. This code will expire in 15 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });
    return message.sid;
  } catch (error) {
    console.error('Twilio error:', error);
    throw new Error('Failed to send OTP');
  }
};

module.exports = {
  sendOTP,
};
