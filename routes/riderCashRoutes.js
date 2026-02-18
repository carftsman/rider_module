const express = require("express");
const router = express.Router();

const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
const {
  withdrawFromWallet,
  handoverCodCash
} = require("../controllers/riderCashController");
/**
 * @swagger
 * /api/rider/cod/handover:
 *   post:
 *     summary: Handover COD cash collected by rider
 *     description: >
 *       Allows a rider to deposit the full COD cash collected.
 *       Partial deposits are not allowed. The deposited amount must exactly match
 *       the rider's cash-in-hand balance.
 *     tags:
 *       - Rider Cash
 *       
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1125
 *                 description: Full COD amount to be deposited
 *     responses:
 *       200:
 *         description: COD cash deposited successfully
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
 *                   example: COD cash deposited successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     depositedAmount:
 *                       type: number
 *                       example: 1125
 *                     remainingCashBalance:
 *                       type: number
 *                       example: 0
 *                     currency:
 *                       type: string
 *                       example: INR
 *       400:
 *         description: Invalid request or partial deposit attempted
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
 *                   example: Partial deposit not allowed. Deposit full amount ₹1125
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
 *       404:
 *         description: Rider not found
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
 *                   example: Rider not found
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
 *                   example: Failed to handover COD cash
 */

// ✅ Attach middleware here
router.post(
  "/rider/cod/handover",
  riderAuthMiddleWare,
  handoverCodCash
);

router.post(
  "/rider/wallet/withdraw",
  riderAuthMiddleWare,  // add middleware here too if auth required
  withdrawFromWallet
);

module.exports = router;
