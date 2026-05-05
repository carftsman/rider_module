const express = require("express");
const router = express.Router();
const {
  getPeakSlotProgress,
  getRiderPeakSlotPrograms,
} = require("../controllers/getPeakSlotProgressController");


const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /rider/peak-progress:
 *   get:
 *     summary: Get rider peak slot progress
 *     tags: [Rider Peak Progress]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Successfully fetched rider peak slot progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slotId:
 *                         type: string
 *                         example: slot_1
 *                       time:
 *                         type: string
 *                         example: "18:00 - 21:00"
 *                       ordersCompleted:
 *                         type: number
 *                         example: 3
 *                       reward:
 *                         type: number
 *                         example: 60
 *                       status:
 *                         type: string
 *                         example: IN_PROGRESS
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Server error
 */



router.get(
  "/peak-progress",
  riderAuthMiddleWare,
  getPeakSlotProgress
);


/**
 * @swagger
 * /rider/peak-slot-programs:
 *   get:
 *     summary: Get rider peak slot incentive programs
 *     tags: [Rider Peak Incentives]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Successfully fetched peak slot programs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Weekend Peak Slab Bonus
 *
 *                       cityId:
 *                         type: string
 *                         example: city_123
 *
 *                       pincodeIds:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["500081"]
 *
 *                       dateRange:
 *                         type: object
 *                         properties:
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-05-01T00:00:00.000Z
 *
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-05-31T23:59:59.000Z
 *
 *                       slots:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             startTime:
 *                               type: string
 *                               example: "19:00"
 *
 *                             endTime:
 *                               type: string
 *                               example: "23:00"
 *
 *                             daysOfWeek:
 *                               type: array
 *                               items:
 *                                 type: string
 *                                 enum: [MON, TUE, WED, THU, FRI, SAT, SUN]
 *                               example: ["SAT", "SUN"]
 *
 *                             ruleType:
 *                               type: string
 *                               enum: [PER_ORDER, SLAB]
 *                               example: SLAB
 *
 *                             reward:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                   example: 20
 *
 *                             slabs:
 *                               type: array
 *                               nullable: true
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   minOrders:
 *                                     type: integer
 *                                     example: 5
 *
 *                                   maxOrders:
 *                                     type: integer
 *                                     example: 10
 *
 *                                   rewardAmount:
 *                                     type: number
 *                                     example: 100
 *
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Failed to fetch peak slot programs
 */

router.get(
  "/peak-slot-programs",
  riderAuthMiddleWare,
  getRiderPeakSlotPrograms
);

module.exports = router;
