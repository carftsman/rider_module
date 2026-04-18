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
 * /api/kit/rider/joining-kit:
 *   post:
 *     summary: Request rider joining kit
 *     description: |
 *       Rider requests complete joining kit items (T_SHIRT, BAG, HELMET, JACKET, ID_CARD).
 *       Rider must choose delivery mode:
 *       - HOME_DELIVERY → requires name, completeAddress, pincode
 *       - PICKUP → requires pickupLocationId
 *
 *       Free items are moved to READY_FOR_DISPATCH.
 *       Paid items are moved to PAYMENT_PENDING.
 *
 *     tags:
 *       - Rider Kit
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - deliveryMode
 *                   - name
 *                   - completeAddress
 *                   - pincode
 *                 properties:
 *                   deliveryMode:
 *                     type: string
 *                     enum: [HOME_DELIVERY]
 *                     example: HOME_DELIVERY
 *                   name:
 *                     type: string
 *                     example: Ravi Kumar
 *                   completeAddress:
 *                     type: string
 *                     example: H.No 1-23, Madhapur, Hyderabad, Telangana
 *                   pincode:
 *                     type: string
 *                     example: "500081"
 *
 *               - type: object
 *                 required:
 *                   - deliveryMode
 *                   - pickupLocationId
 *                 properties:
 *                   deliveryMode:
 *                     type: string
 *                     enum: [PICKUP]
 *                     example: PICKUP
 *                   pickupLocationId:
 *                     type: string
 *                     example: pickup_loc_001
 *
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
 *                         example: 2e70c3ad-fcbd-49b3-9c3c-b876854a4e91
 *                       riderId:
 *                         type: string
 *                         example: ed9797f0-30a0-4bd5-838d-9eb42a95d842
 *                       assetType:
 *                         type: string
 *                         example: T_SHIRT
 *                       quantity:
 *                         type: integer
 *                         example: 1
 *                       status:
 *                         type: string
 *                         example: READY_FOR_DISPATCH
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       deliveryDetails:
 *                         type: object
 *                         example:
 *                           deliveryMode: HOME_DELIVERY
 *                           name: Ravi Kumar
 *                           completeAddress: H.No 1-23, Madhapur, Hyderabad
 *                           pincode: "500081"
 *                       price:
 *                         type: number
 *                         example: 0
 *                       isFree:
 *                         type: boolean
 *                         example: true
 *
 *       400:
 *         description: Validation error / duplicate request
 *         content:
 *           application/json:
 *             examples:
 *               missingDeliveryMode:
 *                 value:
 *                   success: false
 *                   message: deliveryMode is required
 *
 *               invalidDeliveryMode:
 *                 value:
 *                   success: false
 *                   message: Invalid deliveryMode
 *
 *               missingHomeDeliveryFields:
 *                 value:
 *                   success: false
 *                   message: name, completeAddress and pincode required for HOME_DELIVERY
 *
 *               missingPickupLocation:
 *                 value:
 *                   success: false
 *                   message: pickupLocationId required for PICKUP
 *
 *               alreadyRequested:
 *                 value:
 *                   success: false
 *                   message: Joining kit already requested
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Unauthorized
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Something went wrong
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
 * /api/kit/payment:
 *   post:
 *     tags:
 *       - Rider Assets
 *     summary: Make payment for an asset request
 *     description: Rider can make payment (full or EMI) for their pending asset requests. After payment, request status is updated to READY_FOR_DISPATCH.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMode
 *               - paymentType
 *             properties:
 *               paymentMode:
 *                 type: string
 *                 enum: [ONLINE, OFFLINE]
 *                 example: "ONLINE"
 *               paymentType:
 *                 type: string
 *                 enum: [FULL, EMI]
 *                 example: "EMI"
 *               months:
 *                 type: integer
 *                 description: Required only if paymentType is EMI
 *                 example: 3
 *     responses:
 *       200:
 *         description: Payment successful
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
 *                   example: "Payment successful. Waiting for admin dispatch"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "payment-uuid-1234"
 *                     assetRequestId:
 *                       type: string
 *                       format: uuid
 *                       example: "request-uuid-5678"
 *                     amount:
 *                       type: number
 *                       example: 499
 *                     paymentMode:
 *                       type: string
 *                       example: "ONLINE"
 *                     paymentType:
 *                       type: string
 *                       example: "EMI"
 *                     status:
 *                       type: string
 *                       enum: [PENDING, SUCCESS, FAILED]
 *                       example: "SUCCESS"
 *                     transactionId:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "2026-02-23T10:45:00.000Z"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-23T10:44:00.000Z"
 *       400:
 *         description: Bad request - missing required fields or payment already done
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
 *                   example: "paymentMode and paymentType are required"
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
 *         description: No pending payment request found or asset not found
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
 *                   example: "No payment pending request found"
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
 *                   example: "Payment failed"
 *                 error:
 *                   type: string
 *                   example: "Detailed error message"
 */
router.post('/payment/:requestId ',riderAuthMiddleWare, makePayment)

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
router.post('/asset/mark-delivered', markAsDelivered)
router.post('/admin/dispatch/:assetRequestIds', dispatchAsset)
router.post('/admin/approve/:riderId', approveRequest)
module.exports = router