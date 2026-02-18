// const Rider = require("../models/RiderModel");
// const jwt = require("jsonwebtoken");

// const STATIC_OTP = "007007";

// // =========================
// // SEND STATIC OTP
// // =========================
// exports.sendStaticMobileOtp = async (req, res) => {
//   try {
//     let { phone } = req.body;

//     if (!phone) {
//       return res.status(400).json({ success: false, message: "Phone number required" });
//     }

//     // Normalize phone
//     if (!phone.startsWith("+") && phone.length === 10) {
//       phone = `+91${phone}`;
//     }

//     let rider = await Rider.findOne({ "phone.number": phone.replace("+91", "") });

//     if (!rider) {
//       rider = new Rider({
//         phone: {
//           number: phone.replace("+91", ""),
//           countryCode: "+91"
//         },
//         onboardingStage: "PHONE_VERIFICATION"
//       });
//     }

//     // Save STATIC OTP (007007)
//     rider.otp = {
//       code: STATIC_OTP,
//       expiresAt: new Date(Date.now() + 5 * 60000) // 5 min expiry
//     };

//     await rider.save();

//     res.json({
//       success: true,
//       message: "Static OTP generated",
//       phone,
//       otp: STATIC_OTP
//     });

//   } catch (err) {
//     console.error("Static OTP Send Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };



// // =========================
// // VERIFY STATIC OTP
// // =========================
// exports.verifyStaticMobileOtp = async (req, res) => {
//   try {
//     let { phone, otp } = req.body;

//     if (!phone || !otp) {
//       return res.status(400).json({ success: false, message: "Phone & OTP required" });
//     }

//     // Normalize phone
//     if (!phone.startsWith("+") && phone.length === 10) {
//       phone = `+91${phone}`;
//     }

//     const rider = await Rider.findOne({
//       "phone.number": phone.replace("+91", "")
//     });

//     if (!rider) {
//       return res.status(404).json({ success: false, message: "Rider not found" });
//     }

//     // Check OTP
//     if (otp !== STATIC_OTP) {
//       return res.status(400).json({ success: false, message: "Incorrect OTP" });
//     }

//     // Update onboarding
//     rider.phone.isVerified = true;
//     rider.onboardingProgress.phoneVerified = true;

//     if (rider.onboardingStage === "PHONE_VERIFICATION") {
//       rider.onboardingStage = "APP_PERMISSIONS";
//     }

//     rider.otp = undefined; // clear otp
//     await rider.save();

//     // Generate token
//     const token = jwt.sign(
//       { riderId: rider._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       success: true,
//       message: "Static OTP verified",
//       nextStage: rider.onboardingStage,
//       token
//     });

//   } catch (err) {
//     console.error("Static OTP Verify Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };






//==========================================

const Rider = require("../models/RiderModel");
const jwt = require("jsonwebtoken");

const STATIC_OTP = "007007";

// =========================
// SEND STATIC OTP (NO CHANGE)
// =========================
exports.sendStaticMobileOtp = async (req, res) => {
    console.log("hello");
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number required" });
    }

    if (!phone.startsWith("+") && phone.length === 10) {
      phone = `+91${phone}`;
    }

    let rider = await Rider.findOne({ "phone.number": phone.replace("+91", "") });

    if (!rider) {
      rider = new Rider({
        phone: {
          number: phone.replace("+91", ""),
          countryCode: "+91",
        },
        onboardingStage: "PHONE_VERIFICATION",
      });
    }

    rider.otp = {
      code: STATIC_OTP,
      expiresAt: new Date(Date.now() + 5 * 60000),
    };

    await rider.save();

    res.json({
      success: true,
      message: "Static OTP generated",
      phone,
      otp: STATIC_OTP,
    });
  } catch (err) {
    console.error("Static OTP Send Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================
// VERIFY STATIC OTP (UPDATED)
// =========================
exports.verifyStaticMobileOtp = async (req, res) => {
  try {
    let { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "Phone & OTP required" });
    }

    if (!phone.startsWith("+") && phone.length === 10) {
      phone = `+91${phone}`;
    }

    const rider = await Rider.findOne({
      "phone.number": phone.replace("+91", ""),
    });

    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    if (otp !== STATIC_OTP) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    rider.phone.isVerified = true;
    rider.onboardingProgress.phoneVerified = true;

    if (rider.onboardingStage === "PHONE_VERIFICATION") {
      rider.onboardingStage = "APP_PERMISSIONS";
    }

    // ACCESS TOKEN (SHORT LIVED)
    const accessToken = jwt.sign(
      { riderId: rider._id, type: "access" },
      process.env.JWT_ACCESS_SECRET,
    //   { expiresIn: "15m" }
    );

    // REFRESH TOKEN (LONG LIVED)
    const refreshToken = jwt.sign(
      { riderId: rider._id, type: "refresh" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    rider.refreshToken = refreshToken;
    rider.otp = undefined;

    await rider.save();

    res.json({
      success: true,
      message: "Static OTP verified",
      nextStage: rider.onboardingStage,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Static OTP Verify Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// exports.verifyStaticMobileOtp = async (req, res) => {

//   try {

//     let { phone, otp } = req.body;
 
//     if (!phone || !otp) {

//       return res.status(400).json({

//         success: false,

//         message: "Phone & OTP required",

//       });

//     }
 
//     //NORMALIZE PHONE INSIDE API

//     // Always store & search only 10-digit number

//     if (phone.startsWith("+91")) {

//       phone = phone.slice(3);

//     }
 
//     if (phone.length !== 10) {

//       return res.status(400).json({

//         success: false,

//         message: "Invalid phone number format",

//       });

//     }
 
//     const rider = await Rider.findOne({

//       "phone.number": phone,

//     });
 
//     if (!rider) {

//       return res.status(404).json({

//         success: false,

//         message: "Rider not found",

//       });

//     }
 
//     if (otp !== STATIC_OTP) {

//       return res.status(400).json({

//         success: false,

//         message: "Incorrect OTP",

//       });

//     }
 
//     //Mark phone verified

//     rider.phone.isVerified = true;

//     rider.onboardingProgress.phoneVerified = true;
 
//     if (rider.onboardingStage === "PHONE_VERIFICATION") {

//       rider.onboardingStage = "APP_PERMISSIONS";

//     }
 
//     // ACCESS TOKEN

//     const accessToken = jwt.sign(

//       { riderId: rider._id, type: "access" },

//       process.env.JWT_ACCESS_SECRET,

//       { expiresIn: "15m" }

//     );
 
//     // REFRESH TOKEN

//     const refreshToken = jwt.sign(

//       { riderId: rider._id, type: "refresh" },

//       process.env.JWT_REFRESH_SECRET,

//       { expiresIn: "30d" }

//     );
 
//     rider.refreshToken = refreshToken;

//     rider.otp = undefined;
 
//     await rider.save();
 
//     return res.json({

//       success: true,

//       message: "OTP verified successfully",

//       nextStage: rider.onboardingStage,

//       accessToken,

//       refreshToken,

//     });

//   } catch (err) {

//     console.error("Verify OTP Error:", err);

//     return res.status(500).json({

//       success: false,

//       message: "Server error",

//     });

//   }

// };

 

// =========================
// REFRESH ACCESS TOKEN (NEW)
// =========================
exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const rider = await Rider.findById(decoded.riderId);

    if (!rider || rider.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token mismatch" });
    }

    const newAccessToken = jwt.sign(
      { riderId: rider._id, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error("Refresh Token Error:", err);
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
};