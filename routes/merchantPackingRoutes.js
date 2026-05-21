const express = require("express");
const { merchantPackingApi } = require("../controllers/merchantPackingController");


const merchantRouter = express.Router();

/**
 * @swagger
 * /api/merchant/packing:
 *   post:
 *     tags:
 *       - Merchant Packing
 *     summary: Send merchant packed order to rider module
 *     description: >
 *       Sends merchant packed order details to the rider module API.
 *       
 *       Workflow:
 *       - Validates merchant packing payload
 *       - Calls rider order creation API
 *       - Generates delivery event automatically
 *       - Returns both API responses
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
 *                 example: ORD123456
 *
 *               storeId:
 *                 type: string
 *                 example: STORE789
 *
 *               vendorShopName:
 *                 type: string
 *                 example: Fresh Mart Grocery
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
 *                     example: Fresh Mart Grocery
 *
 *                   addressLine:
 *                     type: string
 *                     example: Madhapur, Hyderabad
 *
 *                   contactNumber:
 *                     type: string
 *                     example: 9876543210
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
 *                     example: Rohit Kumar
 *
 *                   addressLine:
 *                     type: string
 *                     example: Kukatpally, Hyderabad
 *
 *                   contactNumber:
 *                     type: string
 *                     example: 9123456780
 *
 *                   latitude:
 *                     type: number
 *                     example: 17.4948
 *
 *                   longitude:
 *                     type: number
 *                     example: 78.3996
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
 *                     items:
 *                       type: object
 *                       properties:
 *
 *                         itemName:
 *                           type: string
 *                           example: Rice Bag
 *
 *                         quantity:
 *                           type: number
 *                           example: 2
 *
 *                         price:
 *                           type: number
 *                           example: 500
 *
 *                   totalAmount:
 *                     type: number
 *                     example: 1000
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
 *
 *                     missingOrderId:
 *                       value: orderId is required
 *
 *                     missingStoreId:
 *                       value: storeId is required
 *
 *                     missingVendor:
 *                       value: vendorShopName is required
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
 *         description: Failed to call rider order API
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
