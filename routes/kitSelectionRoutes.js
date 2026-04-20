const router = require('express').Router()
const{createAsset,
    viewAssets,
    requestAsset,
    approveRequest,
    makePayment,
    dispatchAsset,
    raiseIssue,
    markAsDelivered,
    requestJoiningKit

}=require('../controllers/kitSelectionController');
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
const upload = require("../middleware/uploadSelfie");

/**
 * @swagger
 * /api/kit/payment/{id}:
 *   post:
 *     summary: Select payment option for asset request
 *     description: >
 *       Allows an authenticated rider to select a payment mode for a specific asset request.
 *       If the asset request is already free and in READY_FOR_DISPATCH status, payment is not required.
 *       For ONLINE payment mode, rider must choose either FULL_PAYMENT or EMI.
 *       If EMI is selected, emiMonths must be one of 3, 6, 9, or 12.
 *     tags:
 *       - Rider Payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Asset request ID
 *         schema:
 *           type: string
 *           example: 8c1a92e1-8b7a-4c5b-b24f-8d8428a8d0c1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMode
 *             properties:
 *               paymentMode:
 *                 type: string
 *                 enum: [ONLINE, OFFLINE]
 *                 example: ONLINE
 *               paymentType:
 *                 type: string
 *                 enum: [FULL_PAYMENT, EMI]
 *                 example: EMI
 *               emiMonths:
 *                 type: integer
 *                 enum: [3, 6, 9, 12]
 *                 example: 6
 *           examples:
 *             offlinePayment:
 *               summary: Offline payment selection
 *               value:
 *                 paymentMode: OFFLINE
 *             fullOnlinePayment:
 *               summary: Online full payment
 *               value:
 *                 paymentMode: ONLINE
 *                 paymentType: FULL_PAYMENT
 *             emiPayment:
 *               summary: Online EMI payment
 *               value:
 *                 paymentMode: ONLINE
 *                 paymentType: EMI
 *                 emiMonths: 6
 *     responses:
 *       200:
 *         description: Payment option selected successfully or payment not required
 *         content:
 *           application/json:
 *             examples:
 *               successResponse:
 *                 summary: Payment option selected successfully
 *                 value:
 *                   success: true
 *                   message: Payment option selected successfully
 *                   data:
 *                     id: 8c1a92e1-8b7a-4c5b-b24f-8d8428a8d0c1
 *                     riderId: 55b7f9e4-21a8-4c6d-bef7-7d9c9a11d333
 *                     assetType: HELMET
 *                     quantity: 1
 *                     status: PAYMENT_PENDING
 *                     paymentMode: ONLINE
 *                     paymentType: EMI
 *                     emiMonths: 6
 *                     createdAt: 2026-04-20T11:30:00.000Z
 *               freeAssetResponse:
 *                 summary: Asset already free
 *                 value:
 *                   success: true
 *                   message: This asset is already free and ready for dispatch
 *                   data:
 *                     id: 8c1a92e1-8b7a-4c5b-b24f-8d8428a8d0c1
 *                     riderId: 55b7f9e4-21a8-4c6d-bef7-7d9c9a11d333
 *                     assetType: HELMET
 *                     quantity: 1
 *                     status: READY_FOR_DISPATCH
 *                     createdAt: 2026-04-20T11:30:00.000Z
 *       400:
 *         description: Validation error or invalid request state
 *         content:
 *           application/json:
 *             examples:
 *               missingId:
 *                 summary: Missing id param
 *                 value:
 *                   success: false
 *                   message: id is required in params
 *               missingPaymentMode:
 *                 summary: Missing payment mode
 *                 value:
 *                   success: false
 *                   message: paymentMode is required
 *               invalidPaymentMode:
 *                 summary: Invalid payment mode
 *                 value:
 *                   success: false
 *                   message: "Invalid paymentMode. Allowed: ONLINE, OFFLINE"
 *               missingPaymentType:
 *                 summary: Missing payment type for online mode
 *                 value:
 *                   success: false
 *                   message: paymentType is required when paymentMode is ONLINE
 *               invalidPaymentType:
 *                 summary: Invalid payment type
 *                 value:
 *                   success: false
 *                   message: "Invalid paymentType. Allowed: FULL_PAYMENT, EMI"
 *               missingEmiMonths:
 *                 summary: Missing EMI months
 *                 value:
 *                   success: false
 *                   message: emiMonths is required when paymentType is EMI
 *               invalidEmiMonths:
 *                 summary: Invalid EMI months
 *                 value:
 *                   success: false
 *                   message: "Invalid emiMonths. Allowed: 3, 6, 9, 12"
 *               invalidStatus:
 *                 summary: Payment selection not allowed for current status
 *                 value:
 *                   success: false
 *                   message: Payment selection not allowed for status DISPATCHED
 *       401:
 *         description: Unauthorized
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
 *                   example: Unauthorized
 *       404:
 *         description: Asset request not found
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
 *                   example: Asset request not found
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
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/payment/:id', riderAuthMiddleWare, makePayment);



/**
 * @swagger
 * /api/kit/rider/joining-kit:
 *   post:
 *     summary: Request joining kit for rider
 *     description: >
 *       Allows an authenticated rider to request a joining kit.
 *       Rider must choose either HOME_DELIVERY or PICKUP.
 *       For HOME_DELIVERY, name, completeAddress, and pincode are required.
 *       For PICKUP, pickupLocationId is required.
 *       If the first free-limit stock is available for a kit item, that item is marked as READY_FOR_DISPATCH,
 *       otherwise it is marked as PAYMENT_PENDING.
 *     tags:
 *       - Rider Kit
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryMode
 *             properties:
 *               deliveryMode:
 *                 type: string
 *                 enum: [HOME_DELIVERY, PICKUP]
 *                 example: HOME_DELIVERY
 *               name:
 *                 type: string
 *                 example: Vaishnavi Kuruba
 *               completeAddress:
 *                 type: string
 *                 example: H.No 1-23, Madhapur, Hyderabad, Telangana
 *               pincode:
 *                 type: string
 *                 example: "500081"
 *               pickupLocationId:
 *                 type: string
 *                 example: 2e9f5b1d-ef43-4d65-9b65-0b43e7d18d55
 *           examples:
 *             homeDelivery:
 *               summary: Home delivery request
 *               value:
 *                 deliveryMode: HOME_DELIVERY
 *                 name: Vaishnavi Kuruba
 *                 completeAddress: H.No 1-23, Madhapur, Hyderabad, Telangana
 *                 pincode: "500081"
 *             pickup:
 *               summary: Pickup request
 *               value:
 *                 deliveryMode: PICKUP
 *                 pickupLocationId: 2e9f5b1d-ef43-4d65-9b65-0b43e7d18d55
 *     responses:
 *       201:
 *         description: Joining kit requested successfully
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
 *                   example: Joining kit requested successfully
 *                 totalItems:
 *                   type: integer
 *                   example: 5
 *                 totalPrice:
 *                   type: number
 *                   example: 0
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 8c1a92e1-8b7a-4c5b-b24f-8d8428a8d0c1
 *                       riderId:
 *                         type: string
 *                         example: 55b7f9e4-21a8-4c6d-bef7-7d9c9a11d333
 *                       assetType:
 *                         type: string
 *                         enum: [T_SHIRT, BAG, HELMET, JACKET, ID_CARD]
 *                         example: T_SHIRT
 *                       quantity:
 *                         type: integer
 *                         example: 1
 *                       status:
 *                         type: string
 *                         enum: [READY_FOR_DISPATCH, PAYMENT_PENDING]
 *                         example: READY_FOR_DISPATCH
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-04-20T10:30:00.000Z
 *                       deliveryDetails:
 *                         type: object
 *                         description: Delivery or pickup details based on selected mode
 *                         properties:
 *                           deliveryMode:
 *                             type: string
 *                             enum: [HOME_DELIVERY, PICKUP]
 *                             example: HOME_DELIVERY
 *                           name:
 *                             type: string
 *                             example: Vaishnavi Kuruba
 *                           completeAddress:
 *                             type: string
 *                             example: H.No 1-23, Madhapur, Hyderabad, Telangana
 *                           pincode:
 *                             type: string
 *                             example: "500081"
 *                           pickupLocationId:
 *                             type: string
 *                             example: 2e9f5b1d-ef43-4d65-9b65-0b43e7d18d55
 *                       price:
 *                         type: number
 *                         example: 0
 *                       isFree:
 *                         type: boolean
 *                         example: true
 *       400:
 *         description: Validation error or joining kit already requested
 *         content:
 *           application/json:
 *             examples:
 *               missingDeliveryMode:
 *                 summary: deliveryMode missing
 *                 value:
 *                   success: false
 *                   message: deliveryMode is required
 *               invalidDeliveryMode:
 *                 summary: Invalid delivery mode
 *                 value:
 *                   success: false
 *                   message: Invalid deliveryMode
 *               missingHomeDeliveryFields:
 *                 summary: Missing home delivery fields
 *                 value:
 *                   success: false
 *                   message: name, completeAddress and pincode required for HOME_DELIVERY
 *               missingPickupLocation:
 *                 summary: Missing pickup location
 *                 value:
 *                   success: false
 *                   message: pickupLocationId required for PICKUP
 *               alreadyRequested:
 *                 summary: Kit already requested
 *                 value:
 *                   success: false
 *                   message: Joining kit already requested
 *       401:
 *         description: Unauthorized
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
 *                   example: Unauthorized
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
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/rider/joining-kit", riderAuthMiddleWare, requestJoiningKit);
router.post('/admin/assets', createAsset)
/**
 * @swagger
 * api/kit/rider/assets:
 *   get:
 *     tags:
 *       - Rider Assets
 *     summary: Get all assets issued to the logged-in rider
 *     description: Returns the rider's assets along with quantity, free/paid status, issued and returned dates, and condition.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider assets fetched successfully
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
 *                   example: Rider assets fetched successfully
 *                 totalAssets:
 *                   type: integer
 *                   example: 3
 *                 freeAssetsCount:
 *                   type: integer
 *                   example: 2
 *                 paidAssetsCount:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "item-uuid-1234"
 *                       riderAssetsId:
 *                         type: string
 *                         format: uuid
 *                         example: "rider-assets-uuid"
 *                       assetType:
 *                         type: string
 *                         enum: [T_SHIRT, BAG, HELMET, JACKET, ID_CARD, OTHER]
 *                         example: "BAG"
 *                       assetName:
 *                         type: string
 *                         example: "Delivery Bag"
 *                       issuedDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-02-23T10:23:00.000Z"
 *                       returnedDate:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       status:
 *                         type: string
 *                         enum: [ISSUED, RETURNED, LOST]
 *                         example: "ISSUED"
 *                       condition:
 *                         type: string
 *                         enum: [GOOD, BAD]
 *                         example: "GOOD"
 *                       isFree:
 *                         type: boolean
 *                         example: true
 *                       quantity:
 *                         type: integer
 *                         example: 1
 *       401:
 *         description: Unauthorized - rider token missing or invalid
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
 *                   example: "Unauthorized"
 *       404:
 *         description: No assets issued to this rider
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
 *                   example: "No assets issued to this rider"
 *                 totalAssets:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   type: array
 *                   items: {}
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
 *                 message:
 *                   type: string
 *                   example: "Something went wrong while fetching rider assets"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */
