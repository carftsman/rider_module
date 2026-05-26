const express = require("express");
const router = express.Router();
const { getBestRoute, getRiderLiveLocation, getOrderLiveTracking } = require("../controllers/gpsController");
const { adminAuthMiddleware } = require("../middleware/adminAuthMiddleware");
const { allowRoles } = require("../middleware/allowRolesMiddleware");
 
router.post("/best", getBestRoute);

/**
 * @swagger
 * /api/aerial/rider-live-location/{deliveryId}:
 *   get:
 *     tags:
 *       - Rider Live 
 *     security:
 *       - bearerAuth: []
 *
 *     summary: Get rider live GPS location using deliveryId
 *
 *     description: >
 *       Fetches rider live latitude and longitude
 *       using deliveryId.
 *
 *       Flow:
 *       - Find order using deliveryId
 *       - Get assigned rider
 *       - Fetch rider GPS coordinates
 *       - Return live location response
 *
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *         example: DEL567
 *
 *     responses:
 *
 *       200:
 *         description: Rider live location fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 delivery_id:
 *                   type: string
 *                   example: DEL567
 *
 *                 lat:
 *                   type: number
 *                   example: 17.446
 *
 *                 lng:
 *                   type: number
 *                   example: 78.401
 *
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-03-18T10:05:00Z
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: deliveryId is required
 *
 *       404:
 *         description: Data not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *
 *                   examples:
 *
 *                     orderNotFound:
 *                       value: Order not found
 *
 *                     riderNotAssigned:
 *                       value: Rider not assigned yet
 *
 *                     gpsNotFound:
 *                       value: Rider GPS not found
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *
 *                 error:
 *                   type: string
 */


router.get(
  "/rider-live-location/:deliveryId",
  adminAuthMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getRiderLiveLocation
);

/**
 * @swagger
 * /api/aerial/orders/{orderId}/live-tracking:
 *   get:
 *     tags:
 *       - Order Live Tracking
 *     security:
 *       - bearerAuth: []
 *
 *     summary: Get rider live tracking using orderId
 *
 *     description: >
 *       Fetches rider live GPS location and delivery event
 *       using orderId.
 *
 *       Flow:
 *       - Find order using orderId
 *       - Get assigned rider
 *       - Fetch rider GPS coordinates
 *       - Return live tracking details with delivery event
 *
 *       Supported Events:
 *       - SEARCHING_FOR_RIDER
 *       - RIDER_EN_ROUTE_TO_PICKUP
 *       - RIDER_ARRIVED_AT_PICKUP
 *       - ORDER_PICKED_UP
 *       - IN_TRANSIT
 *       - RIDER_ARRIVED_AT_DROP
 *       - DELIVERED
 *       - DELIVERY_FAILED
 *
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD12345
 *
 *     responses:
 *
 *       200:
 *         description: Live tracking fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 data:
 *                   type: object
 *
 *                   properties:
 *
 *                     event:
 *                       type: string
 *                       example: RIDER_EN_ROUTE_TO_PICKUP
 *                       enum:
 *                         - SEARCHING_FOR_RIDER
 *                         - RIDER_EN_ROUTE_TO_PICKUP
 *                         - RIDER_ARRIVED_AT_PICKUP
 *                         - ORDER_PICKED_UP
 *                         - IN_TRANSIT
 *                         - RIDER_ARRIVED_AT_DROP
 *                         - DELIVERED
 *                         - DELIVERY_FAILED
 *
 *                     deliveryId:
 *                       type: string
 *                       example: DEL567
 *
 *                     referenceOrderId:
 *                       type: string
 *                       example: ORD12345
 *
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-05-18T13:30:00Z
 *
 *                     rider:
 *                       type: object
 *
 *                       properties:
 *
 *                         id:
 *                           type: string
 *                           example: RDR-1
 *
 *                         name:
 *                           type: string
 *                           example: Rider One
 *
 *                         phone:
 *                           type: string
 *                           example: "9000000000"
 *
 *                         vehicleType:
 *                           type: string
 *                           example: BIKE
 *
 *                     geoCoordinates:
 *                       type: object
 *
 *                       properties:
 *
 *                         lat:
 *                           type: number
 *                           example: 17.446
 *
 *                         lng:
 *                           type: number
 *                           example: 78.401
 *
 *                         accuracy:
 *                           type: number
 *                           example: 10
 *
 *                         heading:
 *                           type: number
 *                           example: 120
 *
 *                         speed:
 *                           type: number
 *                           example: 25
 *
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2026-05-18T13:29:00Z
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: orderId is required
 *
 *       404:
 *         description: Data not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *
 *                   examples:
 *                     orderNotFound:
 *                       value: Order not found
 *
 *                     riderNotAssigned:
 *                       value: Rider not assigned yet
 *
 *                     gpsNotFound:
 *                       value: Rider GPS not found
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *
 *                 error:
 *                   type: string
 */

router.get(
  "/orders/:orderId/live-tracking",
  adminAuthMiddleware,
  allowRoles("ADMIN","SUPER_ADMIN"),
  getOrderLiveTracking
);
 
module.exports = router;