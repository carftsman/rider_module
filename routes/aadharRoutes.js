const express = require("express");
const aadharRoute = express.Router();
const { sendOtp, verifyOtp } = require("../controllers/aadharController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");


/**
 * @swagger
 * /aadhar/send-otp:
 *   post:
 *     tags: [Rider]
 *     summary: Send OTP to the rider's Aadhaar number
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aadharNumber
 *             properties:
 *               aadharNumber:
 *                 type: string
 *                 example: "234567890123"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "OTP sent successfully"
 *               otp: "123456"
 *       400:
 *         description: Invalid Aadhaar number
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */

aadharRoute.post("/send-otp", riderAuthMiddleWare, sendOtp);

/**
 * @swagger
 * /aadhar/verify-otp:
 *   post:
 *     tags: [KYC]
 *     summary: Verify Aadhaar OTP and update rider KYC + onboarding stage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aadharNumber
 *               - otp
 *             properties:
 *               aadharNumber:
 *                 type: string
 *                 example: "234567890123"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             example:
 *               verified: true
 *               message: "OTP verified successfully"
 *       400:
 *         description: Invalid OTP or Aadhaar mismatch
 *       401:
 *         description: Unauthorized or OTP expired
 */

aadharRoute.post("/verify-otp", riderAuthMiddleWare, verifyOtp);

module.exports = aadharRoute;

