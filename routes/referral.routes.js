// ============================================
// FILE: routes/referral.routes.js
// ============================================

const express = require("express");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

const router = express.Router();

const {
  getReferralPrograms,
  getReferralProgramsProgress,
  getReferrerList
} = require("../controllers/referral.controller");

// ============================================
// GET REFERRAL PROGRAMS
// ============================================

/**
 * @swagger
 * tags:
 *   name: Referral
 *   description: Referral Programs APIs
 */

/**
 * @swagger
 * /api/referral/programs:
 *   get:
 *     summary: Get active referral programs
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Referral programs fetched successfully
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
 *                         example: e95d8e5d-471e-47dc-abda-df6ba9c2312d
 *
 *                       name:
 *                         type: string
 *                         example: Weekly Referral Missions
 *
 *                       description:
 *                         type: string
 *                         example: Complete referral missions and earn rewards
 *
 *                       type:
 *                         type: string
 *                         example: REFERRAL
 *
 *                       trackingType:
 *                         type: string
 *                         example: DAILY
 *
 *                       ruleType:
 *                         type: string
 *                         example: TASK
 *
 *                       status:
 *                         type: string
 *                         example: RUNNING
 *
 *                       validFrom:
 *                         type: string
 *                         example: 2026-05-01T00:00:00.000Z
 *
 *                       validTill:
 *                         type: string
 *                         example: 2026-05-31T23:59:59.000Z
 *
 *                       weekStartDay:
 *                         type: string
 *                         example: MON
 *
 *                       maxReward:
 *                         type: number
 *                         example: 2200
 *
 *                       tasks:
 *                         type: array
 *
 *                         items:
 *                           type: object
 *
 *                           properties:
 *
 *                             dayNumber:
 *                               type: number
 *                               example: 1
 *
 *                             taskRuleType:
 *                               type: string
 *                               example: SLAB
 *
 *                             rewardPerOrder:
 *                               type: number
 *                               example: 20
 *
 *                             maxOrders:
 *                               type: number
 *                               example: 10
 *
 *                             maxEarning:
 *                               type: number
 *                               example: 200
 *
 *       500:
 *         description: Internal server error
 */

router.get(
  "/programs",
  riderAuthMiddleWare,
  getReferralPrograms
);

// ============================================
// GET REFERRAL PROGRAM PROGRESS
// ============================================

/**
 * @swagger
 * /api/referral/programs/progress:
 *   get:
 *     summary: Get referral programs progress
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Referral progress fetched successfully
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
 *                         example: e95d8e5d-471e-47dc-abda-df6ba9c2312d
 *
 *                       name:
 *                         type: string
 *                         example: Weekly Referral Missions
 *
 *                       status:
 *                         type: string
 *                         example: RUNNING
 *
 *                       maxReward:
 *                         type: number
 *                         example: 2200
 *
 *                       overallProgress:
 *                         type: object
 *
 *                         properties:
 *
 *                           completedDays:
 *                             type: number
 *                             example: 2
 *
 *                           totalDays:
 *                             type: number
 *                             example: 7
 *
 *                       tasks:
 *                         type: array
 *
 *                         items:
 *                           type: object
 *
 *                           properties:
 *
 *                             dayNumber:
 *                               type: number
 *                               example: 1
 *
 *                             dayName:
 *                               type: string
 *                               example: MON
 *
 *                             taskRuleType:
 *                               type: string
 *                               example: SLAB
 *
 *                             progress:
 *                               type: object
 *
 *                               properties:
 *
 *                                 completedOrders:
 *                                   type: number
 *                                   example: 7
 *
 *                                 earnedAmount:
 *                                   type: number
 *                                   example: 250
 *
 *                                 remainingOrders:
 *                                   type: number
 *                                   example: 3
 *
 *                                 progressPercentage:
 *                                   type: number
 *                                   example: 70
 *
 *                                 status:
 *                                   type: string
 *                                   example: RUNNING
 *
 *                                 isCompleted:
 *                                   type: boolean
 *                                   example: false
 *
 *       500:
 *         description: Internal server error
 */

router.get(
  "/programs/progress",
  riderAuthMiddleWare,
  getReferralProgramsProgress
);

// ============================================
// GET REFERRER LIST
// ============================================

/**
 * @swagger
 * /api/referral/referrer/list:
 *   get:
 *     summary: Get referrer referral list
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Referrer list fetched successfully
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
 *                 data:
 *                   type: object
 *
 *                   properties:
 *
 *                     summary:
 *                       type: object
 *
 *                       properties:
 *
 *                         totalReferrals:
 *                           type: number
 *                           example: 2
 *
 *                         completedReferrals:
 *                           type: number
 *                           example: 1
 *
 *                         activeReferrals:
 *                           type: number
 *                           example: 1
 *
 *                     referrals:
 *                       type: array
 *
 *                       items:
 *                         type: object
 *
 *                         properties:
 *
 *                           referralId:
 *                             type: string
 *                             example: REF1001
 *
 *                           referee:
 *                             type: object
 *
 *                             properties:
 *
 *                               riderId:
 *                                 type: string
 *                                 example: RID2001
 *
 *                               name:
 *                                 type: string
 *                                 example: Sai
 *
 *                           status:
 *                             type: string
 *                             example: IN_PROGRESS
 *
 *                           earnedAmount:
 *                             type: number
 *                             example: 400
 *
 *                           remainingAmount:
 *                             type: number
 *                             example: 600
 *
 *                           progressPercentage:
 *                             type: number
 *                             example: 40
 *
 *       500:
 *         description: Internal server error
 */

router.get(
  "/referrer/list",
  riderAuthMiddleWare,
  getReferrerList
);

module.exports = router;