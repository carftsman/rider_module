const express = require("express");
const router = express.Router();
const controller = require("../controllers/internalIncentive.controller");
const { adminAuthMiddleware } = require("../middleware/adminAuthMiddleware");
const { allowRoles } = require("../middleware/allowRolesMiddleware");

/**
 * @swagger
 * tags:
 *   name: Internal Incentive System
 *   description: Internal APIs for processing incentives (Not exposed to frontend)
 */

/**
 * @swagger
 * /api/internal/incentive/process-order:
 *   post:
 *     summary: Process incentive on order completion
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Internal system API.
 *       This API is triggered when an order is delivered.
 *       It performs:
 *       - Progress update (daily/weekly/peak)
 *       - Eligibility check
 *       - Reward unlock
 *       - Wallet credit
 *
 *       ⚠️ Not for frontend usage
 *
 *     tags: [Internal Incentive System]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             riderId: "r1"
 *             orderId: "ord_101"
 *
 *     responses:
 *       200:
 *         description: Incentive processed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Incentive processed successfully"
 *
 *       400:
 *         description: Invalid request / order not delivered
 *
 *       500:
 *         description: Internal server error
 */

router.post(
  "/internal/incentive/process-order",
  adminAuthMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"), 
  controller.processOrderIncentive
);

module.exports = router;