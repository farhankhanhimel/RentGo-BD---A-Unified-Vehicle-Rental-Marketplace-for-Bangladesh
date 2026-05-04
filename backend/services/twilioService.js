const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const isTwilioConfigured = () => Boolean(accountSid && authToken && twilioPhoneNumber);

const sendSMS = async (phoneNumber, messageBody) => {
  if (!isTwilioConfigured()) {
    console.warn('Twilio is not fully configured. SMS message skipped.');
    return null;
  }

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    return message.sid;
  } catch (error) {
    console.error('Twilio error:', error);
    throw new Error('Failed to send SMS');
  }
};

const sendOTP = async (phoneNumber, otp) => {
  return sendSMS(phoneNumber, `Your RentGo verification code is: ${otp}. This code will expire in 15 minutes.`);
};

module.exports = {
  sendOTP,
  sendSMS,
};
