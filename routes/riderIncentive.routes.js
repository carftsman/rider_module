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
 *     summary: Get peak incentives with progress
 *     tags: [Rider Incentives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Peak incentives fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncentiveListResponse'
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