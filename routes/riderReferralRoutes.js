const express = require("express");
const router = express.Router();
const{getReferralProgress,getReferralRewards,getReferralCampaign,shareReferralByCode,referRider,getMyReferralSummary}=require('../controllers/riderReferralController')
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
/**
 * @swagger
 * /api/refer/rider/{riderId}/referrals:
 *   get:
 *     summary: Get rider referral progress
 *     description: >
 *       Fetch referral progress for a rider using riderId.
 *       Shows referred riders, completed order count, target status,
 *       reward amount, and total referral earnings.
 *     tags:
 *       - Rider Referral
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "r1"
 *         description: Rider ID of the referrer
 *     responses:
 *       200:
 *         description: Referral progress fetched successfully
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
 *                   example: Referral progress fetched successfully
 *                 referrer:
 *                   type: object
 *                   properties:
 *                     riderId:
 *                       type: string
 *                       example: "r1"
 *                     partnerId:
 *                       type: string
 *                       example: "P1001"
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       example: "Ramu Kumar"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalRidersOnboarded:
 *                       type: integer
 *                       example: 2
 *                     targetReachedRiders:
 *                       type: integer
 *                       example: 1
 *                     targetPendingRiders:
 *                       type: integer
 *                       example: 1
 *                     totalEarnings:
 *                       type: number
 *                       example: 500
 *                 referredRiders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       newRiderId:
 *                         type: string
 *                         example: "51820218-8472-49b8-a158-632f85063bdc"
 *                       newRiderName:
 *                         type: string
 *                         nullable: true
 *                         example: "Suresh Kumar"
 *                       newRiderPartnerId:
 *                         type: string
 *                         nullable: true
 *                         example: "PID960488"
 *                       usedReferralCode:
 *                         type: string
 *                         example: "P1001"
 *                       ordersCompleted:
 *                         type: integer
 *                         example: 10
 *                       targetOrders:
 *                         type: integer
 *                         example: 10
 *                       targetStatus:
 *                         type: string
 *                         enum:
 *                           - TARGET_REACHED
 *                           - TARGET_PENDING
 *                         example: TARGET_REACHED
 *                       remainingOrders:
 *                         type: integer
 *                         example: 0
 *                       rewardAmount:
 *                         type: number
 *                         example: 500
 *                       rewardEarned:
 *                         type: number
 *                         example: 500
 *       400:
 *         description: Rider does not have partnerId
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
 *                   example: Rider does not have partnerId
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
router.get("/rider/:riderId/referrals", getReferralProgress);
router.get(
  "/rewards",
  riderAuthMiddleWare,
  getReferralRewards
);

// 8. Active referral campaign
router.get(
  "/campaign",
  riderAuthMiddleWare,
  getReferralCampaign
);
// routes/riderReferralRoutes.js
/**
 * @swagger
 * /api/refer/share:
 *   post:
 *     summary: Share referral code
 *     description: Generate a shareable referral message and link using partnerId
 *     tags:
 *       - Referral
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partnerId
 *             properties:
 *               partnerId:
 *                 type: string
 *                 example: "P1001"
 *     responses:
 *       200:
 *         description: Referral code ready to share
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
 *                   example: Referral code ready to share
 *                 data:
 *                   type: object
 *                   properties:
 *                     partnerId:
 *                       type: string
 *                       example: "P1001"
 *                     riderName:
 *                       type: string
 *                       nullable: true
 *                       example: "Ramu Kumar"
 *                     shareMessage:
 *                       type: string
 *                       example: "🚴 Join our platform using my referral code *P1001* and earn rewards!"
 *                     shareLink:
 *                       type: string
 *                       example: "https://yourapp.link/referral?code=P1001"
 *       400:
 *         description: partnerId is required
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
 *                   example: partnerId is required
 *       404:
 *         description: Invalid referral code
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
 *                   example: Invalid referral code
 *       500:
 *         description: Internal server error
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
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Something went wrong
 */
router.post("/share", riderAuthMiddleWare, shareReferralByCode);
/**
 * @swagger
 * /api/refer/rider/refer:
 *   post:
 *     summary: Refer a new rider
 *     description: Existing logged-in rider can refer a new rider using their partnerId.
 *     tags:
 *       - Rider Referral
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phoneNumber
 *               - area
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ramu Kumar"
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *               area:
 *                 type: string
 *                 example: "Madhapur"
 *     responses:
 *       201:
 *         description: Rider referred successfully
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
 *                   example: "Rider referred successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     referredRiderId:
 *                       type: string
 *                       example: "51820218-8472-49b8-a158-632f85063bdc"
 *                     name:
 *                       type: string
 *                       example: "Ramu Kumar"
 *                     phoneNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     area:
 *                       type: string
 *                       example: "Madhapur"
 *                     referredByPartnerId:
 *                       type: string
 *                       example: "P1001"
 *                     status:
 *                       type: string
 *                       example: "PENDING_ONBOARDING"
 *       400:
 *         description: Bad request / validation error
 *         content:
 *           application/json:
 *             examples:
 *               requiredFields:
 *                 summary: Required fields missing
 *                 value:
 *                   success: false
 *                   message: "name, phoneNumber and area are required"
 *               partnerIdMissing:
 *                 summary: Referrer partnerId missing
 *                 value:
 *                   success: false
 *                   message: "Referrer partnerId not found"
 *               riderAlreadyExists:
 *                 summary: Rider already exists
 *                 value:
 *                   success: false
 *                   message: "Rider already exists with this phone number"
 *       401:
 *         description: Unauthorized rider
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
 *                   example: "Unauthorized rider"
 *       404:
 *         description: Referrer rider not found
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
 *                   example: "Referrer rider not found"
 *       500:
 *         description: Internal server error
 */
router.post("/rider/refer", riderAuthMiddleWare, referRider);
/**
 * @swagger
 * /api/refer/summary:
 *   get:
 *     summary: Get logged-in rider referral summary
 *     description: Returns referral earnings, total referred riders, and eligibility status.
 *     tags:
 *       - Referral
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral summary fetched successfully
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
 *                   example: Referral summary fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     referrer:
 *                       type: object
 *                       properties:
 *                         riderId:
 *                           type: string
 *                           example: "rider-uuid"
 *                         name:
 *                           type: string
 *                           example: "Ramu Kumar"
 *                         partnerId:
 *                           type: string
 *                           example: "P1001"
 *                     referralAmountPerRider:
 *                       type: number
 *                       example: 500
 *                     totalReferredRiders:
 *                       type: integer
 *                       example: 5
 *                     totalEligibleRiders:
 *                       type: integer
 *                       example: 3
 *                     totalEarnings:
 *                       type: number
 *                       example: 1500
 *                     referredRiders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           riderId:
 *                             type: string
 *                             example: "uuid-123"
 *                           name:
 *                             type: string
 *                             example: "Ravi Kumar"
 *                           phoneNumber:
 *                             type: string
 *                             example: "9876543210"
 *                           area:
 *                             type: string
 *                             example: "Madhapur"
 *                           isFullyRegistered:
 *                             type: boolean
 *                             example: true
 *                           earningStatus:
 *                             type: string
 *                             enum: [EARNED, PENDING]
 *                             example: EARNED
 *                           earningAmount:
 *                             type: number
 *                             example: 500
 *       400:
 *         description: PartnerId not found for this rider
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: PartnerId not found for this rider
 *       401:
 *         description: Unauthorized rider
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Unauthorized rider
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
 *               error: Something went wrong
 */
router.get("/summary", riderAuthMiddleWare, getMyReferralSummary);

module.exports=router;