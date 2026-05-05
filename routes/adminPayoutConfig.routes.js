// routes/adminPayoutConfig.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminPayoutConfig.controller");

/**
 * @swagger
 * tags:
 *   name: Admin Payout Config
 *   description: Admin payout configuration APIs
 */

/**
 * @swagger
 * /api/admin/payout-config:
 *   post:
 *     summary: Create or replace payout config
 *     tags: [Admin Payout Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scenarioType
 *               - name
 *               - basePay
 *               - perKmRate
 *               - surgeConfig
 *             properties:
 *               scenarioType:
 *                 type: string
 *                 example: HIGH_DEMAND
 *               name:
 *                 type: string
 *                 example: High Demand Boost V2
 *               cityId:
 *                 type: string
 *                 example: city_001
 *               pincodeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["500081"]
 *               vehicleType:
 *                 type: string
 *                 enum: [bike, scooty, ev]
 *                 example: bike
 *               basePay:
 *                 type: number
 *                 example: 35
 *               perKmRate:
 *                 type: number
 *                 example: 6
 *               surgeConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   minDemand:
 *                     type: number
 *                     example: 50
 *                   multiplier:
 *                     type: number
 *                     example: 1.8
 *               peakConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   start:
 *                     type: string
 *                     example: "18:00"
 *                   end:
 *                     type: string
 *                     example: "21:00"
 *                   bonus:
 *                     type: number
 *                     example: 25
 *               weatherConfig:
 *                 type: object
 *                 additionalProperties:
 *                   type: number
 *                 example:
 *                   RAIN: 40
 *               notes:
 *                 type: string
 *                 example: Boost due to high demand
 *
 *     responses:
 *       201:
 *         description: Payout config created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Payout config replaced successfully
 *               data:
 *                 configId: cfg_123
 *                 version: 3
 *                 isActive: true
 *                 scenarioType: HIGH_DEMAND
 *                 cityId: city_001
 *                 createdAt: "2026-05-05T10:00:00Z"
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Invalid payload
 *               error:
 *                 field: basePay
 *                 issue: Base pay must be greater than 0
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 */

router.post("/admin/payout-config", controller.createPayoutConfig);

/**
 * @swagger
 * /api/admin/payout-config/active:
 *   get:
 *     summary: Get active payout config by city
 *     tags: [Admin Payout Config]
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         example: city_001
 *         description: City ID to fetch active payout config
 *
 *     responses:
 *       200:
 *         description: Active payout config fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 configId: cfg_123
 *                 scenarioType: HIGH_DEMAND
 *                 name: High Demand Boost V2
 *                 cityId: city_001
 *                 pincodeIds: ["500081"]
 *                 vehicleType: bike
 *                 basePay: 35
 *                 perKmRate: 6
 *                 surgeConfig:
 *                   enabled: true
 *                   minDemand: 50
 *                   multiplier: 1.8
 *                 peakConfig:
 *                   enabled: true
 *                   start: "18:00"
 *                   end: "21:00"
 *                   bonus: 25
 *                 weatherConfig:
 *                   RAIN: 40
 *                 version: 3
 *                 isActive: true
 *                 createdAt: "2026-05-05T10:00:00Z"
 *
 *       400:
 *         description: Missing or invalid query params
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: cityId is required
 *
 *       404:
 *         description: No active config found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: No active config found for this city
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 */
router.get("/admin/payout-config/active", controller.getActivePayoutConfig);

/**
 * @swagger
 * /api/admin/payout-config/history:
 *   get:
 *     summary: Get payout config history by city
 *     tags: [Admin Payout Config]
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         example: city_001
 *         description: City ID to fetch config history
 *
 *       - in: query
 *         name: scenarioType
 *         required: false
 *         schema:
 *           type: string
 *         example: HIGH_DEMAND
 *         description: Optional filter by scenario type
 *
 *     responses:
 *       200:
 *         description: Config history fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - configId: cfg_123
 *                   version: 3
 *                   scenarioType: HIGH_DEMAND
 *                   isActive: true
 *                   createdAt: "2026-05-05T10:00:00Z"
 *                 - configId: cfg_122
 *                   version: 2
 *                   scenarioType: LOW_DEMAND
 *                   isActive: false
 *                   createdAt: "2026-05-04T10:00:00Z"
 *                 - configId: cfg_121
 *                   version: 1
 *                   scenarioType: DEFAULT
 *                   isActive: false
 *                   createdAt: "2026-05-03T10:00:00Z"
 *
 *       400:
 *         description: Missing or invalid query params
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: cityId is required
 *
 *       404:
 *         description: No config history found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: No config history found for this city
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 */

router.get("/admin/payout-config/history", controller.getPayoutConfigHistory);

module.exports = router;