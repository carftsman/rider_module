const express = require("express");
const router = express.Router();
const{getReferralProgress,getReferralRewards,getReferralCampaign,shareReferralByCode,referRider,getMyReferralSummary,
  getReferralProgressByNewRider
}=require('../controllers/riderReferralController')
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
/**
 * @swagger
 * /api/refer/rider/all/referrals:
 *   get:
 *     summary: Get referral progress for logged-in rider
 *     tags: [Referral]
 *     description: |
 *       Fetch referral progress including:
 *       - Active referral program details
 *       - Referred riders list
 *       - Order completion status
 *       - Earnings summary
 *       - Optional filtering by status and date
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, completed]
 *           default: all
 *         description: Filter referrals by target status
 *
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter referred riders created from this date (YYYY-MM-DD)
 *
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter referred riders created till this date (YYYY-MM-DD)
 *
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
 *
 *                 message:
 *                   type: string
 *                   example: Referral progress fetched successfully
 *
 *                 filters:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: all
 *                     fromDate:
 *                       type: string
 *                       nullable: true
 *                       example: "2026-05-01"
 *                     toDate:
 *                       type: string
 *                       nullable: true
 *                       example: "2026-05-05"
 *
 *                 program:
 *                   type: object
 *                   properties:
 *                     programId:
 *                       type: string
 *                       example: "uuid"
 *                     programName:
 *                       type: string
 *                       example: "Refer & Earn May Campaign"
 *                     validFrom:
 *                       type: string
 *                       format: date-time
 *                     validTill:
 *                       type: string
 *                       format: date-time
 *
 *                 referrer:
 *                   type: object
 *                   properties:
 *                     riderId:
 *                       type: string
 *                       example: "rider-uuid"
 *                     partnerId:
 *                       type: string
 *                       example: "P1001"
 *                     name:
 *                       type: string
 *                       example: "Ramu Kumar"
 *
 *                 summary:
 *                   type: object
 *                   properties:
 *                     referralAmountPerRider:
 *                       type: number
 *                       example: 500
 *                     targetOrdersPerRider:
 *                       type: number
 *                       example: 10
 *                     totalRidersOnboarded:
 *                       type: number
 *                       example: 5
 *                     targetReachedRiders:
 *                       type: number
 *                       example: 2
 *                     targetPendingRiders:
 *                       type: number
 *                       example: 3
 *                     totalEarnings:
 *                       type: number
 *                       example: 1000
 *
 *                 referredRiders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       newRiderId:
 *                         type: string
 *                       newRiderName:
 *                         type: string
 *                         nullable: true
 *                       newRiderPartnerId:
 *                         type: string
 *                         nullable: true
 *                       usedReferralCode:
 *                         type: string
 *
 *                       referredAt:
 *                         type: string
 *                         format: date-time
 *                       referredDate:
 *                         type: string
 *                         example: "2026-05-05"
 *                       referredAtIST:
 *                         type: string
 *                         example: "05/05/2026, 11:30:00 AM"
 *
 *                       ordersCompleted:
 *                         type: number
 *                         example: 6
 *                       targetOrders:
 *                         type: number
 *                         example: 10
 *
 *                       targetStatus:
 *                         type: string
 *                         enum: [TARGET_REACHED, TARGET_PENDING]
 *
 *                       remainingOrders:
 *                         type: number
 *                         example: 4
 *
 *                       rewardAmount:
 *                         type: number
 *                         example: 500
 *                       rewardEarned:
 *                         type: number
 *                         example: 0
 *
 *       400:
 *         description: Invalid configuration or missing partnerId
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Referral program targetOrders or rewardAmount not configured properly
 *
 *       401:
 *         description: Unauthorized rider
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Unauthorized rider
 *
 *       404:
 *         description: Rider or program not found
 *         content:
 *           application/json:
 *             examples:
 *               riderNotFound:
 *                 value:
 *                   success: false
 *                   message: Rider not found
 *               programNotFound:
 *                 value:
 *                   success: false
 *                   message: No active referral program found
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 *               error: Something went wrong
 */
router.get("/rider/all/referrals",riderAuthMiddleWare, getReferralProgress);
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
 *     security:
 *       - bearerAuth: [] 
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
 *       - [Referral]
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
/**
 * @swagger
 * /api/refer/referral/progress/{newRiderId}:
 *   get:
 *     summary: Get referral progress by new referred rider
 *     tags: [Referral]
 *     description: Fetch referral progress, active referral program details, completed orders, target status, and reward details for a specific referred rider.
 *     parameters:
 *       - in: path
 *         name: newRiderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the newly referred rider
 *         example: "51820218-8472-49b8-a158-632f85063bdc"
 *     responses:
 *       200:
 *         description: New referred rider details fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: New referred rider details fetched successfully
 *               program:
 *                 programId: "ddcffcd4-52dc-4ce6-a475-9ce79a61a5b8"
 *                 programName: "Refer and Earn May Offer"
 *                 validFrom: "2026-05-01T00:00:00.000Z"
 *                 validTill: "2026-05-31T23:59:59.000Z"
 *               data:
 *                 newRiderId: "51820218-8472-49b8-a158-632f85063bdc"
 *                 newRiderName: "Ramu Kumar"
 *                 newRiderPartnerId: "PID960488"
 *                 usedReferralCode: "P1001"
 *                 referredAt: "2026-05-05T06:12:27.583Z"
 *                 referredDate: "2026-05-05"
 *                 referredAtIST: "5/5/2026, 11:42:27 am"
 *                 ordersCompleted: 6
 *                 targetOrders: 10
 *                 targetStatus: TARGET_PENDING
 *                 remainingOrders: 4
 *                 rewardAmount: 500
 *                 rewardEarned: 0
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             examples:
 *               missingNewRiderId:
 *                 value:
 *                   success: false
 *                   message: newRiderId is required
 *               notReferred:
 *                 value:
 *                   success: false
 *                   message: This rider was not referred by anyone
 *               configError:
 *                 value:
 *                   success: false
 *                   message: Referral program targetOrders or rewardAmount not configured properly
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             examples:
 *               programNotFound:
 *                 value:
 *                   success: false
 *                   message: No active referral program found
 *               riderNotFound:
 *                 value:
 *                   success: false
 *                   message: Referred rider not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 *               error: Something went wrong
 */
router.get("/referral/progress/:newRiderId", getReferralProgressByNewRider);
module.exports=router;