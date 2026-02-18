const express = require("express");
const incentiveRouter = express.Router();
 
const {
  getHomeIncentives,
  
} = require("../controllers/homeIncentivesController");

const{
    getDailyIncentiveEarning
}=require("../controllers/dailyIncentiveController");

const {
  getWeeklyIncentiveEarning
} = require("../controllers/weeeklyIncentiveController");
 

const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

 
// ==============================
// INCENTIVE ROUTES
// ==============================
 
// GET → Home dashboard incentives
 
/**
 * @swagger
 * /api/home/peakhours-incentives:
 *   get:
 *     tags: [Incentives]
 *     summary: Get peak hour incentives for home dashboard
 *     description: |
 *       Fetches ONLY ACTIVE **PEAK_HOUR** incentives.
 *       Used to display peak-hour banners and highlights on the rider home screen.
 *
 *     responses:
 *       200:
 *         description: Peak hour incentives fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 incentives:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: Peak Hour Bonus
 *                       description:
 *                         type: string
 *                         example: Complete 5 orders between 6PM - 10PM
 *                       incentiveType:
 *                         type: string
 *                         enum: [PEAK_HOUR]
 *                         example: PEAK_HOUR
 *                       rewardType:
 *                         type: string
 *                         enum: [FIXED_AMOUNT, PER_ORDER, PERCENTAGE]
 *                         example: FIXED_AMOUNT
 *                       rewardValue:
 *                         type: number
 *                         example: 100
 *                       maxRewardPerRider:
 *                         type: number
 *                         example: 300
 *                       condition:
 *                         type: object
 *                         properties:
 *                           minOrders:
 *                             type: integer
 *                             example: 5
 *                           startTime:
 *                             type: string
 *                             example: "18:00"
 *                           endTime:
 *                             type: string
 *                             example: "22:00"
 *                       status:
 *                         type: string
 *                         enum: [ACTIVE]
 *                         example: ACTIVE
 *
 *       500:
 *         description: Server error while fetching peak hour incentives
 */



incentiveRouter.get(
  "/peakhours-incentives",
  getHomeIncentives
);
/**
* @swagger

* /api/home/incentives/weekly-earning:

*   get:

*     tags: [Incentives]

*     summary: Get weekly incentive earning

*     description: |

*       Returns the rider's **weekly incentive earning** based on

*       completed DELIVERED orders in the current week.

*       Applicable only for ACTIVE WEEKLY_EARNING incentives.

*     security:

*       - bearerAuth: []

*

*     responses:

*       200:

*         description: Weekly incentive earning fetched successfully

*         content:

*           application/json:

*             schema:

*               type: object

*               properties:

*                 success:

*                   type: boolean

*                   example: true

*                 data:

*                   type: object

*                   nullable: true

*                   properties:

*                     weekStart:

*                       type: string

*                       example: 2025-01-06

*                     weekEnd:

*                       type: string

*                       example: 2025-01-12

*                     incentiveId:

*                       type: string

*                       example: INCENTIVE_ID_3

*                     title:

*                       type: string

*                       example: Weekly High Performer

*                     requiredOrders:

*                       type: integer

*                       example: 25

*                     completedOrders:

*                       type: integer

*                       example: 18

*                     achieved:

*                       type: boolean

*                       example: false

*                     earnedAmount:

*                       type: number

*                       example: 0

*                     maxRewardPerRider:

*                       type: number

*                       example: 100

*

*       401:

*         description: Unauthorized

*

*       500:

*         description: Server error

*/
incentiveRouter.get(
  "/incentives/weekly-earning",
  riderAuthMiddleWare,
  getWeeklyIncentiveEarning
);
 

/**
* @swagger
* /api/home/incentives/daily-earning:
*   get:
*     tags: [Incentives]
*     summary: Get daily incentive earning
*     description: |
*       Returns the rider's **day-wise incentive earning** based on
*       completed DELIVERED orders.
*       Applies only when an ACTIVE DAILY_EARNING incentive exists.
*     security:
*       - bearerAuth: []
*
*     responses:
*       200:
*         description: Daily incentive earning fetched successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: object
*                   nullable: true
*                   properties:
*                     date:
*                       type: string
*                       example: 2025-01-11
*                     incentiveId:
*                       type: string
*                       example: INCENTIVE_ID_2
*                     title:
*                       type: string
*                       example: Daily Target Bonus
*                     requiredOrders:
*                       type: integer
*                       example: 8
*                     completedOrders:
*                       type: integer
*                       example: 6
*                     achieved:
*                       type: boolean
*                       example: false
*                     earnedAmount:
*                       type: number
*                       example: 0
*                     maxRewardPerRider:
*                       type: number
*                       example: 150
*
*       401:
*         description: Unauthorized – invalid or missing token
*
*       500:
*         description: Server error while fetching daily incentive
*/

 incentiveRouter.get(
  "/incentives/daily-earning",
  riderAuthMiddleWare,
  getDailyIncentiveEarning
);


module.exports = incentiveRouter;