router.get('/rider/assets',riderAuthMiddleWare, viewAssets)
/**
 * @swagger
 * api/kit/rider/request:
 *   post:
 *     tags:
 *       - Rider Assets
 *     summary: Request an asset
 *     description: Rider can request an asset. If the asset is within the free limit, status will be READY_FOR_DISPATCH; otherwise, PAYMENT_PENDING.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetType
 *               - quantity
 *             properties:
 *               assetType:
 *                 type: string
 *                 enum: [T_SHIRT, BAG, HELMET, JACKET, ID_CARD, OTHER]
 *                 example: "BAG"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Asset request created successfully
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
 *                   example: Asset request created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "1eecf7ae-d5d0-4d77-886f-eb96931c1e17"
 *                     riderId:
 *                       type: string
 *                       format: uuid
 *                       example: "rider-uuid-1234"
 *                     assetType:
 *                       type: string
 *                       example: "BAG"
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: string
 *                       enum: [PENDING, APPROVED, REJECTED, PAYMENT_PENDING, READY_FOR_DISPATCH, DISPATCHED, COMPLETED, CANCELLED]
 *                       example: "PAYMENT_PENDING"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-23T10:23:00.000Z"
 *                 price:
 *                   type: number
 *                   example: 0
 *                 isFree:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - missing assetType or quantity
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
 *                   example: "assetType and quantity are required"
 *       401:
 *         description: Unauthorized - invalid or missing rider token
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
 *                   example: "Unauthorized"
 *       404:
 *         description: Asset not found
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
 *                   example: "Asset not found"
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
 *                 message:
 *                   type: string
 *                   example: "Something went wrong"
 *                 error:
 *                   type: string
 *                   example: "Detailed error message"
 */
