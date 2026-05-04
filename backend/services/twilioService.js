const twilio = require('twilio');

const getTwilioConfig = () => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
});

const hasValidConfig = ({ accountSid, authToken, twilioPhoneNumber }) => {
  return Boolean(
    accountSid &&
      authToken &&
      twilioPhoneNumber &&
      accountSid.startsWith('AC') &&
      !accountSid.includes('your_') &&
      !authToken.includes('your_')
  );
};

const sendOTP = async (phoneNumber, otp) => {
  try {
    const { accountSid, authToken, twilioPhoneNumber } = getTwilioConfig();

    if (!hasValidConfig({ accountSid, authToken, twilioPhoneNumber })) {
      throw new Error('Twilio credentials are not configured');
    }

    const client = twilio(accountSid, authToken);
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
