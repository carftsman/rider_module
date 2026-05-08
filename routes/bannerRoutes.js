const express = require("express");
const router = express.Router();

const {getRiderHomeBanners} = require("../controllers/bannerController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /api/banner/home-banners:
 *   get:
 *     summary: Get rider home banners status
 *     description: >
 *       Fetches rider home banner statuses for bank details, welcome kit,
 *       joining bonus, refer and earn, and daily incentives.
 *
 *       Boolean values mean completion or availability:
 *       - bank true means bank details are verified.
 *       - kit true means joining kit is delivered.
 *       - joiningBonus true means joining bonus program is available.
 *       - referAndEarn true means referral program is available.
 *       - dailyIncentive true means daily incentive program is available.
 *     tags:
 *       - Home Banners
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Home banners fetched successfully
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
 *                   example: Home banners fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     bank:
 *                       type: boolean
 *                       example: true
 *                       description: true if bank details are verified
 *                     bankStatus:
 *                       type: string
 *                       enum:
 *                         - PENDING
 *                         - UNDER_REVIEW
 *                         - COMPLETED
 *                       example: COMPLETED
 *                     bankMessage:
 *                       type: string
 *                       example: Bank details verified successfully.
 *
 *                     kit:
 *                       type: boolean
 *                       example: true
 *                       description: true if joining kit is delivered
 *                     kitStatus:
 *                       type: string
 *                       enum:
 *                         - NOT_REQUESTED
 *                         - REQUESTED
 *                         - APPROVED
 *                         - READY_FOR_DISPATCH
 *                         - DISPATCHED
 *                         - SHIPPED
 *                         - DELIVERED
 *                       example: DELIVERED
 *                     kitMessage:
 *                       type: string
 *                       example: Your joining kit has been delivered.
 *
 *                     joiningBonus:
 *                       type: boolean
 *                       example: true
 *                       description: true if joining bonus program is available
 *                     joiningBonusStatus:
 *                       type: string
 *                       enum:
 *                         - NOT_AVAILABLE
 *                         - ACTIVE
 *                         - TARGET_COMPLETED
 *                         - COMPLETED
 *                       example: ACTIVE
 *                     joiningBonusMessage:
 *                       type: string
 *                       example: Complete 7 more orders to earn ₹500 joining bonus.
 *                     joiningBonusOrdersCompleted:
 *                       type: integer
 *                       example: 3
 *                     joiningBonusTargetOrders:
 *                       type: integer
 *                       example: 10
 *                     joiningBonusRemainingOrders:
 *                       type: integer
 *                       example: 7
 *                     joiningBonusRewardAmount:
 *                       type: number
 *                       example: 500
 *
 *                     referAndEarn:
 *                       type: boolean
 *                       example: true
 *                       description: true if referral program is available for rider
 *                     referAndEarnStatus:
 *                       type: string
 *                       enum:
 *                         - NOT_AVAILABLE
 *                         - ACTIVE
 *                       example: ACTIVE
 *                     referAndEarnMessage:
 *                       type: string
 *                       example: Refer riders and earn rewards.
 *
 *                     dailyIncentive:
 *                       type: boolean
 *                       example: true
 *                       description: true if daily incentive program is available
 *                     dailyIncentiveStatus:
 *                       type: string
 *                       enum:
 *                         - NOT_AVAILABLE
 *                         - ACTIVE
 *                         - TARGET_COMPLETED
 *                         - PAID
 *                       example: ACTIVE
 *                     dailyIncentiveMessage:
 *                       type: string
 *                       example: Complete 6 more orders to earn ₹1000 reward.
 *                     dailyIncentiveOrdersCompleted:
 *                       type: integer
 *                       example: 4
 *                     dailyIncentiveTargetOrders:
 *                       type: integer
 *                       example: 10
 *                     dailyIncentiveRemainingOrders:
 *                       type: integer
 *                       example: 6
 *                     dailyIncentiveRewardAmount:
 *                       type: number
 *                       example: 1000
 *
 *             examples:
 *               completedBankAndKit:
 *                 summary: Bank and kit completed, incentives active
 *                 value:
 *                   success: true
 *                   message: Home banners fetched successfully
 *                   data:
 *                     bank: true
 *                     bankStatus: COMPLETED
 *                     bankMessage: Bank details verified successfully.
 *                     kit: true
 *                     kitStatus: DELIVERED
 *                     kitMessage: Your joining kit has been delivered.
 *                     joiningBonus: true
 *                     joiningBonusStatus: ACTIVE
 *                     joiningBonusMessage: Complete 7 more orders to earn ₹500 joining bonus.
 *                     joiningBonusOrdersCompleted: 3
 *                     joiningBonusTargetOrders: 10
 *                     joiningBonusRemainingOrders: 7
 *                     joiningBonusRewardAmount: 500
 *                     referAndEarn: true
 *                     referAndEarnStatus: ACTIVE
 *                     referAndEarnMessage: Refer riders and earn rewards.
 *                     dailyIncentive: true
 *                     dailyIncentiveStatus: ACTIVE
 *                     dailyIncentiveMessage: Complete 6 more orders to earn ₹1000 reward.
 *                     dailyIncentiveOrdersCompleted: 4
 *                     dailyIncentiveTargetOrders: 10
 *                     dailyIncentiveRemainingOrders: 6
 *                     dailyIncentiveRewardAmount: 1000
 *
 *               noProgramsAvailable:
 *                 summary: No active incentive/referral/joining bonus programs
 *                 value:
 *                   success: true
 *                   message: Home banners fetched successfully
 *                   data:
 *                     bank: false
 *                     bankStatus: PENDING
 *                     bankMessage: Please add your bank details to receive payouts.
 *                     kit: false
 *                     kitStatus: NOT_REQUESTED
 *                     kitMessage: Please select your joining kit.
 *                     joiningBonus: false
 *                     joiningBonusStatus: NOT_AVAILABLE
 *                     joiningBonusMessage: No joining bonus available.
 *                     joiningBonusOrdersCompleted: 0
 *                     joiningBonusTargetOrders: 0
 *                     joiningBonusRemainingOrders: 0
 *                     joiningBonusRewardAmount: 0
 *                     referAndEarn: false
 *                     referAndEarnStatus: NOT_AVAILABLE
 *                     referAndEarnMessage: Refer and earn is not available for your location.
 *                     dailyIncentive: false
 *                     dailyIncentiveStatus: NOT_AVAILABLE
 *                     dailyIncentiveMessage: No daily incentive available today.
 *                     dailyIncentiveOrdersCompleted: 0
 *                     dailyIncentiveTargetOrders: 0
 *                     dailyIncentiveRemainingOrders: 0
 *                     dailyIncentiveRewardAmount: 0
 *
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
 *                   example: Unauthorized rider
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

router.get(
  "/home-banners",
  riderAuthMiddleWare,
  getRiderHomeBanners
);

module.exports = router;