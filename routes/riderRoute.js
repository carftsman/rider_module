const express = require("express");
const riderRouter = express.Router();

const {
  sendOtp,
  verifyOtp,
  checkStatus,
  updateLocation,
  updateVehicle,
  savePersonalInfo,
  uploadSelfieController,
  uploadPan,
  uploadDL,
  getProfile,
  savePermissions,
  logoutOrDelete,
  onboardingStatus,
  completeKyc,
  refreshAccessToken,
  deviceToken,
  initializeApp,
  toggleRiderStatus,
  updateGPS
} = require("../controllers/riderRegisterController");

const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
const {getWeeklyIncentiveForRider} = require("../controllers/riderIncentiveController");
const {upload} = require("../utils/azureUpload");
// const uploadDriving=require('../utils/multerDL')

// ============================================================
//   AUTH & OTP
// ============================================================

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Send OTP to rider mobile number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number
 */
riderRouter.post("/auth/send-otp", sendOtp);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP and login rider
 *     description: Verifies OTP, completes phone verification, creates access + refresh token pair.
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
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP Verified"
 *                 isNewUser:
 *                   type: boolean
 *                   example: true
 *                 nextStage:
 *                   type: string
 *                   example: "APP_PERMISSIONS"
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *
 *       400:
 *         description: Missing phone or OTP / OTP not generated
 *
 *       401:
 *         description: Incorrect or expired OTP
 *
 *       404:
 *         description: Rider not found
 *
 *       500:
 *         description: Server error verifying OTP
 */

riderRouter.post("/auth/verify-otp", verifyOtp);

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     tags: [Auth]
 *     summary: Check rider registration status
 *     parameters:
 *       - name: phone
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status returned
 *       404:
 *         description: Rider not found
 */
riderRouter.get("/auth/status", checkStatus);


/**
 * @swagger
 * /api/rider/personal-info:
 *   post:
 *     tags: [Rider]
 *     summary: Save rider personal information
 *     description: Save personal information of the rider. fullName and primaryPhone are required.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - primaryPhone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Ramu Kumar"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1995-05-21"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *               primaryPhone:
 *                 type: string
 *                 example: "9876543210"
 *               secondaryPhone:
 *                 type: string
 *                 example: "9123456780"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ramu@example.com"
 *
 *     responses:
 *       200:
 *         description: Personal info saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Personal info saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     riderId:
 *                       type: string
 *                     personalInfo:
 *                       type: object
 *                     onboardingProgress:
 *                       type: object
 *                     onboardingStage:
 *                       type: string
 *
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Rider not found
 *       500:
 *         description: Server error
 */

riderRouter.post("/rider/personal-info", riderAuthMiddleWare, savePersonalInfo);

// ============================================================
//   LOCATION
// ============================================================

/**
 * @swagger
 * /api/rider/location:
 *   post:
 *     tags: [Rider]
 *     summary: Update rider location (city & area)
 *     description: Saves selected city and area for the rider and moves onboarding to SELECT_VEHICLE stage.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *               - area
 *             properties:
 *               city:
 *                 type: string
 *                 example: "Hyderabad"
 *               area:
 *                 type: string
 *                 example: "Madhapur"
 *
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Location updated
 *                 location:
 *                   type: object
 *                   properties:
 *                     city:
 *                       type: string
 *                       example: Hyderabad
 *                     area:
 *                       type: string
 *                       example: Madhapur
 *                 nextStage:
 *                   type: string
 *                   example: SELECT_VEHICLE
 *
 *       400:
 *         description: Missing city or area
 *
 *       404:
 *         description: Invalid city or area
 *
 *       500:
 *         description: Server error
 */

riderRouter.post("/rider/location", riderAuthMiddleWare, updateLocation);

// ============================================================
//   VEHICLE
// ============================================================

/**
 * @swagger
 * /api/rider/vehicle:
 *   post:
 *     tags: [Rider]
 *     summary: Update rider vehicle type
 *     description: Save selected vehicle type. Allowed values ev, bike, scooty.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [ev, bike, scooty]
 *                 example: bike
 *
 *     responses:
 *       200:
 *         description: Vehicle selected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Vehicle selected successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     riderId:
 *                       type: string
 *                     vehicleInfo:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: bike
 *                     onboardingProgress:
 *                       type: object
 *                     onboardingStage:
 *                       type: string
 *                       example: PERSONAL_INFO
 *
 *       400:
 *         description: Invalid vehicle type or missing field
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Rider not found
 *
 *       500:
 *         description: Server error
 */

riderRouter.post("/rider/vehicle", riderAuthMiddleWare, updateVehicle);



