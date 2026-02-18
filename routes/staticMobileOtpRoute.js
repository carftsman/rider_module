// const express = require("express");
// const router = express.Router();

// const {
//   sendStaticMobileOtp,
//   verifyStaticMobileOtp
// } = require("../controllers/staticMobileOtpController");

// router.post("/send-static-otp", sendStaticMobileOtp);
// router.post("/verify-static-otp", verifyStaticMobileOtp);

// module.exports = router;


const express = require("express");
const staticRouter = express.Router();

const {
  sendStaticMobileOtp,
  verifyStaticMobileOtp,
  refreshAccessToken
} = require("../controllers/staticMobileOtpController");

/**
 * @swagger
 * /api/mobile/send-static-otp:
 *   post:
 *     tags: 
 *       - Static Auth
 *     summary: Send OTP to static rider/mobile
 *     description: Sends OTP to the provided mobile number.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9988123456"
 *
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 otp:
 *                   type: string
 *
 *       400:
 *         description: Missing or invalid phone
 *
 *       500:
 *         description: Server error
 */


staticRouter.post("/send-static-otp", sendStaticMobileOtp);

/**
 * @swagger
 * /api/mobile/verify-static-otp:
 *   post:
 *     tags:
 *       - Static Auth
 *     summary: Verify OTP for static rider login
 *     description: Verifies OTP and returns JWT Access + Refresh tokens.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9988123456"
 *               otp:
 *                 type: string
 *                 example: "007007"
 *
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *
 *       400:
 *         description: Missing fields
 *
 *       401:
 *         description: Incorrect or expired OTP
 *
 *       404:
 *         description: Rider not found
 *
 *       500:
 *         description: Server error
 */

staticRouter.post("/verify-static-otp", verifyStaticMobileOtp);

/**
 * @swagger
 * /api/mobile/refresh-token:
 *   post:
 *     tags:
 *       - Static Auth
 *     summary: Refresh access token
 *     description: Generates a new Access + Refresh token using refresh token.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "REFRESH_TOKEN_HERE"
 *
 *     responses:
 *       200:
 *         description: New tokens generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *
 *       400:
 *         description: Missing refresh token
 *
 *       401:
 *         description: Invalid refresh token
 *
 *       500:
 *         description: Server error
 */


staticRouter.post("/refresh-token", refreshAccessToken);

module.exports = staticRouter;