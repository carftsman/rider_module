const express = require("express");
const router = express.Router();

// ✅ CHANGE IS HERE (Destructuring Import)
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

const {
  markDelivered,
  getDashboard,
  getOrders,
  getSlotHistory,
  getCashInHand,
  getWallet
} = require("../controllers/rider.controller");


// ==============================
// POST
// ==============================

router.post("/order/deliver", riderAuthMiddleWare, markDelivered);

// ==============================
// GET
// ==============================

router.get("/dashboard", riderAuthMiddleWare, getDashboard);
router.get("/orders", riderAuthMiddleWare, getOrders);
router.get("/slot-history", riderAuthMiddleWare, getSlotHistory);
/**
 * @swagger
 * /api/rider/cashbalance:
 *   get:
 *     summary: Get rider COD cash-in-hand summary
 *     description: >
 *       Returns COD cash summary, pending orders, latest deposit details,
 *       and COD order history for the logged-in rider.
 *     tags:
 *       - Rider Cash
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cash-in-hand details fetched successfully
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
 *                   properties:
 *                     cashSummary:
 *                       type: object
 *                       properties:
 *                         totalCashCollected:
 *                           type: number
 *                           example: 2100
 *                         currency:
 *                           type: string
 *                           example: INR
 *                         toDeposit:
 *                           type: number
 *                           example: 2100
 *                         depositRequired:
 *                           type: boolean
 *                           example: true
 *                         maxAllowed:
 *                           type: number
 *                           example: 2500
 *                         canTakeNewOrders:
 *                           type: boolean
 *                           example: true
 *                         depositMode:
 *                           type: string
 *                           example: FULL_ONLY
 *                     latestDeposit:
 *                       type: number
 *                       example: 500
 *                     pendingOrdersSummary:
 *                       type: object
 *                       properties:
 *                         pendingOrdersCount:
 *                           type: number
 *                           example: 3
 *                         pendingAmount:
 *                           type: number
 *                           example: 2100
 *                     cashOrderHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                             example: ORD12345
 *                           customerName:
 *                             type: string
 *                             example: Rahul Sharma
 *                           totalAmount:
 *                             type: number
 *                             example: 750
 *                           depositedAmount:
 *                             type: number
 *                             example: 0
 *                           pendingAmount:
 *                             type: number
 *                             example: 750
 *                           status:
 *                             type: string
 *                             example: PENDING
 *                           collectedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-09T08:30:00.000Z"
 *                           depositedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                     rules:
 *                       type: object
 *                       properties:
 *                         depositWithinHours:
 *                           type: number
 *                           example: 24
 *                         warningMessage:
 *                           type: string
 *                           example: Partial deposit is not allowed. Rider must deposit full pending cash. COD orders are blocked if limit exceeds ₹2500.
 *       401:
 *         description: Unauthorized rider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized rider
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to fetch cash balance
 */


router.get("/cashbalance", riderAuthMiddleWare, getCashInHand);
router.get("/wallet", riderAuthMiddleWare, getWallet);

module.exports = router;
