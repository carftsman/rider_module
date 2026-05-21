// routes/adminPayoutConfig.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminPayoutConfig.controller");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");



 /**
  * @swagger
  * /api/admin/payout-config/city:
  *   post:
  *     summary: Create City Level Payout Configuration
  *     tags: [Admin Payout Config]
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
  *                 example: Hyderabad Bike Peak Config
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
  *                   surgeAmount:
  *                     type: number
  *                     example: 10
  *
  *               peakConfig:
  *                 type: object
  *                 properties:
  *                   enabled:
  *                     type: boolean
  *                     example: true
  *                   maxOrdersPerRider:
  *                     type: number
  *                     example: 8
  *                   extraPay:
  *                     type: number
  *                     example: 20
  *                   multiplier:
  *                     type: number
  *                     example: 1.2
  *
  *               weatherConfig:
  *                 type: object
  *                 properties:
  *                   enabled:
  *                     type: boolean
  *                     example: true
  *                   rainExtraPay:
  *                     type: number
  *                     example: 15
  *                   multiplier:
  *                     type: number
  *                     example: 1.1
  *
  *               notes:
  *                 type: string
  *                 example: Peak payout for bike riders
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
  *       201:
  *         description: City payout config created successfully
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
  *                   description: Returns exact request body
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
  *                 message:
  *                   type: string
  *                   example: cityId is required
  *
  *       500:
  *         description: Server error
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
  */
 router.post("/admin/payout-config/city", controller.createCityPayoutConfig);
  /**
  * @swagger
  * /api/admin/payout-config/pincode:
  *   post:
  *     summary: Create Pincode Level Payout Configuration
  *     tags: [Admin Payout Config]
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
  *                 example: Hyderabad Pincode Config
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
  *                   surgeAmount:
  *                     type: number
  *                     example: 10
  *
  *               peakConfig:
  *                 type: object
  *                 properties:
  *                   enabled:
  *                     type: boolean
  *                     example: true
  *                   maxOrdersPerRider:
  *                     type: number
  *                     example: 8
  *                   extraPay:
  *                     type: number
  *                     example: 20
  *                   multiplier:
  *                     type: number
  *                     example: 1.2
  *
  *               weatherConfig:
  *                 type: object
  *                 properties:
  *                   enabled:
  *                     type: boolean
  *                     example: true
  *                   rainExtraPay:
  *                     type: number
  *                     example: 15
  *                   multiplier:
  *                     type: number
  *                     example: 1.1
  *
  *               notes:
  *                 type: string
  *                 example: Pincode level payout config
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
  *       201:
  *         description: Pincode payout config created successfully
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
  *                   description: Returns exact request body
  *
  *       400:
  *         description: Validation error or duplicate config
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
  *                   example: Pincode config already exists
  *
  *       500:
  *         description: Server error
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
  */
router.post("/admin/payout-config/pincode", controller.createPincodePayoutConfig);

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
 * /api/admin/base-pay:
 *   patch:
 *     summary: Update only base pay of an existing payout config
 *     tags: [Admin Payout Config]
 *     description: Updates only the basePay field without modifying any other configuration values.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - configId
 *               - basePay
 *             properties:
 *               configId:
 *                 type: string
 *                 example: cfg_124
 *               basePay:
 *                 type: number
 *                 example: 40
 *               reason:
 *                 type: string
 *                 example: Increase due to demand
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
 *                 message:
 *                   type: string
 *                   example: Base pay updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     cityId:
 *                       type: string
 *                       example: city_124
 *                     updatedField:
 *                       type: string
 *                       example: basePay
 *                     oldValue:
 *                       type: number
 *                       example: 35
 *                     newValue:
 *                       type: number
 *                       example: 40
 *                     reason:
 *                       type: string
 *                       example: Increase due to demand
 *
 *       400:
 *         description: Bad request (missing fields)
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
 *                   example: configId and basePay are required
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
 *                   example: Config not found
 *
 *       500:
 *         description: Internal server error
 */

