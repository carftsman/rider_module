const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");

const STATIC_OTP = "007007";

// exports.sendStaticMobileOtp = async (req, res) => {
//   try {
//     let { phone } = req.body;

//     if (!phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number required",
//       });
//     }

//     if (!phone.startsWith("+") && phone.length === 10) {
//       phone = `+91${phone}`;
//     }

//     const phoneNumber = phone.replace("+91", "");

//     // Check if rider exists
//     let rider = await prisma.rider.findUnique({
//       where: { phoneNumber },
//     });

//     // If not exists → create
//     if (!rider) {
//       rider = await prisma.rider.create({
//         data: {
//           phoneNumber,
//           countryCode: "+91",
//           onboardingStage: "PHONE_VERIFICATION",
//         },
//       });
//     }

//     // Update OTP
//     await prisma.rider.update({
//       where: { id: rider.id },
//       data: {
//         otpCode: STATIC_OTP,
//         otpExpiresAt: new Date(Date.now() + 5 * 60000),
//       },
//     });

//     res.json({
//       success: true,
//       message: "Static OTP generated",
//       phone,
//       otp: STATIC_OTP,
//     });
//   } catch (err) {
//     console.error("Static OTP Send Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };


// =========================
// VERIFY STATIC OTP (UPDATED)
// =========================

exports.sendStaticMobileOtp = async (req, res) => {
  try {
    let { phone } = req.body;

    // -----------------------------
    // Basic Presence Check
    // -----------------------------
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
    }

    phone = phone.trim();

    // -----------------------------
    // Remove spaces & invalid chars
    // -----------------------------
    phone = phone.replace(/\s+/g, "");

    // -----------------------------
    // Validate Indian Number
    // Accept:
    // 9876543210
    // +919876543210
    // -----------------------------
    const indianPhoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

    if (!indianPhoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid phone number. Enter valid 10-digit Indian mobile number",
      });
    }

    // -----------------------------
    // Normalize number
    // -----------------------------
    if (!phone.startsWith("+91")) {
      phone = `+91${phone}`;
    }

    const phoneNumber = phone.replace("+91", "");

    // -----------------------------
    // Check if rider exists
    // -----------------------------
    let rider = await prisma.rider.findUnique({
      where: { phoneNumber },
    });

    if (!rider) {
      rider = await prisma.rider.create({
        data: {
          phoneNumber,
          countryCode: "+91",
          onboardingStage: "PHONE_VERIFICATION",
        },
      });
    }

    // -----------------------------
    // Update OTP
    // -----------------------------
    await prisma.rider.update({
      where: { id: rider.id },
      data: {
        otpCode: STATIC_OTP,
        otpExpiresAt: new Date(Date.now() + 5 * 60000),
      },
    });

    return res.json({
      success: true,
      message: "Static OTP generated",
      phone,
      otp: STATIC_OTP,
    });
  } catch (err) {
    console.error("Static OTP Send Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



exports.verifyStaticMobileOtp = async (req, res) => {
  try {
    let { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone & OTP required",
      });
    }

    if (!phone.startsWith("+") && phone.length === 10) {
      phone = `+91${phone}`;
    }

    const phoneNumber = phone.replace("+91", "");

    const rider = await prisma.rider.findUnique({
      where: { phoneNumber },
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    if (otp !== STATIC_OTP) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { riderId: rider.id, type: "access" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { riderId: rider.id, type: "refresh" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    // Update rider
    await prisma.rider.update({
      where: { id: rider.id },
      data: {
        phoneIsVerified: true,
        onboardingStage:
          rider.onboardingStage === "PHONE_VERIFICATION"
            ? "APP_PERMISSIONS"
            : rider.onboardingStage,
        refreshToken,
        otpCode: STATIC_OTP,
        lastOtpVerifiedAt: new Date(),
        otpExpiresAt: null,
      },
    });

    await prisma.riderOnboarding.upsert({
      where: { riderId: rider.id },
      update: {
        phoneVerified: true,
      },
      create: {
        riderId: rider.id,
        phoneVerified: true,
      },
    });

    res.json({
      success: true,
      message: "Static OTP verified",
      nextStage: "APP_PERMISSIONS",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Static OTP Verify Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Find rider by ID (Prisma way)
    const rider = await prisma.rider.findUnique({
      where: { id: decoded.riderId },
    });

    if (!rider || rider.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token mismatch",
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { riderId: rider.id, type: "access" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error("Refresh Token Error:", err);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};