const express = require("express");
const { upsertIncentive , createWeeklyBonus, adminIncentiveController } = require("../controllers/adminIncentiveController");
const adminRouterIncentives = express.Router();


/**
 * @swagger
 * /api/admin/incentives/daily:
 *   post:
 *     summary: Create or Update Daily Incentive (Admin)
 *     tags:
 *       - Admin Incentives
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Creates or updates an incentive configuration.
 *       Admin provides totalRewardAmount and slab ranges.
 *       System automatically splits reward between PEAK and NORMAL slots.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - incentiveType
 *               - slotRules
 *               - slabs
 *               - totalRewardAmount
 *               - status
 *             properties:
 *               title:
 *                 type: string
 *                 example: Daily Target Bonus
 *
 *               description:
 *                 type: string
 *                 example: Earn more with daily deliveries
 *
 *               incentiveType:
 *                 type: string
 *                 example: DAILY_TARGET
 *
 *               slotRules:
 *                 type: object
 *                 properties:
 *                   minPeakSlots:
 *                     type: integer
 *                     example: 2
 *                   minNormalSlots:
 *                     type: integer
 *                     example: 3
 *
 *               slabs:
 *                 type: object
 *                 properties:
 *                   peak:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         minOrders:
 *                           type: integer
 *                           example: 5
 *                         maxOrders:
 *                           type: integer
 *                           example: 8
 *
 *                   normal:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         minOrders:
 *                           type: integer
 *                           example: 8
 *                         maxOrders:
 *                           type: integer
 *                           example: 12
 *
 *               totalRewardAmount:
 *                 type: number
 *                 description: Total incentive payout (auto split internally)
 *                 example: 270
 *
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *
 *     responses:
 *       200:
 *         description: Incentive saved successfully
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
 *                   example: Incentive saved successfully
 *
 *                 totalRewardAmount:
 *                   type: number
 *                   example: 270
 *
 *                 data:
 *                   type: object
 *                   description: Saved incentive object
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: All fields including totalRewardAmount are mandatory
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
 *
 *                 message:
 *                   type: string
 *                   example: Unable to save incentive
 */

adminRouterIncentives.post("/daily", upsertIncentive);



/**
 * @swagger
 * /api/admin/incentives/weekly_bonus:
 *   post:
 *     summary: Create weekly incentive bonus (Admin)
 *     description: Admin API to create a weekly target-based incentive rule for riders.
 *     tags:
 *       - Admin Incentives
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - weeklyRules
 *               - maxRewardPerWeek
 *             properties:
 *               title:
 *                 type: string
 *                 example: Weekly Target Bonus
 *               description:
 *                 type: string
 *                 example: Complete daily order targets throughout the week to earn bonus
 *               weeklyRules:
 *                 type: object
 *                 required:
 *                   - minOrdersPerDay
 *                 properties:
 *                   totalDaysInWeek:
 *                     type: number
 *                     example: 7
 *                   minOrdersPerDay:
 *                     type: number
 *                     example: 10
 *                   allowPartialDays:
 *                     type: boolean
 *                     example: true
 *               maxRewardPerWeek:
 *                 type: number
 *                 example: 1000
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Weekly bonus rule created successfully
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
 *                   example: Weekly bonus rule created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 6970ad9c46aa02fad3554ca7
 *                     title:
 *                       type: string
 *                       example: Weekly Target Bonus
 *                     description:
 *                       type: string
 *                       example: Complete daily order targets throughout the week
 *                     incentiveType:
 *                       type: string
 *                       example: WEEKLY_TARGET
 *                     weeklyRules:
 *                       type: object
 *                       properties:
 *                         totalDaysInWeek:
 *                           type: number
 *                           example: 7
 *                         minOrdersPerDay:
 *                           type: number
 *                           example: 10
 *                         allowPartialDays:
 *                           type: boolean
 *                           example: true
 *                     maxRewardPerWeek:
 *                       type: number
 *                       example: 1000
 *                     payoutTiming:
 *                       type: string
 *                       example: WEEKLY
 *                     status:
 *                       type: string
 *                       example: ACTIVE
 *       400:
 *         description: Validation error (missing or invalid input)
 *       401:
 *         description: Unauthorized – admin token missing or invalid
 *       500:
 *         description: Internal server error
 */


adminRouterIncentives.post("/weekly_bonus",createWeeklyBonus);



/**
 * @swagger
 * /api/admin/incentives/peak:
 *   get:
 *     summary: Get Peak Slot Incentive
 *     tags: [Rider Incentives]
 *     security:
 *       - bearerAuth: []
 *     description: Fetch active peak slot incentive (UI formatted response)
 *     responses:
 *       200:
 *         description: Peak slot incentive fetched successfully
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
 *                   example: Peak slot incentive fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Peak Slot Bonus
 *                     slotRule:
 *                       type: string
 *                       example: 6 - 10 hrs
 *                     slabs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orders:
 *                             type: number
 *                             example: 6
 *                           rewardAmount:
 *                             type: number
 *                             example: 100
 *                     payoutTiming:
 *                       type: string
 *                       example: POST_SLOT
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create or Update Peak Slot Incentive
 *     tags: [Admin Incentives]
 *     security:
 *       - bearerAuth: []
 *     description: Create or update PEAK_SLOT incentive (UPSERT, schema-compatible)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - minPeakSlots
 *               - minNormalSlots
 *               - slabs
 *             properties:
 *               title:
 *                 type: string
 *                 example: Peak Slot Bonus
 *               description:
 *                 type: string
 *                 example: Complete peak slot orders to earn bonus
 *               minPeakSlots:
 *                 type: number
 *                 example: 4
 *               minNormalSlots:
 *                 type: number
 *                 example: 2
 *               slabs:
 *                 type: object
 *                 properties:
 *                   peak:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required:
 *                         - minOrders
 *                         - maxOrders
 *                         - rewardAmount
 *                       properties:
 *                         minOrders:
 *                           type: number
 *                           example: 6
 *                         maxOrders:
 *                           type: number
 *                           example: 6
 *                         rewardAmount:
 *                           type: number
 *                           example: 100
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Peak slot incentive saved successfully
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
 *                   example: Peak slot incentive saved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Server error
 */
adminRouterIncentives
  .route("/peak")
  .get(adminIncentiveController)
  .post(adminIncentiveController);


module.exports = adminRouterIncentives;
