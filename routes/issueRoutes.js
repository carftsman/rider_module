const express = require("express");
const issueRouter = express.Router();

const { reportIssue } = require("../controllers/issueController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /api/issues/report:
 *   post:
 *     tags: [Issues]
 *     summary: Rider reports an issue
 *     description: Allows rider to submit an issue such as customer not responding, wrong address, unsafe location etc.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               issueType:
 *                 type: string
 *                 enum: [
 *                   CUSTOMER_NOT_RESPONDING,
 *                   WRONG_ADDRESS,
 *                   UNSAFE_LOCATION,
 *                   STORE_DELAY,
 *                   ORDER_NOT_AVAILABLE,
 *                   PAYMENT_ISSUE,
 *                   OTHER
 *                 ]
 *                 example: CUSTOMER_NOT_RESPONDING
 *               notes:
 *                 type: string
 *                 example: "Customer not answering calls for 10 minutes"
 *               orderId:
 *                 type: string
 *                 example: "67a123abc9df0a0012345678"
 *               slotId:
 *                 type: string
 *                 example: "67a123bbc9df0a0098765432"
 *
 *     responses:
 *       200:
 *         description: Issue reported successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Issue reported successfully
 *               data:
 *                 _id: "67a23fbc9823b10012345678"
 *                 riderId: "67a111aaa111baa001234567"
 *                 issueType: "CUSTOMER_NOT_RESPONDING"
 *                 notes: "Customer not answering"
 *                 status: "OPEN"
 *                 createdAt: "2026-01-03T10:00:00.000Z"
 *
 *       400:
 *         description: Required fields missing
 *
 *       500:
 *         description: Server error
 */


issueRouter.post("/report", riderAuthMiddleWare, reportIssue);
module.exports = issueRouter;