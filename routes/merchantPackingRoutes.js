const express = require("express");
const { merchantPackingApi } = require("../controllers/merchantPackingController");


const merchantRouter = express.Router();

/**
 * @swagger
 * /api/merchant/packing:
 *   post:
 *     tags:
 *       - Merchant Packing
 *     summary: Send merchant packing data to rider module
 *     description: >
 *       Sends merchant packing details to rider module API
 *       and creates delivery event automatically.
 *
 *       Flow:
 *       - Validate merchant packing payload
 *       - Call rider module create order API
 *       - Create delivery event
 *       - Return combined response
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - storeId
 *               - vendorShopName
 *               - pickupAddress
 *               - deliveryAddress
 *               - orderDetails
 *
 *             properties:
 *
 *               orderId:
 *                 type: string
 *                 example: ORD12352
 *
 *               storeId:
 *                 type: string
 *                 example: STORE456
 *
 *               vendorShopName:
 *                 type: string
 *                 example: KFC Madhapur
 *
 *               pickupAddress:
 *                 type: object
 *                 required:
 *                   - merchantName
 *                   - addressLine
 *                   - contactNumber
 *                   - latitude
 *                   - longitude
 *                   - pincode
 *
 *                 properties:
 *
 *                   merchantName:
 *                     type: string
 *                     example: KFC Madhapur
 *
 *                   addressLine:
 *                     type: string
 *                     example: Madhapur Main Road, Hyderabad
 *
 *                   contactNumber:
 *                     type: string
 *                     example: "9876543210"
 *
 *                   latitude:
 *                     type: number
 *                     example: 17.4483
 *
 *                   longitude:
 *                     type: number
 *                     example: 78.3915
 *
 *                   pincode:
 *                     type: string
 *                     example: "500081"
 *
 *               deliveryAddress:
 *                 type: object
 *                 required:
 *                   - name
 *                   - addressLine
 *                   - contactNumber
 *                   - latitude
 *                   - longitude
 *
 *                 properties:
 *
 *                   name:
 *                     type: string
 *                     example: Lakshmi Narayana
 *
 *                   addressLine:
 *                     type: string
 *                     example: Gachibowli Hyderabad
 *
 *                   contactNumber:
 *                     type: string
 *                     example: "9123456780"
 *
 *                   latitude:
 *                     type: number
 *                     example: 17.4401
 *
 *                   longitude:
 *                     type: number
 *                     example: 78.3489
 *
 *               orderDetails:
 *                 type: object
 *                 required:
 *                   - items
 *                   - totalAmount
 *                   - estimatedWeight
 *
 *                 properties:
 *
 *                   items:
 *                     type: array
 *
 *                     items:
 *                       type: object
 *                       required:
 *                         - name
 *                         - quantity
 *                         - price
 *
 *                       properties:
 *
 *                         name:
 *                           type: string
 *                           example: Rice 5kg
 *
 *                         quantity:
 *                           type: number
 *                           example: 2
 *
 *                         price:
 *                           type: number
 *                           example: 250
 *
 *                   totalAmount:
 *                     type: number
 *                     example: 620
 *
 *                   estimatedWeight:
 *                     type: number
 *                     example: 8.5
 *
 *     responses:
 *
 *       200:
 *         description: Merchant packing data sent successfully
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
 *                   example: Merchant packing data sent to rider module API successfully
 *
 *                 merchantPackingData:
 *                   type: object
 *
 *                 createOrderResponse:
 *                   type: object
 *
 *                 merchentResponse:
 *                   type: object
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
 *                     missingOrderId:
 *                       value: orderId is required
 *
 *                     missingStoreId:
 *                       value: storeId is required
 *
 *                     missingPickup:
 *                       value: pickupAddress is required
 *
 *                     missingDelivery:
 *                       value: deliveryAddress is required
 *
 *                     missingOrderDetails:
 *                       value: orderDetails is required
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
 *                   example: Failed to call create order API
 *
 *                 error:
 *                   type: object
 */

merchantRouter.post("/packing" , merchantPackingApi)


module.exports = merchantRouter;
