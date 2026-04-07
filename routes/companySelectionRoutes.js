const express = require("express");
const router = express.Router();

const { selectRiderType,employeeDetails,documentDetails } = require("../controllers/companySelectionController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
/**
 * @swagger
 * /api/company/rider/type:
 *   post:
 *     summary: Select rider type (Individual or Company)
 *     description: Allows a logged-in rider to choose their rider type and updates onboarding stage to APP_PERMISSIONS.
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
 *               - riderType
 *             properties:
 *               riderType:
 *                 type: string
 *                 enum:
 *                   - INDIVIDUAL_EMPLOYEE
 *                   - COMPANY_EMPLOYEE
 *                 example: INDIVIDUAL_EMPLOYEE
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
 *                       example: "b3f1c2d4-5678-90ab-cdef-1234567890ab"
 *                     phoneNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     riderType:
 *                       type: string
 *                       example: INDIVIDUAL_EMPLOYEE
 *                     onboardingStage:
 *                       type: string
 *                       example: APP_PERMISSIONS
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             examples:
 *               missingRiderType:
 *                 value:
 *                   success: false
 *                   message: riderType is required
 *               invalidRiderType:
 *                 value:
 *                   success: false
 *                   message: 'Invalid riderType. Allowed values: INDIVIDUAL_EMPLOYEE, COMPANY_EMPLOYEE'
 *       404:
 *         description: Rider not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Rider not found
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
 *     summary: Upload Rider Documents (Company Flow)
 *     description: >
 *       This API uploads rider documents including DL number, PAN number,
 *       vehicle type, and selfie. It updates RiderKyc, RiderVehicle,
 *       RiderSelfie, and RiderOnboarding tables and moves onboarding stage
 *       to EMPLOYEEKYC_VERIFICATION.
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
 *               - dlNumber
 *               - panNumber
 *               - type
 *               - selfieUrl
 *             properties:
 *               dlNumber:
 *                 type: string
 *                 example: DL-0420110149646
 *               panNumber:
 *                 type: string
 *                 example: ABCDE1234F
 *               type:
 *                 type: string
 *                 enum: [ev, bike, scooty]
 *                 example: bike
 *               selfieUrl:
 *                 type: string
 *                 example: https://image-url.com/selfie.jpg
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
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
 *                   example: Documents uploaded
 *                 nextStage:
 *                   type: string
 *                   example: EMPLOYEEKYC_VERIFICATION
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
 *                   example: dlNumber, panNumber, type, selfieUrl are required
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
router.post("/rider/document", riderAuthMiddleWare, documentDetails);


module.exports = router;