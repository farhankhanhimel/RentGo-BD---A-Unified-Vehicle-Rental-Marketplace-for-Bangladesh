const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendOTP = async (phoneNumber, otp) => {
  try {
    const message = await client.messages.create({
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
