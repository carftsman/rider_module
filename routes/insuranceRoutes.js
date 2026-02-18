// routes/insuranceRoutes.js
const express = require("express");
const router = express.Router();
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

const { getInsuranceDetails } = require("../controllers/insuranceController");
/**
 * @swagger
 * /api/profile/insurance/details:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get rider insurance details
 *     description: >
 *       Fetches the active insurance policy for the authenticated rider along with
 *       policy details, coverage information, and complete claim history.
 *       If no active policy exists, returns `data: null`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insurance details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   oneOf:
 *                     - type: "null"
 *                       example: null
 *                     - type: object
 *                       properties:
 *                         policyStatus:
 *                           type: string
 *                           example: ACTIVE
 *                         policyId:
 *                           type: string
 *                           example: POL-INS-2025-00981
 *                         policyProvider:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: XYZ Insurance Pvt Ltd
 *                             helpline:
 *                               type: string
 *                               example: "+91-1800-123-456"
 *                             email:
 *                               type: string
 *                               example: support@xyzinsurance.com
 *                         policyDuration:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: string
 *                               format: date
 *                               example: "2025-01-01"
 *                             endDate:
 *                               type: string
 *                               format: date
 *                               example: "2025-12-31"
 *                         coveragePeriod:
 *                           type: string
 *                           example: ON_DUTY_ONLY
 *                         insuranceType:
 *                           type: string
 *                           example: ACCIDENT
 *                         coverages:
 *                           type: object
 *                           properties:
 *                             accidentalDeath:
 *                               type: object
 *                               properties:
 *                                 covered:
 *                                   type: boolean
 *                                   example: true
 *                                 amount:
 *                                   type: number
 *                                   example: 500000
 *                             permanentDisability:
 *                               type: object
 *                               properties:
 *                                 covered:
 *                                   type: boolean
 *                                   example: true
 *                                 amount:
 *                                   type: number
 *                                   example: 300000
 *                             temporaryDisability:
 *                               type: object
 *                               properties:
 *                                 covered:
 *                                   type: boolean
 *                                   example: true
 *                                 amount:
 *                                   type: number
 *                                   example: 100000
 *                             hospitalization:
 *                               type: object
 *                               properties:
 *                                 covered:
 *                                   type: boolean
 *                                   example: false
 *                         claimHistory:
 *                           type: object
 *                           properties:
 *                             hasPreviousClaims:
 *                               type: boolean
 *                               example: true
 *                             totalClaims:
 *                               type: number
 *                               example: 2
 *                             claims:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   claimId:
 *                                     type: string
 *                                     example: CLM-2025-001
 *                                   insuranceType:
 *                                     type: string
 *                                     example: ACCIDENT
 *                                   incidentDate:
 *                                     type: string
 *                                     format: date
 *                                     example: "2025-02-10"
 *                                   orderId:
 *                                     type: string
 *                                     example: ORD123456
 *                                   status:
 *                                     type: string
 *                                     example: APPROVED
 *                                   claimedAmount:
 *                                     type: number
 *                                     example: 20000
 *                                   approvedAmount:
 *                                     type: number
 *                                     example: 18000
 *                                   rejectionReason:
 *                                     type: string
 *                                     example: null
 *                                   settledOn:
 *                                     type: string
 *                                     format: date
 *                                     example: "2025-02-15"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch insurance details
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
 *                   example: Failed to fetch insurance details
 */

router.get("/details", riderAuthMiddleWare, getInsuranceDetails);

module.exports = router;
