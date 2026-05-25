// routes/adminPayoutConfig.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminPayoutConfig.controller");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");



/**
 * @swagger
 * /api/admin/payout-config/city:
 *   post:
 *     summary: Create city payout configuration (versioned)
 *     description: |
 *       Creates a new city-level payout configuration with versioning support.
 *       Automatically deactivates the previous active configuration for the same
 *       city, scenario type, and vehicle type, then creates a new version.
 *
 *     tags:
 *       - Admin Payout Config
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scenarioType
 *               - cityId
 *               - basePay
 *             properties:
 *
 *               name:
 *                 type: string
 *                 example: "Chennai City Base Config"
 *
 *               scenarioType:
 *                 type: string
 *                 enum: [NORMAL, SURGE, PEAK, WEATHER]
 *                 example: "NORMAL"
 *
 *               cityId:
 *                 type: string
 *                 example: "city_6"
 *
 *               vehicleType:
 *                 type: string
 *                 enum: [bike, scooty, ev]
 *                 example: "bike"
 *
 *               basePay:
 *                 type: number
 *                 example: 45
 *
 *               perKmRate:
 *                 type: number
 *                 example: 8
 *
 *               surgeConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   multiplier:
 *                     type: number
 *                     example: 1.5
 *                   minLiveOrders:
 *                     type: integer
 *                     example: 40
 *                   extraPay:
 *                     type: number
 *                     example: 20
 *
 *               peakConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   startTime:
 *                     type: string
 *                     example: "18:00"
 *                   endTime:
 *                     type: string
 *                     example: "22:00"
 *                   extraPay:
 *                     type: number
 *                     example: 25
 *
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   multiplier:
 *                     type: number
 *                     example: 1.3
 *                   rainExtraPay:
 *                     type: number
 *                     example: 30
 *
 *               notes:
 *                 type: string
 *                 example: "City level payout config with versioning"
 *
 *               latitude:
 *                 type: number
 *                 example: 13.0827
 *
 *               longitude:
 *                 type: number
 *                 example: 80.2707
 *
 *     responses:
 *
 *       201:
 *         description: City payout config created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 data:
 *                   type: object
 *                   description: Returns the original request body
 *                   example:
 *                     name: "Chennai City Base Config"
 *                     scenarioType: "NORMAL"
 *                     cityId: "city_6"
 *                     vehicleType: "BIKE"
 *                     basePay: 45
 *                     perKmRate: 8
 *                     weatherConfig:
 *                       enabled: true
 *                       multiplier: 1.3
 *                       rainExtraPay: 30
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   examples:
 *                     nameScenario:
 *                       value: "name and scenarioType are required"
 *                     cityRequired:
 *                       value: "cityId is required"
 *                     basePayInvalid:
 *                       value: "basePay must be greater than 0"
 *                     perKmRateInvalid:
 *                       value: "perKmRate must be >= 0"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
 router.post("/admin/payout-config/city", controller.createCityPayoutConfig);
  /**
 * @swagger
 * /api/admin/payout-config/pincode:
 *   post:
 *     summary: Create pincode level payout config
 *     tags:
 *       - Admin Payout Config
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scenarioType
 *               - cityId
 *               - pincodeIds
 *               - vehicleType
 *               - basePay
 *               - perKmRate
 *
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Pincode Surge Config"
 *
 *               scenarioType:
 *                 type: string
 *                 example: "SURGE"
 *
 *               cityId:
 *                 type: string
 *                 example: "city_121"
 *
 *               pincodeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - "500053"
 *                   - "500088"
 *
 *               vehicleType:
 *                 type: string
 *                 example: "bike"
 *
 *               basePay:
 *                 type: number
 *                 example: 40
 *
 *               perKmRate:
 *                 type: number
 *                 example: 8
 *
 *               surgeConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.5
 *
 *                   minLiveOrders:
 *                     type: number
 *                     example: 20
 *
 *                   extraPay:
 *                     type: number
 *                     example: 25
 *
 *               peakConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   startTime:
 *                     type: string
 *                     example: "18:00"
 *
 *                   endTime:
 *                     type: string
 *                     example: "22:00"
 *
 *                   extraPay:
 *                     type: number
 *                     example: 15
 *
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.3
 *
 *                   rainExtraPay:
 *                     type: number
 *                     example: 20
 *
 *               notes:
 *                 type: string
 *                 example: "Pincode level payout config"
 *
 *     responses:
 *       201:
 *         description: Pincode payout configs created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: "Pincode configs created successfully"
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *
 *       400:
 *         description: Validation error
 *
 *       500:
 *         description: Internal server error
 */
