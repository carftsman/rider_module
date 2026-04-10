const express = require("express");
const router = express.Router();
const { upload } = require("../utils/azureUpload");
const { selectRiderType,employeeDetails,documentDetails,onboardingStatus } = require("../controllers/companySelectionController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
/**
 * @swagger
 * /api/company/rider/type:
 *   post:
 *     summary: Select Rider Type
 *     description: Allows a rider to select their onboarding type (Individual or Company).
 *     tags:
 *       - Rider Type Onboarding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - riderType
 *             properties:
 *               riderType:
 *                 type: string
 *                 enum: [INDIVIDUAL_EMPLOYEE, COMPANY_EMPLOYEE]
 *                 example: COMPANY_EMPLOYEE
 *     responses:
 *       200:
 *         description: Rider type selected successfully
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
 *                   example: Rider type selected successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "uuid"
 *                     riderId:
 *                       type: string
 *                       example: "uuid"
 *                     riderType:
 *                       type: string
 *                       example: COMPANY_EMPLOYEE
 *                     appPermissionDone:
 *                       type: boolean
 *                       example: true
 *                 nextStage:
 *                   type: string
 *                   example: EMPLOYEE_DETAILS
 *
 *       400:
 *         description: Bad request (invalid input)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid riderType. Allowed values: INDIVIDUAL_EMPLOYEE, COMPANY_EMPLOYEE"
 *
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Unauthorized
 *
 *       404:
 *         description: Rider or onboarding record not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Rider onboarding record not found
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 */
router.post("/rider/type", riderAuthMiddleWare, selectRiderType);


/**
 * @swagger
 * /api/company/rider/employee:
 *   post:
 *     summary: Submit Employee Details (Company Rider)
 *     description: >
 *       This API collects employee details for a company rider during onboarding.
 *       It updates Rider, RiderProfile, and RiderOnboarding tables
 *       and moves onboarding stage to DOCUMENT_DETAILS.
 *     tags:
 *       - Rider Onboarding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - empId
 *               - fullName
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: Swiggy
 *               empId:
 *                 type: string
 *                 example: EMP123
 *               fullName:
 *                 type: string
 *                 example: Ramu Kumar
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: 1995-05-21
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *               secondaryPhone:
 *                 type: string
 *                 example: "9123456780"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ramu@example.com
 *     responses:
 *       200:
 *         description: Employee details submitted successfully
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
 *                   example: Employee details submitted
 *                 nextStage:
 *                   type: string
 *                   example: DOCUMENT_DETAILS
 *       400:
 *         description: Validation error
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
 *                   example: companyName, empId, fullName are required
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
 *       500:
 *         description: Internal server error
 */
router.post("/rider/employee", riderAuthMiddleWare, employeeDetails);



/**
 * @swagger
 * /api/company/rider/document:
 *   post:
 *     summary: Upload rider document details and selfie
 *     tags:
 *       - Rider Onboarding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - dlNumber
 *               - panNumber
 *               - type
 *               - selfie
 *             properties:
 *               dlNumber:
 *                 type: string
 *                 example: TS09AB12345678901
 *               panNumber:
 *                 type: string
 *                 example: ABCDE1234F
 *               type:
 *                 type: string
 *                 enum: [ev, bike, scooty]
 *                 example: bike
 *               selfie:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 */
router.post(
  "/rider/document",
  riderAuthMiddleWare,
  upload.single("selfie"),
  documentDetails
);

router.get("/rider/onboarding", riderAuthMiddleWare, onboardingStatus);


// router.post(
//   "/rider/document",
//   riderAuthMiddleWare,
//   upload.single("selfie"),
//   documentDetails
// );
module.exports = router;