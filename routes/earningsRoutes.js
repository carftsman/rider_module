const express = require("express");
const router = express.Router();

const {
  getMonthEarnings,
  getWeekEarnings,
  getDayEarnings,
  getOrderEarningDetail,
  getEarningsSummary
} = require("../controllers/earningsController");

const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");


/* ORDER IS VERY IMPORTANT */

/**
 * @swagger
 * /api/earnings/week:
 *   get:
 *     tags: [Earnings]
 *     summary: Get week-wise earnings with day-wise orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-01-01"
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-01-07"
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Week earnings fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               from: "2026-01-01"
 *               to: "2026-01-07"
 *               totalOrders: 12
 *               totalEarnings: 1680
 *               days:
 *                 - date: "2026-01-06"
 *                   ordersCompleted: 1
 *                   orders:
 *                     - orderId: "ORD3005"
 *                       completedAt: "2026-01-06T11:51:53.250Z"
 *                       earnings:
 *                         basePay: 35
 *                         distancePay: 20
 *                         surgePay: 5
 *                         tips: 10
 *                         total: 70
 */
router.get("/week", riderAuthMiddleWare, getWeekEarnings);

/**
 * @swagger
 * /api/earnings/orders/{orderId}:
 *   get:
 *     tags: [Earnings]
 *     summary: Get earning details of a specific order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ORD3005"
 *     responses:
 *       200:
 *         description: Order earnings fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               orderId: "ORD3005"
 *               earnings:
 *                 basePay: 35
 *                 distancePay: 20
 *                 surgePay: 5
 *                 tips: 10
 *                 total: 70
 */
router.get("/orders/:orderId", riderAuthMiddleWare, getOrderEarningDetail);


/**
 * @swagger
 * /api/earnings/{date}:
 *   get:
 *     tags: [Earnings]
 *     summary: Get day-wise earnings with orders and earning details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-01-06"
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Day earnings fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               date: "2026-01-06"
 *               ordersCompleted: 1
 *               orders:
 *                 - orderId: "ORD3005"
 *                   completedAt: "2026-01-06T11:51:53.250Z"
 *                   earnings:
 *                     basePay: 35
 *                     distancePay: 20
 *                     surgePay: 5
 *                     tips: 10
 *                     total: 70
 */


/**
 * @swagger
 * /api/earnings/{month}:
 *   get:
 *     tags: [Earnings]
 *     summary: Get month-wise earnings with week-wise orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *           example: "jan"
 *         description: Month short name (jan, feb, mar...)
 *     responses:
 *       200:
 *         description: Month earnings fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               from: "2026-01-01"
 *               to: "2026-02-01"
 *               totalOrders: 12
 *               totalEarnings: 1680
 *               weeks:
 *                 - from: "2026-01-01"
 *                   to: "2026-01-07"
 *                   ordersCompleted: 12
 *                   orders:
 *                     - orderId: "ORD3005"
 *                       completedAt: "2026-01-06T11:51:53.250Z"
 *                       earnings:
 *                         basePay: 35
 *                         distancePay: 20
 *                         surgePay: 5
 *                         tips: 10
 *                         total: 70
 */

router.get("/:param", riderAuthMiddleWare, getMonthEarnings, getDayEarnings);


/**
 * @swagger
 * /api/earnings/summary:
 *   get:
 *     tags: [Earnings]
 *     summary: Get earnings summary for dashboard (today, week, month)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings summary fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               today:
 *                 date: "2026-01-06"
 *                 ordersCompleted: 1
 *                 totalEarnings: 70
 *               week:
 *                 from: "2026-01-01"
 *                 to: "2026-01-07"
 *                 ordersCompleted: 12
 *                 totalEarnings: 1680
 *               month:
 *                 from: "2026-01-01"
 *                 to: "2026-01-31"
 *                 ordersCompleted: 12
 *                 totalEarnings: 1680
 */

router.get("/summary", riderAuthMiddleWare, getEarningsSummary);


module.exports = router;