router.post("/admin/payout-config/pincode", controller.createPincodePayoutConfig);

// /**
//  * @swagger
//  * /api/admin/payout-config/active:
//  *   get:
//  *     summary: Get active payout config by city
//  *     tags: [Admin Payout Config]
//  *     parameters:
//  *       - in: query
//  *         name: cityId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         example: city_001
//  *         description: City ID to fetch active payout config
//  *
//  *     responses:
//  *       200:
//  *         description: Active payout config fetched successfully
//  *         content:
//  *           application/json:
//  *             example:
//  *               success: true
//  *               data:
//  *                 configId: cfg_123
//  *                 scenarioType: HIGH_DEMAND
//  *                 name: High Demand Boost V2
//  *                 cityId: city_001
//  *                 pincodeIds: ["500081"]
//  *                 vehicleType: bike
//  *                 basePay: 35
//  *                 perKmRate: 6
//  *                 surgeConfig:
//  *                   enabled: true
//  *                   minDemand: 50
//  *                   multiplier: 1.8
//  *                 peakConfig:
//  *                   enabled: true
//  *                   start: "18:00"
//  *                   end: "21:00"
//  *                   bonus: 25
//  *                 weatherConfig:
//  *                   RAIN: 40
//  *                 version: 3
//  *                 isActive: true
//  *                 createdAt: "2026-05-05T10:00:00Z"
//  *
//  *       400:
//  *         description: Missing or invalid query params
//  *         content:
//  *           application/json:
//  *             example:
//  *               success: false
//  *               message: cityId is required
//  *
//  *       404:
//  *         description: No active config found
//  *         content:
//  *           application/json:
//  *             example:
//  *               success: false
//  *               message: No active config found for this city
//  *
//  *       500:
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             example:
//  *               success: false
//  *               message: Internal server error
//  */
router.get("/admin/payout-config/active", controller.getActivePayoutConfig);
/**
 * @swagger
 * /api/admin/all/payout-config:
 *   get:
 *     summary: Get payout configurations
 *     description: Fetches all payout configurations, optionally filtered by cityId, sorted by latest created first.
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter payout configs by city ID
 *         example: "city_6"
 *
 *     responses:
 *
 *       200:
 *         description: Payout configs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *
 *                       configId:
 *                         type: string
 *                         example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
 *
 *                       scenarioType:
 *                         type: string
 *                         example: "NORMAL"
 *
 *                       name:
 *                         type: string
 *                         example: "Chennai Base Config"
 *
 *                       cityId:
 *                         type: string
 *                         example: "city_6"
 *
 *                       pincodeIds:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example:
 *                           - "600001"
 *                           - "600002"
 *
 *                       vehicleType:
 *                         type: string
 *                         example: "BIKE"
 *
 *                       basePay:
 *                         type: number
 *                         example: 40
 *
 *                       perKmRate:
 *                         type: number
 *                         example: 8
 *
 *                       surgeConfig:
 *                         type: object
 *                         example:
 *                           enabled: true
 *                           multiplier: 1.5
 *
 *                       peakConfig:
 *                         type: object
 *                         example:
 *                           enabled: true
 *                           startTime: "18:00"
 *                           endTime: "22:00"
 *                           extraPay: 25
 *
 *                       weatherConfig:
 *                         type: object
 *                         example:
 *                           enabled: true
 *                           isRaining: false
 *                           multiplier: 1.2
 *                           rainExtraPay: 20
 *
 *                       version:
 *                         type: integer
 *                         example: 2
 *
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-21T10:00:00.000Z"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get(
  "/admin/all/payout-config",
  controller.getPayoutConfigs
);
/**
 * @swagger
 * /api/admin/payout-config/history:
 *   get:
 *     summary: Get Payout Config History (City Level + Pincode Level)
 *     tags: [Admin Payout Config]
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         example: city_123
 *         description: City ID
 *
 *       - in: query
 *         name: scenarioType
 *         required: false
 *         schema:
 *           type: string
 *         example: PEAK
 *         description: Filter by scenario type
 *
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [CITY, PINCODE]
 *         example: CITY
 *         description: Filter payout config type
 *
 *       - in: query
 *         name: pincode
 *         required: false
 *         schema:
 *           type: string
 *         example: 500081
 *         description: Filter specific pincode history
 *
 *     responses:
 *       200:
 *         description: Payout config history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 total:
 *                   type: number
 *                   example: 2
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       configId:
 *                         type: string
 *                         example: cfg_123
 *
 *                       type:
 *                         type: string
 *                         example: CITY
 *
 *                       name:
 *                         type: string
 *                         example: Hyderabad Bike Config
 *
 *                       version:
 *                         type: number
 *                         example: 3
 *
 *                       scenarioType:
 *                         type: string
 *                         example: PEAK
 *
 *                       cityId:
 *                         type: string
 *                         example: city_123
 *
 *                       pincodeIds:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["500081"]
 *
 *                       vehicleType:
 *                         type: string
 *                         example: BIKE
 *
 *                       basePay:
 *                         type: number
 *                         example: 50
 *
 *                       perKmRate:
 *                         type: number
 *                         example: 10
 *
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-05-21T10:00:00.000Z
 *
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-05-21T12:00:00.000Z
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: cityId is required
 *
 *       404:
 *         description: No payout config history found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: No payout config history found
 *
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
 *
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get(
  "/admin/payout-config/history",
  controller.getPayoutConfigHistory
);


 /**
 * @swagger
 * /api/admin/payout-config/base-pay:
 *   patch:
 *     summary: Update base pay for city or pincode level payout config
 *     tags:
 *       - Admin Payout Config
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *         example: city_126
 *
 *       - in: query
 *         name: pincodeId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional pincode ID for pincode-level config
 *         example: 500081
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - basePay
 *             properties:
 *               basePay:
 *                 type: number
 *                 example: 45
 *
 *     responses:
 *       200:
 *         description: Base pay updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Base pay updated successfully
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f
 *
 *                     cityId:
 *                       type: string
 *                       example: city_126
 *
 *                     pincodeIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - "500081"
 *                         - "500032"
 *
 *                     basePay:
 *                       type: number
 *                       example: 45
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: cityId is required
 *
 *       404:
 *         description: Payout config not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Payout config not found
 *
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
 *
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.patch("/admin/payout-config/base-pay",controller.updateBasePay)


/**
 * @swagger
 * /api/admin/distance-pay:
 *   patch:
 *     summary: Update per KM distance pay for city or pincode level payout config
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *         example: city_126
 *
 *       - in: query
 *         name: pincodeId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional pincode ID for pincode-level config
 *         example: 500081
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - perKmRate
 *             properties:
 *               perKmRate:
 *                 type: number
 *                 example: 8
 *
 *     responses:
 *       200:
 *         description: Per KM rate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Per KM rate updated successfully
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f
 *
 *                     cityId:
 *                       type: string
 *                       example: city_126
 *
 *                     pincodeIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - "500081"
 *                         - "500032"
 *
 *                     perKmRate:
 *                       type: number
 *                       example: 8
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: perKmRate must be greater than or equal to 0
 *
 *       404:
 *         description: Payout config not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Payout config not found
 *
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
 *
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.patch("/admin/distance-pay",controller.updateDistancePay)

/**
 * @swagger
 * /api/admin/surge-config:
 *   patch:
 *     summary: Update surge configuration for city or pincode level payout config
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *         example: city_126
 *
 *       - in: query
 *         name: pincodeId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional pincode ID for pincode-level config
 *         example: 500081
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - surgeConfig
 *             properties:
 *               surgeConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.5
 *
 *                   minLiveOrders:
 *                     type: integer
 *                     example: 20
 *
 *                   extraPay:
 *                     type: number
 *                     example: 15
 *
 *     responses:
 *       200:
 *         description: Surge config updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Surge config updated successfully
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f
 *
 *                     cityId:
 *                       type: string
 *                       example: city_126
 *
 *                     pincodeIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - "500081"
 *                         - "500032"
 *
 *                     surgeConfig:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *
 *                         multiplier:
 *                           type: number
 *                           example: 1.5
 *
 *                         minLiveOrders:
 *                           type: integer
 *                           example: 20
 *
 *                         extraPay:
 *                           type: number
 *                           example: 15
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: multiplier must be > 0
 *
 *       404:
 *         description: Payout config not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Payout config not found
 *
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
 *
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.patch("/admin/surge-config",controller.updateSurgeConfig)
/**
 * @swagger
 * /api/admin/weather-config:
 *   patch:
 *     summary: Update weather configuration for city or pincode level payout config
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *         example: city_126
 *
 *       - in: query
 *         name: pincodeId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional pincode ID for pincode-level config
 *         example: 500081
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weatherConfig
 *             properties:
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.3
 *
 *                   rainExtraPay:
 *                     type: number
 *                     example: 20
 *
 *     responses:
 *       200:
 *         description: Weather config updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Weather config updated successfully
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f
 *
 *                     cityId:
 *                       type: string
 *                       example: city_126
 *
 *                     pincodeIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - "500081"
 *                         - "500032"
 *
 *                     weatherConfig:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *
 *                         multiplier:
 *                           type: number
 *                           example: 1.3
 *
 *                         rainExtraPay:
 *                           type: number
 *                           example: 20
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: multiplier must be > 0
 *
 *       404:
 *         description: Payout config not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Payout config not found
 *
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
 *
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.patch("/admin/weather-config", controller.updateWeatherConfig);
/**
 * @swagger
 * /api/admin/rollback:
 *   post:
 *     summary: Rollback payout config by city or pincode
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         example: city_121
 *         description: City ID
 *
 *       - in: query
 *         name: pincodeId
 *         required: false
 *         schema:
 *           type: string
 *         example: "500053"
 *         description: Optional pincode ID for pincode-level rollback
 *
 *     responses:
 *       200:
 *         description: Rollback successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: "Rollback successful"
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "ec324bc0-f89d-43b2-bdfc-83c81c4d5892"
 *
 *                     cityId:
 *                       type: string
 *                       example: "city_121"
 *
 *                     pincodeIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - "500053"
 *
 *                     version:
 *                       type: integer
 *                       example: 2
 *
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *
 *       400:
 *         description: Validation error or no rollback version found
 *
 *       500:
 *         description: Internal server error
 */
