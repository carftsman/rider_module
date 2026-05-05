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

module.exports = router;