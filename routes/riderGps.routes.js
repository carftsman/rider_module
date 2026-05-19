const express = require("express");

const router = express.Router();

const {
  updateRiderGps,
} = require("../controllers/riderGps.controller");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /api/rider-gps/update-gps:
 *   put:
 *     summary: Update rider live GPS location
 *     tags:
 *       - Rider GPS
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isEnabled
 *
 *             properties:
 *               isEnabled:
 *                 type: boolean
 *                 example: true
 *
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 17.385044
 *
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 78.486671
 *
 *               accuracy:
 *                 type: number
 *                 format: float
 *                 example: 10
 *
 *               heading:
 *                 type: number
 *                 format: float
 *                 example: 90
 *
 *               speed:
 *                 type: number
 *                 format: float
 *                 example: 20
 *
 *     responses:
 *       200:
 *         description: Rider GPS updated successfully
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: GPS updated successfully
 *
 *                 data:
 *                   type: object
 *
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 8f8f5e1d-cf9f-4f42-bf75-96a70f2c44f8
 *
 *                     riderId:
 *                       type: string
 *                       example: rider_123
 *
 *                     isEnabled:
 *                       type: boolean
 *                       example: true
 *
 *                     latitude:
 *                       type: number
 *                       example: 17.385044
 *
 *                     longitude:
 *                       type: number
 *                       example: 78.486671
 *
 *                     accuracy:
 *                       type: number
 *                       example: 10
 *
 *                     heading:
 *                       type: number
 *                       example: 90
 *
 *                     speed:
 *                       type: number
 *                       example: 20
 *
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-05-18T11:00:00.000Z
 *
 *       400:
 *         description: Validation error
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Latitude and longitude are required
 *
 *       500:
 *         description: Internal server error
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.put(
  "/update-gps",
  riderAuthMiddleWare,
  updateRiderGps
);

module.exports = router;