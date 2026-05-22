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
 *                 enum: [BIKE, SCOOTER, CYCLE, AUTO]
 *                 example: "BIKE"
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
 *     summary: Create pincode payout configuration (versioned)
 *     description: |
 *       Creates a new pincode-level payout configuration with versioning support.
 *       Automatically deactivates existing active configs for the same city, scenario type,
 *       vehicle type, and overlapping pincode sets, then creates a new versioned config.
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
 *               - cityId
 *               - scenarioType
 *               - vehicleType
 *               - pincodeIds
 *               - basePay
 *             properties:
 *
 *               name:
 *                 type: string
 *                 example: "Hyderabad Pincode Surge Config"
 *
 *               scenarioType:
 *                 type: string
 *                 enum: [NORMAL, SURGE, PEAK, WEATHER]
 *                 example: "SURGE"
 *
 *               cityId:
 *                 type: string
 *                 example: "city_6"
 *
 *               pincodeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - "500081"
 *                   - "500032"
 *
 *               vehicleType:
 *                 type: string
 *                 enum: [BIKE, SCOOTER, CYCLE, AUTO]
 *                 example: "BIKE"
 *
 *               basePay:
 *                 type: number
 *                 example: 50
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
 *                   multiplier:
 *                     type: number
 *                     example: 2
 *                   minLiveOrders:
 *                     type: integer
 *                     example: 30
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
 *                   startTime:
 *                     type: string
 *                     example: "19:00"
 *                   endTime:
 *                     type: string
 *                     example: "23:00"
 *                   extraPay:
 *                     type: number
 *                     example: 40
 *
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   multiplier:
 *                     type: number
 *                     example: 1.5
 *                   rainExtraPay:
 *                     type: number
 *                     example: 35
 *
 *               notes:
 *                 type: string
 *                 example: "Pincode-level dynamic payout config"
 *
 *               latitude:
 *                 type: number
 *                 example: 17.385
 *
 *               longitude:
 *                 type: number
 *                 example: 78.4867
 *
 *     responses:
 *
 *       201:
 *         description: Pincode payout config created successfully
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
 *                 message:
 *                   type: string
 *                   example: "Pincode config created successfully"
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
 *
 *                     name:
 *                       type: string
 *                       example: "Hyderabad Pincode Surge Config"
 *
 *                     scenarioType:
 *                       type: string
 *                       example: "SURGE"
 *
 *                     cityId:
 *                       type: string
 *                       example: "city_6"
 *
 *                     pincodeIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - "500081"
 *                         - "500032"
 *
 *                     vehicleType:
 *                       type: string
 *                       example: "BIKE"
 *
 *                     basePay:
 *                       type: number
 *                       example: 50
 *
 *                     perKmRate:
 *                       type: number
 *                       example: 10
 *
 *                     version:
 *                       type: integer
 *                       example: 3
 *
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *
 *                     weatherConfig:
 *                       type: object
 *                       example:
 *                         enabled: true
 *                         isRaining: false
 *                         multiplier: 1.5
 *                         rainExtraPay: 35
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
 *                     requiredFields:
 *                       value: "cityId, scenarioType, vehicleType are required"
 *                     pincodeRequired:
 *                       value: "pincodeIds are required"
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
 * /api/admin/payout-config/{id}/base-pay:
 *   patch:
 *     summary: Update base pay of payout configuration
 *     description: Updates only the basePay field for an existing payout configuration.
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payout config ID
 *         example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
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
 *
 *               basePay:
 *                 type: number
 *                 example: 60
 *
 *     responses:
 *
 *       200:
 *         description: Base pay updated successfully
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
 *                 message:
 *                   type: string
 *                   example: "Base pay updated successfully"
 *
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     id:
 *                       type: string
 *                       example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
 *
 *                     basePay:
 *                       type: number
 *                       example: 60
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
 *                   example: "basePay must be greater than 0"
 *
 *       404:
 *         description: Payout config not found
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
 *                   example: "Payout config not found"
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

router.patch("/admin/payout-config/:id/base-pay",controller.updateBasePay)


