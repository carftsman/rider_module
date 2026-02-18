const express = require("express");
const router = express.Router();

const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");

const {
  goOnline,
  goOffline
} = require("../controllers/riderStatus.controller");

// ----------------------
// Rider Status APIs
// ----------------------
/**
 * @swagger
 * /api/rider/status/online:
 *   patch:
 *     tags: [Rider Status]
 *     summary: Set Rider Online
 *     description: Marks rider as ONLINE and updates login timestamp. Blocks if account is suspended or KYC pending.
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Rider successfully set to ONLINE
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
 *                   example: Rider is now ONLINE
 *
 *                 # ✅ NEW FIELD
 *                 isPartnerActive:
 *                   type: boolean
 *                   example: true
 *
 *                 riderStatus:
 *                   type: object
 *                   properties:
 *                     isOnline:
 *                       type: boolean
 *                       example: true
 *                     lastLoginAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-02T08:30:00.000Z"
 *                     lastLogoutAt:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     totalOnlineMinutesToday:
 *                       type: number
 *                       example: 120
 *                 deliveryStatus:
 *                   type: object
 *                   properties:
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *
 *       400:
 *         description: Rider already online
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
 *                   example: Rider already online
 *
 *       403:
 *         description: Rider not allowed to go online (account suspended or KYC pending)
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
 *                   example: Rider is not allowed to go online
 *
 *       404:
 *         description: Rider not found
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
 *                   example: Rider not found
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
 *                   example: Server Error
 */

router.patch("/online", riderAuthMiddleWare, goOnline);
/**
 * @swagger
 * /api/rider/status/offline:
 *   patch:
 *     tags: [Rider Status]
 *     summary: Set Rider Offline
 *     description: Marks rider as OFFLINE, updates logout timestamp, calculates session minutes, and sets delivery inactive reason.
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for going offline
 *                 enum: [MANUAL_OFF, KYC_PENDING, ACCOUNT_SUSPENDED, OUT_OF_SERVICE_AREA, COD_LIMIT_EXCEEDED]
 *                 example: MANUAL_OFF
 *
 *     responses:
 *       200:
 *         description: Rider successfully set to OFFLINE
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
 *                   example: Rider is now OFFLINE
 *
 *                 # ✅ NEW FIELD
 *                 isPartnerActive:
 *                   type: boolean
 *                   example: false
 *
 *                 riderStatus:
 *                   type: object
 *                   properties:
 *                     isOnline:
 *                       type: boolean
 *                       example: false
 *                     lastLoginAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-02T08:30:00.000Z"
 *                     lastLogoutAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-02T12:45:00.000Z"
 *                     totalOnlineMinutesToday:
 *                       type: number
 *                       example: 135
 *                 deliveryStatus:
 *                   type: object
 *                   properties:
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *                     inactiveReason:
 *                       type: string
 *                       example: MANUAL_OFF
 *
 *       400:
 *         description: Invalid reason or rider already offline
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
 *                   example: Rider already offline
 *
 *       404:
 *         description: Rider not found
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
 *                   example: Rider not found
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
 *                   example: Server Error
 */

router.patch("/offline", riderAuthMiddleWare, goOffline);

module.exports = router;
