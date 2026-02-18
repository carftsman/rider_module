const express = require('express');
const fcmRouter = express.Router();
const { saveFcmToken } = require('../controllers/fcmTokenController');
const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");


/**
 * @swagger
 * /api/rider/notifications/fcm-token:
 *   post:
 *     tags: [FCM]
 *     summary: Save FCM token for authenticated rider
 *     description: >
 *       Stores or updates the Firebase Cloud Messaging (FCM) token
 *       for the logged-in rider. This token is used to send push
 *       notifications such as slot booking, order assignment, etc.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 example: eU8sdfkJHsdjksd_1234567890abcdef
 *     responses:
 *       200:
 *         description: FCM token saved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: FCM token saved successfully
 *       400:
 *         description: Bad Request – Missing or invalid data
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: FCM token is required
 *       401:
 *         description: Unauthorized – Invalid or missing access token
 *         content:
 *           application/json:
 *             example:
 *               message: Unauthorized
 */



fcmRouter.post('/fcm-token', riderAuthMiddleWare, saveFcmToken);

module.exports = fcmRouter;