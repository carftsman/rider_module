const express = require("express");
const router = express.Router();

const {
  getRiderIncentives
} = require("../controllers/getRiderIncentivesController");
const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");


/**
 * @swagger
 * /api/rider/incentives-new:
 *   get:
 *     summary: Get logged-in rider incentives (PEAK programs only)
 *     tags: [Rider Incentives]
 *
 *     description: |
 *       Returns incentive progress for the logged-in rider.
 *       - Only PEAK programs are included
 *       - Program must match rider pincode
 *       - Tracking type is restricted to DAILY or SLAB
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Incentives fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incentives:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       programId:
 *                         type: string
 *                         example: prog_peak_1
 *
 *                       type:
 *                         type: string
 *                         example: PEAK
 *
 *                       trackingType:
 *                         type: string
 *                         enum: [DAILY, SLAB]
 *                         example: DAILY
 *
 *                       ordersCompleted:
 *                         type: integer
 *                         example: 3
 *
 *                       rewardEarned:
 *                         type: number
 *                         example: 60
 *
 *                       status:
 *                         type: string
 *                         enum: [IN_PROGRESS, COMPLETED, NOT_STARTED]
 *                         example: IN_PROGRESS
 *
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *
 *       403:
 *         description: Access denied due to pincode mismatch
 *
 *       500:
 *         description: Server error
 */

router.get(
  "/",
  riderAuthMiddleWare,
  getRiderIncentives
);

module.exports = router;