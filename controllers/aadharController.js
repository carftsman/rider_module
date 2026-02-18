const Joi = require("joi");
const Rider = require("../models/RiderModel");
const { ensurePartnerId } = require("../services/partner.service");

// Temp OTP store
const otpStore = {};
const FIXED_OTP = "123456";

// VALIDATION
const sendOtpSchema = Joi.object({
  aadharNumber: Joi.string().length(12).pattern(/^[2-9][0-9]{11}$/).required()
});

const verifyOtpSchema = Joi.object({
  aadharNumber: Joi.string().length(12).pattern(/^[2-9][0-9]{11}$/).required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
});


// ========================================================================
// SEND OTP
// ========================================================================
exports.sendOtp = async (req, res) => {
  const { error } = sendOtpSchema.validate(req.body);
  if (error)
    return res.status(400).json({ message: error.details[0].message });

  const { aadharNumber } = req.body;

  // Rider from middleware
  const riderId = req.rider._id;

  // Save OTP temporarily
  otpStore[aadharNumber] = {
    otp: FIXED_OTP,
    expiresAt: Date.now() + 2 * 60 * 1000
  };

  return res.status(200).json({
    message: "OTP sent successfully",
    otp: FIXED_OTP // dummy
  });
};


// ========================================================================
// VERIFY OTP
// ========================================================================
exports.verifyOtp = async (req, res) => {
  const { error } = verifyOtpSchema.validate(req.body);
  if (error)
    return res.status(400).json({ message: error.details[0].message });

  const { aadharNumber, otp } = req.body;
  const riderId = req.rider._id;
  // console.log(rider)

  const otpRecord = otpStore[aadharNumber];
  if (!otpRecord)
    return res.status(400).json({ message: "OTP not requested" });

  if (Date.now() > otpRecord.expiresAt)
    return res.status(400).json({ message: "OTP expired" });

  if (otp !== otpRecord.otp)
    return res.status(400).json({ message: "Invalid OTP" });


  // OTP Success → Update Rider KYC
  await Rider.findByIdAndUpdate(riderId, {
    $set: {
      "onboardingProgress.aadharVerified": true,
      "kyc.aadhar.isVerified": true,
      "kyc.aadhar.status": "approved",
      onboardingStage: "PAN_UPLOAD"
    }
  });


  return res.status(200).json({
    verified: true,
    message: "OTP verified successfully",

  });
};