router.post('/rider/request',riderAuthMiddleWare, requestAsset)
// router.post('/admin/approve', approveRequest)

/**
 * @swagger
 * /api/kit/rider/issue:
 *   post:
 *     tags:
 *       - Rider Assets
 *     summary: Raise an issue for an issued asset
 *     description: Rider can raise an issue (damaged, lost, wrong size, or other) for their issued assets.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - riderAssetsId
 *               - assetType
 *               - description
 *             properties:
 *               riderAssetsId:
 *                 type: string
 *                 format: uuid
 *                 example: "rider-assets-uuid-1234"
 *               assetType:
 *                 type: string
 *                 enum: [T_SHIRT, BAG, HELMET, JACKET, ID_CARD, OTHER]
 *                 example: "BAG"
 *               description:
 *                 type: string
 *                 example: "The bag strap is broken"
 *               issueType:
 *                 type: string
 *                 enum: [DAMAGED, LOST, WRONG_SIZE, OTHER]
 *                 example: "DAMAGED"
 *               imageUrl:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file upload for the issue
 *     responses:
 *       201:
 *         description: Issue raised successfully
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
 *                   example: "Issue raised successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "issue-uuid-5678"
 *                     riderAssetsId:
 *                       type: string
 *                       format: uuid
 *                       example: "rider-assets-uuid-1234"
 *                     assetType:
 *                       type: string
 *                       example: "BAG"
 *                     description:
 *                       type: string
 *                       example: "The bag strap is broken"
 *                     imageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: "/uploads/issues/bag123.jpg"
 *                     issueType:
 *                       type: string
 *                       example: "DAMAGED"
 *                     status:
 *                       type: string
 *                       enum: [OPEN, IN_PROGRESS, RESOLVED]
 *                       example: "OPEN"
 *                     raisedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-23T11:10:00.000Z"
 *                     resolvedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Bad request - missing required fields
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
 *                   example: "riderAssetsId, assetType and description are required"
 *       401:
 *         description: Unauthorized - invalid or missing rider token
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
 *                   example: "Unauthorized - Invalid token"
 *       403:
 *         description: Rider is not allowed to raise issue for this asset
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
 *                   example: "You are not allowed to raise issue for this asset"
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
 *                 message:
 *                   type: string
 *                   example: "Something went wrong while raising issue"
 *                 error:
 *                   type: string
 *                   example: "Detailed error message"
 */