router.post("/admin/rollback", controller.rollbackPayoutConfig);

// /**
//  * @swagger
//  * /api/admin/{id}/status:
//  *   patch:
//  *     summary: Toggle payout config status
//  *     tags: [Admin Payout Config]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         example: cfg_123
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               isActive:
//  *                 type: boolean
//  *                 example: false
//  *     responses:
//  *       200:
//  *         description: Status updated
//  *       400:
//  *         description: Cannot deactivate only active config
//  */
router.patch("/admin/:id/status", controller.togglePayoutConfigStatus);

// /**
//  * @swagger
//  * /api/rider/payout/surge-status:
//  *   get:
//  *     summary: Get rider surge status
//  *     tags: [Surge]
//  *     description: Fetches current surge status based on authenticated rider location
//  *
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     responses:
//  *       200:
//  *         description: Surge status fetched successfully
//  *         content:
//  *           application/json:
//  *             example:
//  *               success: true
//  *               data:
//  *                 isSurgeActive: true
//  *                 scenarioType: HIGH_DEMAND
//  *                 multiplier: 1.8
//  *                 minDemand: 50
//  *
//  *       401:
//  *         description: Unauthorized
//  *         content:
//  *           application/json:
//  *             example:
//  *               success: false
//  *               message: Unauthorized
//  *
//  *       404:
//  *         description: No active config found
//  *         content:
//  *           application/json:
//  *             example:
//  *               success: false
//  *               message: No active config found
//  *
//  *       500:
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             example:
//  *               success: false
//  *               message: Internal server error
//  */


