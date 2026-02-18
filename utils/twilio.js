const twilio = require("twilio");

let client = null;

// Initialize client only when SMS must be real
if (process.env.TWILIO_MODE === "prod") {
  client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
}

exports.sendSMS = async (phone, otp) => {
  // DEV MODE: no SMS, show OTP in console
  if (process.env.TWILIO_MODE === "dev") {
    console.log("DEV MODE → OTP not sent via SMS");
    console.log("OTP =", otp);
    return { dev: true };
  }

  // PROD MODE: send real SMS
  try {
    await client.messages.create({
      body: `Your Vega Rider OTP is ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });

    return { dev: false };
  } catch (err) {
    console.error("Twilio SMS Error:", err);
    throw new Error("Failed to send SMS");
  }
};