router.post('/rider/issue',riderAuthMiddleWare,upload.single("image"), raiseIssue)
/**
 * @swagger
 * /api/kit/asset/mark-delivered/{shipmentId}:
 *   patch:
 *     summary: Mark shipment as delivered
 *     description: >
 *       Marks a shipment as DELIVERED, sets deliveredDate,
 *       updates linked asset request status to COMPLETED,
 *       and updates rider asset items.
 *     tags:
 *       - Admin Shipment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         description: Shipment ID
 *         schema:
 *           type: string
 *           example: ship_001
 *     responses:
 *       200:
 *         description: Shipment marked as delivered successfully
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
 *                   example: Shipment marked as delivered and rider assets updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: ship_001
 *                     assetRequestId:
 *                       type: string
 *                       example: req_001
 *                     courierName:
 *                       type: string
 *                       example: Delhivery
 *                     trackingId:
 *                       type: string
 *                       example: TRK123456789
 *                     dispatchDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-04-20T09:30:00.000Z
 *                     deliveredDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-04-22T14:15:00.000Z
 *                     deliveryStatus:
 *                       type: string
 *                       example: DELIVERED
 *       400:
 *         description: Validation error or shipment already delivered
 *         content:
 *           application/json:
 *             examples:
 *               missingShipmentId:
 *                 summary: shipmentId missing
 *                 value:
 *                   success: false
 *                   message: shipmentId is required
 *               alreadyDelivered:
 *                 summary: Already delivered
 *                 value:
 *                   success: false
 *                   message: Shipment already marked as delivered
 *       404:
 *         description: Shipment not found
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
 *                   example: Shipment not found
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
 *                 message:
 *                   type: string
 *                   example: Failed to update delivery
 */
