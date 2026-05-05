const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminDailyIncentive.controller");

/**
 * @swagger
 * /api/admin/incentive/daily:
 *   post:
 *     summary: Create Daily Incentive (SLAB / FIXED / HYBRID)
 *     tags: [Admin Daily Incentives]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ruleType
 *               - dateRange
 *             properties:
 *               name:
 *                 type: string
 *                 example: Daily Order Boost
 *
 *               cityId:
 *                 type: string
 *                 example: city_123
 *
 *               pincodeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["500081"]
 *
 *               daysOfWeek:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [MON, TUE, WED, THU, FRI, SAT, SUN]
 *
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     example: 2026-05-01
 *                   endDate:
 *                     type: string
 *                     example: 2026-05-31
 *
 *               ruleType:
 *                 type: string
 *                 enum: [SLAB, FIXED_TARGET, HYBRID]
 *
 *               slabs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     minOrders:
 *                       type: integer
 *                     maxOrders:
 *                       type: integer
 *                     rewardAmount:
 *                       type: number
 *
 *               target:
 *                 type: object
 *                 properties:
 *                   orders:
 *                     type: integer
 *
 *               reward:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *
 *               conditions:
 *                 type: object
 *                 properties:
 *                   minOrders:
 *                     type: integer
 *                   minEarnings:
 *                     type: number
 *                   minAcceptanceRate:
 *                     type: number
 *                   minCompletionRate:
 *                     type: number
 *
 *               constraints:
 *                 type: object
 *                 properties:
 *                   minAcceptanceRate:
 *                     type: number
 *                   minCompletionRate:
 *                     type: number
 *
 *               maxPayoutPerDay:
 *                 type: number
 *
 *               isActive:
 *                 type: boolean
 *
 *     responses:
 *       200:
 *         description: Daily incentive created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Daily incentive created successfully
 *               data:
 *                 id: "daily_001"
 *                 name: "Daily Order Boost"
 */
router.post("/daily", controller.createDailyIncentive);

/**
 * @swagger
 * /api/admin/incentive/daily/{id}:
 *   put:
 *     summary: Update Daily Incentive
 *     tags: [Admin Daily Incentives]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: daily_001
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               maxPayoutPerDay:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *
 *     responses:
 *       200:
 *         description: Daily incentive updated
 */
router.put("/daily/:id", controller.updateDailyIncentive);

/**
 * @swagger
 * /api/admin/incentive/daily:
 *   get:
 *     summary: Get all daily incentives
 *     tags: [Admin Daily Incentives]
 *     responses:
 *       200:
 *         description: List of daily incentives
 */
router.get("/daily", controller.getAllDailyIncentives);

/**
 * @swagger
 * /api/admin/incentive/daily/{id}:
 *   get:
 *     summary: Get daily incentive details
 *     tags: [Admin Daily Incentives]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *          description: List of daily incentives
 */
router.get("/daily/:id", controller.getDailyIncentiveById);


/**
 * @swagger
 * /api/admin/incentive/daily/{id}:
 *   delete:
 *     summary: Delete a daily incentive (Admin only)
 *     description: >
 *       Allows admin to delete a daily incentive program **only if it is scheduled for future (next day or later)**.
 *       Deletion of today's or past incentives is not allowed.
 *     tags: [Admin Daily Incentives]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Incentive program ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daily incentive deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Daily incentive deleted successfully
 *       400:
 *         description: Cannot delete today's or past incentives
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Cannot delete today's or past incentives
 *       404:
 *         description: Program not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Program not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Failed to delete daily incentive
 */
router.delete("/daily/:id", controller.deleteDailyIncentive);


module.exports = router;