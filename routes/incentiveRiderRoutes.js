const express = require("express");
const router = express.Router();

const {
  getDailyIncentive
} = require("../controllers/riderIncentiveController");

const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /api/rider/incentives/daily:
 *   get:
 *     summary: Get Rider Daily Incentive Progress & Reward Preview
 *     tags:
 *       - Rider Incentives
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Returns daily incentive configuration and rider progress.
 *       totalRewardAmount will be greater than 0 ONLY when both PEAK and NORMAL
 *       slot targets are completed.
 *       potentialRewardAmount shows the maximum reward rider can earn today
 *       even if the target is not yet completed.
 *
 *     responses:
 *       200:
 *         description: Incentive data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 title:
 *                   type: string
 *                   example: Daily Target Bonus
 *
 *                 description:
 *                   type: string
 *                   example: Earn more with daily deliveries
 *
 *                 incentiveType:
 *                   type: string
 *                   example: DAILY_TARGET
 *
 *                 completedOrders:
 *                   type: integer
 *                   example: 15
 *
 *                 peakCompleted:
 *                   type: integer
 *                   example: 6
 *
 *                 normalCompleted:
 *                   type: integer
 *                   example: 9
 *
 *                 slotRules:
 *                   type: object
 *                   properties:
 *                     minPeakSlots:
 *                       type: integer
 *                       example: 2
 *                     minNormalSlots:
 *                       type: integer
 *                       example: 3
 *
 *                 slabs:
 *                   type: object
 *                   properties:
 *                     peak:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           minOrders:
 *                             type: integer
 *                             example: 5
 *                           maxOrders:
 *                             type: integer
 *                             example: 8
 *
 *                     normal:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           minOrders:
 *                             type: integer
 *                             example: 8
 *                           maxOrders:
 *                             type: integer
 *                             example: 12
 *
 *                 totalRewardAmount:
 *                   type: number
 *                   description: Earned reward amount (only when both targets completed)
 *                   example: 270
 *
 *                 potentialRewardAmount:
 *                   type: number
 *                   description: Maximum reward rider can earn after reaching target
 *                   example: 270
 *
 *                 eligible:
 *                   type: boolean
 *                   example: true
 *
 *                 status:
 *                   type: string
 *                   example: ACTIVE
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
 *       500:
 *         description: Server error
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
 *                   example: Failed to calculate incentive
 */


// TOKEN REQUIRED
router.get("/daily", riderAuthMiddleWare, getDailyIncentive);

module.exports = router;
