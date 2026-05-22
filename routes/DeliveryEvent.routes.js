const express = require("express");
const router = express.Router();
 
const {
    createDeliveryEvent,
    updateDeliveryEvent
} = require("../controllers/DeliveryEvent.controller");


/**
 * @swagger
 * /api/delivery-event:
 *   post:
 *     summary: Create Delivery Event
 *     tags: [Delivery Event]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - deliveryId
 *
 *             properties:
 *
 *               deliveryId:
 *                 type: string
 *                 example: DEL567
 *
 *     responses:
 *       201:
 *         description: Delivery event created successfully
 *
 *         content:
 *           application/json:
 *             examples:
 *
 *               success:
 *                 summary: Delivery Created
 *                 value:
 *                   success: true
 *                   message: Searching for rider
 *                   data:
 *                     id: "64f9b6f2-b123-4567-8910-abcdef123456"
 *                     event: "SEARCHING_FOR_RIDER"
 *                     deliveryId: "DEL567"
 *                     eventTime: "2026-05-20T10:30:00.000Z"
 *                     riderId: null
 *                     riderName: null
 *                     riderPhone: null
 *                     vehicle: null
 *                     latitude: null
 *                     longitude: null
 *                     createdAt: "2026-05-20T10:30:00.000Z"
 *                     updatedAt: "2026-05-20T10:30:00.000Z"
 *
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: deliveryId is required
 *
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 */
router.post(
    "/delivery-event",
    createDeliveryEvent
);

/**
 * @swagger
 * /api/delivery-event/{deliveryId}:
 *   patch:
 *     summary: Update Delivery Event
 *     tags: [Delivery Event]
 *
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *         example: DEL567
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             properties:
 *
 *               riderId:
 *                 type: string
 *                 example: rider_001
 *
 *               riderName:
 *                 type: string
 *                 example: Ramesh
 *
 *               riderPhone:
 *                 type: string
 *                 example: 9999999999
 *
 *               vehicle:
 *                 type: string
 *                 example: Bike
 *
 *               latitude:
 *                 type: number
 *                 example: 17.385
 *
 *               longitude:
 *                 type: number
 *                 example: 78.4867
 *
 *               orderId:
 *                 type: string
 *                 example: ORD123
 *
 *     responses:
 *       200:
 *         description: Delivery event updated successfully
 *
 *       404:
 *         description: Delivery event not found
 *
 *       500:
 *         description: Internal server error
 */

router.patch(
    "/delivery-event/:deliveryId",
    updateDeliveryEvent
);

module.exports = router;