/**
 * @swagger
 * /api/admin/update/payout-config/city:
 *   put:
 *     summary: Update city payout config
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         example: city_121
 *         description: City ID
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scenarioType
 *               - vehicleType
 *               - basePay
 *               - perKmRate
 *
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated City Config"
 *
 *               scenarioType:
 *                 type: string
 *                 example: "NORMAL"
 *
 *               vehicleType:
 *                 type: string
 *                 example: "bike"
 *
 *               basePay:
 *                 type: number
 *                 example: 50
 *
 *               perKmRate:
 *                 type: number
 *                 example: 8
 *
 *               surgeConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.5
 *
 *                   minLiveOrders:
 *                     type: number
 *                     example: 20
 *
 *                   extraPay:
 *                     type: number
 *                     example: 25
 *
 *               peakConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   startTime:
 *                     type: string
 *                     example: "18:00"
 *
 *                   endTime:
 *                     type: string
 *                     example: "22:00"
 *
 *                   extraPay:
 *                     type: number
 *                     example: 15
 *
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.3
 *
 *                   rainExtraPay:
 *                     type: number
 *                     example: 20
 *
 *               notes:
 *                 type: string
 *                 example: "Updated city payout config"
 *
 *     responses:
 *       200:
 *         description: City payout config updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: "City payout config updated successfully"
 *
 *                 data:
 *                   type: object
 *
 *       400:
 *         description: Validation error
 *
 *       404:
 *         description: City payout config not found
 *
 *       500:
 *         description: Internal server error
 */
