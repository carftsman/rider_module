const express = require("express");
const router = express.Router();

const {
  getDailyIncentive,
} = require("../controllers/riderDailyIncentive.controller");

const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /api/rider/program/daily:
 *   get:
 *     summary: Get daily incentive for logged-in rider
 *     tags: [Rider Incentives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */

router.get("/rider/program/daily", riderAuthMiddleWare, getDailyIncentive);

module.exports = router;