/**
 * @swagger
 * /api/rider/selfie:
 *   post:
 *     tags: [Rider]
 *     summary: Upload rider selfie
 *     description: Upload selfie image file. Field name must be "selfie".
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - selfie
 *             properties:
 *               selfie:
 *                 type: string
 *                 format: binary
 *                 description: Rider selfie image (jpg/png)
 *
 *     responses:
 *       200:
 *         description: Selfie uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Selfie uploaded successfully"
 *                 selfieUrl:
 *                   type: string
 *                   example: "/uploads/selfies/1700000000000-myphoto.jpg"
 *                 file:
 *                   type: object
 *                   properties:
 *                     originalname:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     mimetype:
 *                       type: string
 *
 *       400:
 *         description: Bad request (file missing)
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error
 */

riderRouter.post(
  "/rider/selfie",
  riderAuthMiddleWare,
  upload.single("selfie"),
  uploadSelfieController
);
// ============================================================
   // KYC DOCUMENTS
// ============================================================ 

/**
 * @swagger
 * /api/rider/pan:
 *   post:
 *     tags: [KYC]
 *     summary: Upload PAN card + PAN number
 *     description: Upload PAN card image and PAN number for rider KYC. Requires JWT authentication.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pan
 *               - panNumber
 *             properties:
 *               pan:
 *                 type: string
 *                 format: binary
 *                 description: PAN card image file
 *
 *               panNumber:
 *                 type: string
 *                 example: "ABCDE1234F"
 *                 description: Rider's PAN card number
 *
 *     responses:
 *       200:
 *         description: PAN uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: PAN uploaded successfully
 *                 imageUrl:
 *                   type: string
 *                   example: "https://your-azure-url.com/pan/12345.png"
 *                 panNumber:
 *                   type: string
 *                   example: "ABCDE1234F"
 *
 *       400:
 *         description: Missing file or invalid PAN number
 *
 *       401:
 *         description: Unauthorized (Missing or invalid token)
 *
 *       404:
 *         description: Rider not found
 *
 *       500:
 *         description: Server error while uploading PAN
 */

riderRouter.post(
  "/rider/pan",
  riderAuthMiddleWare,
  upload.single("pan"),
  uploadPan
);

/**
 * @swagger
 * /api/rider/dl:
 *   post:
 *     tags: [KYC]
 *     summary: Upload Driving License front, back images + DL number
 *     description: Uploads DL images and DL number. Updates rider onboarding & KYC status.
 *     
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - front
 *               - back
 *               - dlNumber
 *             properties:
 *               front:
 *                 type: string
 *                 format: binary
 *                 description: Driving License front image
 *               back:
 *                 type: string
 *                 format: binary
 *                 description: Driving License back image
 *               dlNumber:
 *                 type: string
 *                 example: "DL-0420110149646"
 *                 description: Driving License number
 *
 *     responses:
 *       200:
 *         description: Driving Licence uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Driving Licence uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     frontImage:
 *                       type: string
 *                       example: "uploads/dl/front.jpg"
 *                     backImage:
 *                       type: string
 *                       example: "uploads/dl/back.jpg"
 *                     dlNumber:
 *                       type: string
 *                       example: "DL-0420110149646"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *
 *       400:
 *         description: Missing fields or invalid DL number
 *       404:
 *         description: Rider not found
 *       500:
 *         description: Server error
 */

riderRouter.post(
  "/rider/dl",
  riderAuthMiddleWare,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 },
  ]),
  uploadDL
);
/**
 * @swagger
 * /api/rider/permissions:
 *   post:
 *     tags: [Rider]
 *     summary: Save app permissions (camera, foreground, background)
 *     description: Moved to next stage after permissions are granted. Requires Bearer token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               camera:
 *                 type: boolean
 *                 example: true
 *               foregroundLocation:
 *                 type: boolean
 *                 example: true
 *               backgroundLocation:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Permissions saved successfully
 *       400:
 *         description: Invalid or missing boolean values
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

riderRouter.post(
  "/rider/permissions",
  riderAuthMiddleWare,
  savePermissions
);



// ============================================================
//   GET PROFILE
// ============================================================

/**
 * @swagger
 * /api/rider/profile:
 *   get:
 *     tags: [Rider Profile]
 *     summary: Get rider complete profile
 *     security:
 *       - bearerAuth: [] 
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       404:
 *         description: Rider not found
 */
riderRouter.get("/rider/profile", riderAuthMiddleWare, getProfile);



/**
 * @swagger
 * /api/rider/logout:
 *   delete:
 *     tags: [Auth]
 *     summary: Logout rider (removes refresh token & device token)
 *     description: Clears the rider's refresh token and device token. Requires Bearer Auth.
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *
 *       401:
 *         description: Unauthorized (missing or invalid access token)
 *
 *       500:
 *         description: Server error while logging out
 */

riderRouter.delete("/rider/logout", riderAuthMiddleWare,logoutOrDelete)

