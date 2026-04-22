const express = require("express");
const riderIncentivesRouter = express.Router();

const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

const {
  getAllIncentivesWithProgress,
  getDailyIncentives,
  getWeeklyIncentives,
  getPeakIncentives,
  getIncentiveByIdWithProgress
} = require("../controllers/riderIncentive.controller");



/**
 * @swagger
 * /api/rider/incentives/with-progress:
 *   get:
 *     summary: Get all incentives (daily, weekly, peak) with rider progress
 *     tags: [Rider Incentives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all incentives with progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncentiveListResponse'
 *       401:
 *         description: Unauthorized
 */
riderIncentivesRouter.get("/with-progress", riderAuthMiddleWare, getAllIncentivesWithProgress);


/**
 * @swagger
 * /api/rider/incentives/daily:
 *   get:
 *     summary: Get daily incentives with progress
 *     tags: [Rider Incentives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily incentives fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncentiveListResponse'
 *       401:
 *         description: Unauthorized
 */
riderIncentivesRouter.get("/daily", riderAuthMiddleWare, getDailyIncentives);

/**
 * @swagger
 * /api/rider/incentives/weekly:
 *   get:
 *     summary: Get weekly incentives with progress
 *     tags: [Rider Incentives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly incentives fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncentiveListResponse'
 *       401:
 *         description: Unauthorized
 */
riderIncentivesRouter.get("/weekly", riderAuthMiddleWare, getWeeklyIncentives);

/**
 * @swagger
 * /api/rider/incentives/peak:
 *   get:
 *     summary: Get peak incentives with slot timings and rider progress
 *     tags: [Rider Incentives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Peak incentives fetched successfully with slot timings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "uuid"
 *                       title:
 *                         type: string
 *                         example: "Peak Hour Bonus"
 *                       description:
 *                         type: string
 *                         example: "Complete peak slots and earn rewards"
 *                       incentiveType:
 *                         type: string
 *                         example: "PEAK_SLOT"
 *                       validFrom:
 *                         type: string
 *                         format: date-time
 *                       validTill:
 *                         type: string
 *                         format: date-time
 *
 *                       peakSlots:
 *                         type: array
 *                         description: List of today's peak slot timings
 *                         items:
 *                           type: object
 *                           properties:
 *                             slotId:
 *                               type: string
 *                             startTime:
 *                               type: string
 *                               example: "18:00"
 *                             endTime:
 *                               type: string
 *                               example: "22:00"
 *                             slotStartAt:
 *                               type: string
 *                               format: date-time
 *                             slotEndAt:
 *                               type: string
 *                               format: date-time
 *
 *                       slabs:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             minOrders:
 *                               type: integer
 *                               example: 10
 *                             maxOrders:
 *                               type: integer
 *                               example: 20
 *                             rewardAmount:
 *                               type: number
 *                               example: 250
 *
 *                       progress:
 *                         type: object
 *                         properties:
 *                           totalOrders:
 *                             type: integer
 *                             example: 5
 *                           peakOrders:
 *                             type: integer
 *                             example: 3
 *                           normalOrders:
 *                             type: integer
 *                             example: 2
 *                           completedPeakSlots:
 *                             type: integer
 *                             example: 1
 *                           completedNormalSlots:
 *                             type: integer
 *                             example: 0
 *                           achievedReward:
 *                             type: number
 *                             example: 100
 *                           eligible:
 *                             type: boolean
 *                             example: false
 *
 *       401:
 *         description: Unauthorized
 */
riderIncentivesRouter.get("/peak", riderAuthMiddleWare, getPeakIncentives);

/**
 * @swagger
 * /api/rider/incentives/{id}:
 *   get:
 *     summary: Get single incentive with rider progress
 *     tags: [Rider Incentives]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Incentive ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Incentive fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncentiveResponse'
 *       404:
 *         description: Incentive not found
 *       401:
 *         description: Unauthorized
 */
riderIncentivesRouter.get("/:id", riderAuthMiddleWare, getIncentiveByIdWithProgress);


module.exports = riderIncentivesRouter;