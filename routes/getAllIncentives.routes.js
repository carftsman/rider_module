const express = require("express");
const router = express.Router();
const {getAllIncentives,getCompletedIncentives}=require("../controllers/getAllIncecntives.controller")
const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /api/getRider/incentive:
 *   get:
 *     summary: Get active and upcoming incentives
 *     tags:
 *       - Rider Incentive
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - UPCOMING
 *         description: Incentive status filter
 *
 *     responses:
 *
 *       200:
 *         description: Incentives fetched successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 total:
 *                   type: integer
 *                   example: 3
 *
 *                 data:
 *                   type: array
 *
 *                   items:
 *                     type: object
 *
 *                     properties:
 *
 *                       programId:
 *                         type: string
 *                         example: "0f6a9b21-32f1-4f0a-aef0-123456789abc"
 *
 *                       name:
 *                         type: string
 *                         example: "Daily Boost Incentive"
 *
 *                       type:
 *                         type: string
 *                         example: "DAILY_TARGET"
 *
 *                       ruleType:
 *                         type: string
 *                         example: "SLAB"
 *
 *                       date:
 *                         type: string
 *                         example: "2026-05-21"
 *
 *                       slotId:
 *                         type: string
 *                         example: "0f6a9b21-32f1-4f0a-aef0-123456789abc-2026-05-21-full"
 *
 *                       startMinutes:
 *                         type: number
 *                         example: 0
 *
 *                       endMinutes:
 *                         type: number
 *                         example: 1439
 *
 *                       timeLabel:
 *                         type: string
 *                         example: "2026-05-21 → 2026-05-31"
 *
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *
 *                       status:
 *                         type: string
 *                         example: "ACTIVE"
 *
 *       500:
 *         description: Server error
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

router.get(
  "/incentive",
  riderAuthMiddleWare,
  getAllIncentives
);


/**
 * @swagger
 * /api/getRider/incentives/completed:
 *   get:
 *     summary: Get completed incentives
 *     tags:
 *       - Rider Incentive
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completed incentives fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: number
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       progressId:
 *                         type: string
 *                         example: "f5e92db0-ec3b-4b59-a7d6-0d4c6c9c11aa"
 * 
 *                       programId:
 *                         type: string
 *                         example: "e95d8e5d-471e-47dc-abda-df6ba9c2312d"
 * 
 *                       name:
 *                         type: string
 *                         example: "Weekly Dynamic Missions"
 * 
 *                       type:
 *                         type: string
 *                         example: "WEEKLY_TARGET"
 * 
 *                       ruleType:
 *                         type: string
 *                         example: "TASK"
 * 
 *                       status:
 *                         type: string
 *                         example: "COMPLETED"
 * 
 *                       rewardAmount:
 *                         type: number
 *                         example: 100
 * 
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-20T00:00:00.000Z"
 * 
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-20T10:30:00.000Z"
 *       500:
 *         description: Server error
 */
router.get(
  "/incentives/completed",
  riderAuthMiddleWare,
  getCompletedIncentives
);

module.exports = router;