/**
 * @swagger
 * /api/rider/onboarding-status:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get rider onboarding stage and progress
 *     description: Returns the current onboarding stage and all progress flags for the rider. Requires JWT authentication.
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Onboarding status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Onboarding status fetched successfully
 *                 onboardingStage:
 *                   type: string
 *                   example: "PAN_UPLOAD"
 *                   description: Current onboarding stage of the rider
 *                 onboardingProgress:
 *                   type: object
 *                   properties:
 *                     phoneVerified:
 *                       type: boolean
 *                       example: true
 *                     appPermissionDone:
 *                       type: boolean
 *                       example: true
 *                     citySelected:
 *                       type: boolean
 *                       example: true
 *                     vehicleSelected:
 *                       type: boolean
 *                       example: false
 *                     personalInfoSubmitted:
 *                       type: boolean
 *                       example: false
 *                     selfieUploaded:
 *                       type: boolean
 *                       example: false
 *                     aadharVerified:
 *                       type: boolean
 *                       example: false
 *                     panUploaded:
 *                       type: boolean
 *                       example: true
 *                     dlUploaded:
 *                       type: boolean
 *                       example: false
 *
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *
 *       404:
 *         description: Rider not found
 *
 *       500:
 *         description: Server error while fetching onboarding status
 */

riderRouter.get("/rider/onboarding-status", riderAuthMiddleWare,onboardingStatus)


/**
 * @swagger
 * /api/rider/complete-kyc:
 *   post:
 *     tags:
 *       - KYC-Approve
 *     summary: Complete rider KYC
 *     description: >
 *       Marks the rider’s KYC as completed after validating all onboarding steps.
 *       This API sets the rider as fully registered, updates onboarding stage,
 *       and ensures a partnerId is assigned.
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: KYC completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: KYC completed and rider fully registered
 *                 partnerId:
 *                   type: string
 *                   nullable: true
 *                   example: PARTNER12345
 *                 onboardingStage:
 *                   type: string
 *                   example: COMPLETED
 *                 onboardingProgress:
 *                   type: object
 *                   properties:
 *                     phoneVerified:
 *                       type: boolean
 *                       example: true
 *                     appPermissionDone:
 *                       type: boolean
 *                       example: true
 *                     citySelected:
 *                       type: boolean
 *                       example: true
 *                     vehicleSelected:
 *                       type: boolean
 *                       example: true
 *                     personalInfoSubmitted:
 *                       type: boolean
 *                       example: true
 *                     selfieUploaded:
 *                       type: boolean
 *                       example: true
 *                     aadharVerified:
 *                       type: boolean
 *                       example: true
 *                     panUploaded:
 *                       type: boolean
 *                       example: true
 *                     dlUploaded:
 *                       type: boolean
 *                       example: true
 *                     kycCompleted:
 *                       type: boolean
 *                       example: true
 *                 isFullyRegistered:
 *                   type: boolean
 *                   example: true
 *
 *       400:
 *         description: Onboarding steps not completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Onboarding steps not completed
 *
 *       404:
 *         description: Rider not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Rider not found
 *
 *       500:
 *         description: Server error while completing KYC
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Server error while completing KYC
 */


riderRouter.post("/rider/complete-kyc",riderAuthMiddleWare,completeKyc );


/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Generate new access token using refresh token
 *     description: Returns a new access token and rotates the refresh token. Does NOT require Bearer auth.
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
 *                 example: "eyJhbGciOiJIUzI1NiIsInR..."
 *
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..." 
 *
 *       401:
 *         description: Invalid or expired refresh token
 *
 *       500:
 *         description: Server error refreshing token
 */

riderRouter.post("/auth/refresh-token", refreshAccessToken);

/**
 * @swagger
 * /api/rider/device-token:
 *   post:
 *     tags: [Rider]
 *     summary: Save or update rider device token (FCM token)
 *     description: Stores the rider's device token used for push notifications. Requires Bearer Auth.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *             properties:
 *               deviceToken:
 *                 type: string
 *                 example: "d6G4fgP9sjX9k0W8eD12:APA91bGv3V..."
 *                 description: FCM device token
 *
 *     responses:
 *       200:
 *         description: Device token saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Device token saved successfully"
 *
 *       400:
 *         description: Missing device token
 *
 *       401:
 *         description: Unauthorized (Invalid or missing access token)
 *
 *       500:
 *         description: Server error while saving device token
 */

riderRouter.post("/rider/device-token", riderAuthMiddleWare ,deviceToken )

