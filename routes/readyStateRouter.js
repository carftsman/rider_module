const express = require("express");
const router = express.Router();
const { markOrderStateReady } = require("../controllers/readyStateController");
const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");



/**
 * @swagger
 * /api/order-state/ready:
 *   patch:
 *     tags:
 *       - Busy State
 *     summary: Set rider order state to READY
 *     description: >
 *       Changes the rider's orderState to READY.
 *       If the rider is already in READY state, no update is performed.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order state already READY or successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Order state already READY
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Order state changed to READY
 *                     orderState:
 *                       type: string
 *                       example: READY
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Rider not found
 *       500:
 *         description: Internal server error
 */


router.patch(
  "/order-state/ready",
  riderAuthMiddleWare,
  markOrderStateReady
);

module.exports = router;
