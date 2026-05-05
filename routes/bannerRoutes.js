const express = require("express");
const router = express.Router();

const {getRiderHomeBanners} = require("../controllers/bannerController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");

/**
 * @swagger
 * /api/banner/home-banners:
 *   get:
 *     summary: Get rider home banners (scrolling banners)
 *     tags:
 *       - Home Banners
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home banners fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Home banners fetched successfully
 *               data:
 *                 riderId: "123"
 *                 checks:
 *                   bankAdded: true
 *                   bankVerified: true
 *                   kitDelivered: true
 *                   joinedWithReferral: true
 *                   joiningBonusCompleted: false
 *                 banners:
 *                   - key: ADD_BANK_DETAILS
 *                     title: Add Bank Details
 *                     description: Add your bank details to receive payouts directly.
 *                     imageUrl: null
 *                     redirectTo: BANK_DETAILS
 *                     isEnabled: false
 *                     status: COMPLETED
 *                   - key: WELCOME_KIT
 *                     title: Welcome Kit
 *                     description: Get your joining kit and start delivering.
 *                     imageUrl: null
 *                     redirectTo: WELCOME_KIT
 *                     isEnabled: false
 *                     status: COMPLETED
 *                   - key: JOINING_BONUS
 *                     title: Joining Bonus
 *                     description: Complete your joining bonus tasks and earn rewards.
 *                     imageUrl: null
 *                     redirectTo: JOINING_BONUS
 *                     isEnabled: true
 *                     status: ACTIVE
 *                   - key: REFER_AND_EARN
 *                     title: Refer and Earn
 *                     description: Refer riders and earn rewards.
 *                     imageUrl: null
 *                     redirectTo: REFER_AND_EARN
 *                     isEnabled: true
 *                     status: ACTIVE
 *       401:
 *         description: Unauthorized rider
 *       404:
 *         description: Rider not found
 *       500:
 *         description: Internal server error
 */
// ✅ Home banners (scrolling banners)
router.get(
  "/home-banners",
  riderAuthMiddleWare,
  getRiderHomeBanners
);

module.exports = router;