/**
 * @swagger
 * /api/admin/distance-pay/{id}:
 *   patch:
 *     summary: Update per kilometer payout rate
 *     description: Updates the perKmRate value for an existing payout configuration.
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payout config ID
 *         example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
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
 *
 *               perKmRate:
 *                 type: number
 *                 example: 12
 *
 *     responses:
 *
 *       200:
 *         description: Per KM rate updated successfully
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
 *                 message:
 *                   type: string
 *                   example: "Per KM rate updated successfully"
 *
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     id:
 *                       type: string
 *                       example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
 *
 *                     perKmRate:
 *                       type: number
 *                       example: 12
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
 *                   example: "perKmRate must be greater than or equal to 0"
 *
 *       404:
 *         description: Payout config not found
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
 *                   example: "Payout config not found"
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
router.patch("/admin/distance-pay/:id",controller.updateDistancePay)

/**
 * @swagger
 * /api/admin/surge-config/{id}:
 *   patch:
 *     summary: Update surge payout configuration
 *     description: Updates surge configuration settings like multiplier, minimum live orders, and extra pay for an existing payout config.
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payout config ID
 *         example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
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
 *
 *               surgeConfig:
 *                 type: object
 *                 properties:
 *
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.8
 *
 *                   minLiveOrders:
 *                     type: integer
 *                     example: 50
 *
 *                   extraPay:
 *                     type: number
 *                     example: 25
 *
 *     responses:
 *
 *       200:
 *         description: Surge config updated successfully
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
 *                 message:
 *                   type: string
 *                   example: "Surge config updated successfully"
 *
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     id:
 *                       type: string
 *                       example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
 *
 *                     surgeConfig:
 *                       type: object
 *                       properties:
 *
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *
 *                         multiplier:
 *                           type: number
 *                           example: 1.8
 *
 *                         minLiveOrders:
 *                           type: integer
 *                           example: 50
 *
 *                         extraPay:
 *                           type: number
 *                           example: 25
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
 *                     missingConfig:
 *                       value: "surgeConfig is required"
 *
 *                     invalidMultiplier:
 *                       value: "multiplier must be > 0"
 *
 *                     invalidMinOrders:
 *                       value: "minLiveOrders must be >= 0"
 *
 *                     invalidExtraPay:
 *                       value: "extraPay must be >= 0"
 *
 *       404:
 *         description: Payout config not found
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
 *                   example: "Payout config not found"
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

router.patch("/admin/surge-config/:id",controller.updateSurgeConfig)
/**
 * @swagger
 * /api/admin/weather-config{id}:
 *   patch:
 *     summary: Update weather payout configuration
 *     description: Updates weather configuration settings like rain extra pay, multiplier, raining status, and enable/disable state for an existing payout config.
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payout config ID
 *         example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
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
 *
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *
 *                   isRaining:
 *                     type: boolean
 *                     example: true
 *
 *                   multiplier:
 *                     type: number
 *                     example: 1.4
 *
 *                   rainExtraPay:
 *                     type: number
 *                     example: 30
 *
 *     responses:
 *
 *       200:
 *         description: Weather config updated successfully
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
 *                 message:
 *                   type: string
 *                   example: "Weather config updated successfully"
 *
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     id:
 *                       type: string
 *                       example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
 *
 *                     weatherConfig:
 *                       type: object
 *                       properties:
 *
 *                         enabled:
 *                           type: boolean
 *                           example: true
 *
 *                         multiplier:
 *                           type: number
 *                           example: 1.4
 *
 *                         rainExtraPay:
 *                           type: number
 *                           example: 30
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
 *
 *                     missingConfig:
 *                       value: "weatherConfig is required"
 *
 *                     invalidRainExtraPay:
 *                       value: "rainExtraPay must be >= 0"
 *
 *                     invalidMultiplier:
 *                       value: "multiplier must be > 0"
 *
 *       404:
 *         description: Payout config not found
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
 *                   example: "Payout config not found"
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
router.patch("/admin/weather-config/:id", controller.updateWeatherConfig);
/**
 * @swagger
 * /api/admin/rollback:
 *   post:
 *     summary: Rollback payout configuration to previous version
 *     description: |
 *       Rolls back the active payout configuration for a city to its previous version.
 *       The current active config is deactivated and the previous version is activated.
 *
 *     tags:
 *       - Admin Payout Config
 *
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID for which rollback is performed
 *         example: "city_6"
 *
 *     responses:
 *
 *       200:
 *         description: Rollback successful
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
 *                 message:
 *                   type: string
 *                   example: "Rollback successful"
 *
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     id:
 *                       type: string
 *                       example: "d30eb1d7-21a6-42c3-80d9-4ad2e8b6cf0f"
 *
 *                     cityId:
 *                       type: string
 *                       example: "city_6"
 *
 *                     scenarioType:
 *                       type: string
 *                       example: "SURGE"
 *
 *                     vehicleType:
 *                       type: string
 *                       example: "BIKE"
 *
 *                     version:
 *                       type: integer
 *                       example: 3
 *
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *
 *                     basePay:
 *                       type: number
 *                       example: 50
 *
 *                     perKmRate:
 *                       type: number
 *                       example: 10
 *
 *                     surgeConfig:
 *                       type: object
 *                       example:
 *                         enabled: true
 *                         multiplier: 2
 *
 *                     peakConfig:
 *                       type: object
 *                       example:
 *                         enabled: true
 *                         startTime: "19:00"
 *                         endTime: "23:00"
 *                         extraPay: 40
 *
 *                     weatherConfig:
 *                       type: object
 *                       example:
 *                         enabled: true
 *                         isRaining: false
 *                         multiplier: 1.5
 *                         rainExtraPay: 35
 *
 *       400:
 *         description: Validation or business error
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
 *                     missingCity:
 *                       value: "cityId is required"
 *                     noActive:
 *                       value: "No active config found"
 *                     noPrevious:
 *                       value: "No previous version found to rollback"
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
 * /api/admin/payout-config/city/{configId}:
 *   put:
 *     summary: Update City Level Payout Configuration
 *     tags: [Admin Payout Config]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         example: cfg_12345
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
 *               - perKmRate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hyderabad Bike Peak Config Updated
 *
 *               scenarioType:
 *                 type: string
 *                 example: NORMAL
 *
 *               cityId:
 *                 type: string
 *                 example: city_123
 *
 *               vehicleType:
 *                 type: string
 *                 example: bike
 *
 *               basePay:
 *                 type: number
 *                 example: 50
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
 *                   surgeAmount:
 *                     type: number
 *                     example: 15
 *
 *               peakConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   maxOrdersPerRider:
 *                     type: number
 *                     example: 10
 *                   extraPay:
 *                     type: number
 *                     example: 25
 *                   multiplier:
 *                     type: number
 *                     example: 1.5
 *
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   rainExtraPay:
 *                     type: number
 *                     example: 20
 *                   multiplier:
 *                     type: number
 *                     example: 1.2
 *
 *               notes:
 *                 type: string
 *                 example: Updated city payout config
 *
 *               latitude:
 *                 type: number
 *                 example: 17.385
 *
 *               longitude:
 *                 type: number
 *                 example: 78.4867
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
 *                 message:
 *                   type: string
 *                   example: City payout config updated successfully
 *                 data:
 *                   type: object
 *
 *       400:
 *         description: Validation or duplicate config error
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
 *                   example: Another city config already exists
 *
 *       404:
 *         description: Config not found
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
 *                   example: Payout config not found
 *
 *       500:
 *         description: Server error
 */
