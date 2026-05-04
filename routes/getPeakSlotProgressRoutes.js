const express = require("express");
const router = express.Router();
const {
  getPeakSlotProgress
} = require("../controllers/getPeakSlotProgressController");


const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /rider/peak-progress:
 *   get:
 *     summary: Get rider peak slot progress
 *     tags: [Rider Peak Progress]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Successfully fetched rider peak slot progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slotId:
 *                         type: string
 *                         example: slot_1
 *                       time:
 *                         type: string
 *                         example: "18:00 - 21:00"
 *                       ordersCompleted:
 *                         type: number
 *                         example: 3
 *                       reward:
 *                         type: number
 *                         example: 60
 *                       status:
 *                         type: string
 *                         example: IN_PROGRESS
 *
 *       401:
 *         description: Unauthorized
 *
 *       500:
 *         description: Server error
 */



router.get(
  "/peak-progress",
  riderAuthMiddleWare,
  getPeakSlotProgress
);



module.exports = router;
