const express = require("express");
const router = express.Router();
const controller = require("../controllers/internalIncentive.controller");

/**
 * @swagger
 * tags:
 *   name: Internal Incentive System
 *   description: Internal APIs for processing incentives (Not for frontend)
 */

/**
 * @swagger
 * /internal/incentive/process-order:
 *   post:
 *     summary: Process incentive on order completion
 *     description: Internal API that updates progress, checks eligibility, unlocks reward, and credits wallet.
 *     tags: [Internal Incentive System]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             riderId: "r1"
 *             orderId: "ord_101"
 *     responses:
 *       200:
 *         description: Incentive processed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Incentive processed successfully"
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

router.post(
  "/internal/incentive/process-order",
  controller.processOrderIncentive
);

module.exports = router;