/**
 * @swagger
 * /api/rider/initialize:
 *   get:
 *     tags: [Auth]
 *     summary: Initialize app - determine whether rider goes to home or onboarding
 *     description: |
 *       Returns rider onboarding status or final home screen status.
 *       Requires a valid Access Token (handled in middleware).
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Initialization result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "FULLY_REGISTERED"
 *                   description: |
 *                     Possible values:
 *                     - FULLY_REGISTERED → go to Home
 *                     - ONBOARDING_PENDING → continue onboarding
 *                 nextPage:
 *                   type: string
 *                   example: "HOME"
 *                   description: Returned only when rider is fully registered
 *                 nextStage:
 *                   type: string
 *                   example: "PERSONAL_INFO"
 *                   description: Returned only when onboarding is pending
 *                 rider:
 *                   type: object
 *                   description: Rider object data
 *
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *
 *       500:
 *         description: Server error
 */


riderRouter.get("/rider/initialize", riderAuthMiddleWare, initializeApp);


  
/**
 * @swagger
 * /api/rider/online-offline-status:
 *   patch:
 *     tags:
 *       - Rider
 *     summary: Toggle rider online/offline status
 *     description: >
 *       Allows the rider to switch between ONLINE and OFFLINE.  
 *       Rider **cannot go ONLINE if GPS is disabled** (`gps.isEnabled = false`).
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isOnline:
 *                 type: boolean
 *                 example: true
 *                 description: true → Online, false → Offline
 *
 *     responses:
 *       200:
 *         description: Rider status updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Rider is now ONLINE"
 *               data:
 *                 isOnline: true
 *                 lastOnlineAt: "2026-01-03T10:20:00.000Z"
 *
 *       400:
 *         description: Validation or GPS error
 *         content:
 *           application/json:
 *             examples:
 *               gpsDisabled:
 *                 summary: GPS is OFF, rider cannot go online
 *                 value:
 *                   success: false
 *                   message: "Please enable GPS to go online"
 *               invalidBody:
 *                 summary: Invalid request
 *                 value:
 *                   success: false
 *                   message: "isOnline must be true or false"
 *
 *       401:
 *         description: Unauthorized (Missing or invalid token)
 *
 *       404:
 *         description: Rider not found
 *
 *       500:
 *         description: Server error
 */


riderRouter.patch(
  "/rider/online-offline-status",
  riderAuthMiddleWare,
  toggleRiderStatus
);


/**
 * @swagger
 * /api/rider/gps-status:
 *   patch:
 *     tags:
 *       - GPS
 *     summary: Update rider GPS permission & location
 *     description: >
 *       Updates the rider's GPS status.  
 *       If GPS is disabled from phone settings, the app must send `isEnabled: false`.  
 *       If GPS is enabled, latitude and longitude are required.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isEnabled:
 *                 type: boolean
 *                 example: true
 *               lat:
 *                 type: number
 *                 example: 12.9716
 *               lng:
 *                 type: number
 *                 example: 77.5946
 *
 *     responses:
 *       200:
 *         description: GPS status updated
 *         content:
 *           application/json:
 *             examples:
 *               enabled:
 *                 summary: GPS Enabled
 *                 value:
 *                   success: true
 *                   message: "GPS updated successfully"
 *                   data:
 *                     isEnabled: true
 *                     location:
 *                       lat: 12.9716
 *                       lng: 77.5946
 *               disabled:
 *                 summary: GPS Disabled
 *                 value:
 *                   success: true
 *                   message: "GPS disabled"
 *                   data:
 *                     isEnabled: false
 *                     lastLocation: null
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Latitude and longitude required when GPS is enabled"
 *
 *       500:
 *         description: Server error
 */


riderRouter.patch(
  "/rider/gps-status",
  riderAuthMiddleWare,
   updateGPS
);

/**
 * @swagger
 * /api/incentives/get_weekly:
 *   get:
 *     summary: Get weekly incentive details for rider
 *     description: Returns active weekly incentive configuration along with rider progress for the current week.
 *     tags:
 *       - Rider Incentives
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly incentive fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     incentiveId:
 *                       type: string
 *                       example: 6970ad9c46aa02fad3554ca7
 *                     title:
 *                       type: string
 *                       example: WEEKLY_TARGET
 *                     description:
 *                       type: string
 *                       example: Complete daily targets to earn weekly bonus
 *                     weeklyRules:
 *                       type: object
 *                       properties:
 *                         totalDaysInWeek:
 *                           type: number
 *                           example: 7
 *                         minOrdersPerDay:
 *                           type: number
 *                           example: 10
 *                         allowPartialDays:
 *                           type: boolean
 *                           example: true
 *                     maxRewardPerWeek:
 *                       type: number
 *                       example: 500
 *                     progress:
 *                       type: object
 *                       properties:
 *                         eligibleDays:
 *                           type: number
 *                           example: 3
 *                         totalDaysRequired:
 *                           type: number
 *                           example: 7
 *                         totalOrders:
 *                           type: number
 *                           example: 34
 *                         isEligible:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized – invalid or missing token
 *       500:
 *         description: Internal server error
 */

riderRouter.get("/incentives/get_weekly", riderAuthMiddleWare, getWeeklyIncentiveForRider);





module.exports = riderRouter;