router.put(
  "/admin/update/payout-config/city",
  controller.updateCityPayoutConfig
);


/**
 * @swagger
 * /api/admin/update/payout-config/pincode:
 *   put:
 *     summary: Update pincode payout config
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         example: city_121
 *         description: City ID
 *
 *       - in: query
 *         name: pincodeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "500053"
 *         description: Pincode ID
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scenarioType
 *               - vehicleType
 *               - basePay
 *               - perKmRate
 *
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Pincode Config"
 *
 *               scenarioType:
 *                 type: string
 *                 example: "SURGE"
 *
 *               vehicleType:
 *                 type: string
 *                 example: "bike"
 *
 *               basePay:
 *                 type: number
 *                 example: 60
 *
 *               perKmRate:
 *                 type: number
 *                 example: 10
 *
 *               surgeConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.5
 *
 *                   minLiveOrders:
 *                     type: number
 *                     example: 20
 *
 *                   extraPay:
 *                     type: number
 *                     example: 25
 *
 *               peakConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   startTime:
 *                     type: string
 *                     example: "18:00"
 *
 *                   endTime:
 *                     type: string
 *                     example: "22:00"
 *
 *                   extraPay:
 *                     type: number
 *                     example: 15
 *
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.3
 *
 *                   rainExtraPay:
 *                     type: number
 *                     example: 20
 *
 *               notes:
 *                 type: string
 *                 example: "Updated pincode payout config"
 *
 *     responses:
 *       200:
 *         description: Pincode payout config updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: "Pincode payout config updated successfully"
 *
 *                 data:
 *                   type: object
 *
 *       400:
 *         description: Validation error
 *
 *       404:
 *         description: Payout config not found
 *
 *       500:
 *         description: Internal server error
 */
router.put(
  "/admin/update/payout-config/pincode",
  controller.updatePincodePayoutConfig
);



router.get("/rider/payout/surge-status",riderAuthMiddleWare,controller.getSurgeStatus);
module.exports = router;