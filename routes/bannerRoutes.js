const express = require("express");
const router = express.Router();

const {getRiderHomeBanners} = require("../controllers/bannerController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /api/banner/home-banners:
 *   get:
 *     summary: Get rider home banners
 *     description: Returns dynamic banners for rider home screen based on bank status, kit delivery, and joining bonus progress.
 *     tags:
 *       - Home Banners
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home banners fetched successfully
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
 *                   example: Home banners fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     riderId:
 *                       type: string
 *                       example: "b2c1c9e4-1234-4f9a-8a1e-abc123456789"
 *                     checks:
 *                       type: object
 *                       properties:
 *                         bankAdded:
 *                           type: boolean
 *                           example: true
 *                         bankVerified:
 *                           type: boolean
 *                           example: false
 *                         kitDelivered:
 *                           type: boolean
 *                           example: true
 *                         joiningBonusCompleted:
 *                           type: boolean
 *                           example: false
 *                     banners:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             example: ADD_BANK_DETAILS
 *                           title:
 *                             type: string
 *                             example: Add Bank Details
 *                           description:
 *                             type: string
 *                             example: Add your bank details to receive payouts directly.
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           redirectTo:
 *                             type: string
 *                             example: BANK_DETAILS
 *                           isEnabled:
 *                             type: boolean
 *                             example: true
 *                           status:
 *                             type: string
 *                             example: PENDING
 *       401:
 *         description: Unauthorized rider
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
 *                   example: Unauthorized rider
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
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Something went wrong
 */
// ✅ Home banners (scrolling banners)
router.get(
  "/home-banners",
  riderAuthMiddleWare,
  getRiderHomeBanners
);

module.exports = router;