router.patch("/admin/base-pay",controller.updateBasePay)


/**
 * @swagger
 * /api/admin/distance-pay:
 *   patch:
 *     summary: Update distance pay (per km rate) only
 *     tags: [Admin Payout Config]
 *
 *     description: >
 *       Updates only the perKmRate for a payout configuration.
 *       Other payout settings remain unchanged. Requires configId.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cityId
 *               - perKmRate
 *             properties:
 *               cityId:
 *                 type: string
 *                 example: cfg_125
 *               perKmRate:
 *                 type: number
 *                 example: 7
 *
 *     responses:
 *       200:
 *         description: Distance pay updated successfully
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
 *                   example: Distance pay updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     configId:
 *                       type: string
 *                       example: cfg_125
 *                     version:
 *                       type: integer
 *                       example: 5
 *                     updatedField:
 *                       type: string
 *                       example: perKmRate
 *                     oldValue:
 *                       type: number
 *                       example: 6
 *                     newValue:
 *                       type: number
 *                       example: 7
 *
 *       400:
 *         description: Validation error (missing or invalid input)
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
 *                   example: configId and perKmRate are required
 *
 *       403:
 *         description: Inactive configuration update blocked
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
 *                   example: Cannot update inactive payout config
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
 
router.patch("/admin/distance-pay",controller.updateDistancePay)

/**
 * @swagger
 * /api/admin/surge:
 *   patch:
 *     summary: Update surge configuration only
 *     tags: [Admin Payout Config]
 *
 *     description: >
 *       Updates only the surgeConfig field (enabled, multiplier, minDemand)
 *       for an existing active payout configuration. Other fields remain unchanged.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cityId
 *               - surgeConfig
 *             properties:
 *               cityId:
 *                 type: string
 *                 example: city_001
 *               surgeConfig:
 *                 type: object
 *                 required:
 *                   - enabled
 *                   - multiplier
 *                   - minDemand
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: true
 *                   multiplier:
 *                     type: number
 *                     example: 2.0
 *                   minDemand:
 *                     type: number
 *                     example: 60
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
 *                 message:
 *                   type: string
 *                   example: Surge config updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     configId:
 *                       type: string
 *                       example: cfg_126
 *                     version:
 *                       type: integer
 *                       example: 6
 *                     updatedField:
 *                       type: string
 *                       example: surgeConfig
 *
 *       400:
 *         description: Missing required fields (cityId or surgeConfig)
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
 *                   example: cityId and surgeConfig are required
 *
 *       404:
 *         description: Payout config not found for this city
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
 *                   example: Payout config not found for this city
 *
 *       500:
 *         description: Internal server error
 */ 

router.patch("/admin/surge",controller.updateSurgeConfig)

/**
 * @swagger
 * /api/admin/{id}/rollback:
 *   post:
 *     summary: Rollback payout config
 *     tags: [Admin Payout Config]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: cfg_122
 *     responses:
 *       200:
 *         description: Rollback successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Rollback successful
 *               data:
 *                 configId: cfg_122
 *                 version: 2
 *                 isActive: true
 *                 rolledBackAt: 2026-05-05T11:00:00Z
 */
router.post("/admin/:id/rollback", controller.rollbackPayoutConfig);

/**
 * @swagger
 * /api/admin/{id}/status:
 *   patch:
 *     summary: Toggle payout config status
 *     tags: [Admin Payout Config]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: cfg_123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Cannot deactivate only active config
 */
router.patch("/admin/:id/status", controller.togglePayoutConfigStatus);

/**
 * @swagger
 * /api/rider/payout/surge-status:
 *   get:
 *     summary: Get rider surge status
 *     tags: [Surge]
 *     description: Fetches current surge status based on authenticated rider location
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Surge status fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 isSurgeActive: true
 *                 scenarioType: HIGH_DEMAND
 *                 multiplier: 1.8
 *                 minDemand: 50
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Unauthorized
 *
 *       404:
 *         description: No active config found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: No active config found
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 */


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