router.post('/asset/mark-delivered/:shipmentId', markAsDelivered)
/**
 * @swagger
 * /api/kit/admin/dispatch/{assetRequestIds}:
 *   post:
 *     summary: Dispatch asset requests
 *     description: >
 *       Dispatch one or multiple asset requests by passing comma-separated assetRequestIds in path params.
 *       Only asset requests with READY_FOR_DISPATCH status can be dispatched.
 *       A shipment record is created for each asset request, and the request status is updated to DISPATCHED.
 *     tags:
 *       - Admin Asset
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetRequestIds
 *         required: true
 *         description: Comma-separated asset request IDs
 *         schema:
 *           type: string
 *           example: req_001,req_002,req_003
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courierName
 *               - trackingId
 *             properties:
 *               courierName:
 *                 type: string
 *                 example: Delhivery
 *               trackingId:
 *                 type: string
 *                 example: TRK123456789
 *           example:
 *             courierName: Delhivery
 *             trackingId: TRK123456789
 *     responses:
 *       200:
 *         description: Assets dispatched successfully
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
 *                   example: Assets dispatched successfully
 *                 totalDispatched:
 *                   type: integer
 *                   example: 2
 *                 assetRequestIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - req_001
 *                     - req_002
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: ship_001
 *                       assetRequestId:
 *                         type: string
 *                         example: req_001
 *                       courierName:
 *                         type: string
 *                         example: Delhivery
 *                       trackingId:
 *                         type: string
 *                         example: TRK123456789
 *                       dispatchDate:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-04-20T10:30:00.000Z
 *                       deliveryStatus:
 *                         type: string
 *                         example: SHIPPED
 *       400:
 *         description: Validation error or request not eligible for dispatch
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: assetRequestIds param, courierName and trackingId are required
 *               noValidIds:
 *                 summary: No valid IDs found
 *                 value:
 *                   success: false
 *                   message: No valid assetRequestIds found in params
 *               notReadyForDispatch:
 *                 summary: Some assets not ready
 *                 value:
 *                   success: false
 *                   message: Some assets are not ready for dispatch
 *                   invalidRequestIds:
 *                     - req_002
 *                   statuses:
 *                     - id: req_002
 *                       status: PAYMENT_PENDING
 *               shipmentExists:
 *                 summary: Shipment already exists
 *                 value:
 *                   success: false
 *                   message: Shipment already created for some requests
 *                   existingShipmentRequestIds:
 *                     - req_001
 *       404:
 *         description: Asset requests not found
 *         content:
 *           application/json:
 *             examples:
 *               noRequestsFound:
 *                 summary: No asset requests found
 *                 value:
 *                   success: false
 *                   message: No asset requests found
 *               someRequestsNotFound:
 *                 summary: Some asset requests were not found
 *                 value:
 *                   success: false
 *                   message: Some asset requests were not found
 *                   notFoundIds:
 *                     - req_003
 *                     - req_004
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
 *                 message:
 *                   type: string
 *                   example: Something went wrong while dispatching asset
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/admin/dispatch/:assetRequestIds', dispatchAsset)
router.post('/admin/approve/:riderId', approveRequest)
// router.post('/hi', (req,res)=> res.send("test"))



module.exports = router