router.put(
  "/admin/payout-config/city/:configId",
  controller.updateCityPayoutConfig
);


/**
 * @swagger
 * /api/admin/payout-config/pincode/{configId}:
 *   put:
 *     summary: Update Pincode Level Payout Configuration
 *     tags: [Admin Payout Config]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *         example: cfg_67890
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
 *               - basePay
 *               - perKmRate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hyderabad Pincode Config Updated
 *
 *               scenarioType:
 *                 type: string
 *                 example: NORMAL
 *
 *               cityId:
 *                 type: string
 *                 example: city_123
 *
 *               pincodeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["500081", "500032"]
 *
 *               vehicleType:
 *                 type: string
 *                 example: bike
 *
 *               basePay:
 *                 type: number
 *                 example: 45
 *
 *               perKmRate:
 *                 type: number
 *                 example: 9
 *
 *               surgeConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   surgeAmount:
 *                     type: number
 *                     example: 12
 *
 *               peakConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   maxOrdersPerRider:
 *                     type: number
 *                     example: 9
 *                   extraPay:
 *                     type: number
 *                     example: 22
 *                   multiplier:
 *                     type: number
 *                     example: 1.3
 *
 *               weatherConfig:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   rainExtraPay:
 *                     type: number
 *                     example: 18
 *                   multiplier:
 *                     type: number
 *                     example: 1.15
 *
 *               notes:
 *                 type: string
 *                 example: Updated pincode payout config
 *
 *               latitude:
 *                 type: number
 *                 example: 17.385
 *
 *               longitude:
 *                 type: number
 *                 example: 78.4867
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
 *                 message:
 *                   type: string
 *                   example: Pincode payout config updated successfully
 *                 data:
 *                   type: object
 *
 *       400:
 *         description: Validation or duplicate config error
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
 *                   example: Another pincode config already exists
 *
 *       404:
 *         description: Config not found
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
 *                   example: Payout config not found
 *
 *       500:
 *         description: Server error
 */
router.put(
  "/admin/payout-config/pincode/:configId",
  controller.updatePincodePayoutConfig
);



router.get("/rider/payout/surge-status",riderAuthMiddleWare,controller.getSurgeStatus);
module.exports = router;