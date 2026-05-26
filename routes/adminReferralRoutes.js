// routes/adminReferralRoutes.js

const express = require("express");

const router = express.Router();

const {

  createReferralProgram,
  getAllReferralConfigs,
  updateReferralConfigStatus,
  getAllReferrals,
  creditReferralReward,
  updateReferralConfig,
  getReferralProgramByRiderPincode
} = require("../controllers/adminReferralController");
const { adminAuthMiddleware } = require("../middleware/adminAuthMiddleware");
const { allowRoles } = require("../middleware/allowRolesMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Admin Referral Programs
 *     description: Referral incentive program management APIs
 *
 *   - name: Admin Referrals
 *     description: Referral reward and referral tracking APIs
 */


/**
 * @swagger
 * /api/admin/referral-programs:
 *   post:
 *     summary: Create referral incentive program
 *     tags: [Admin Referral Programs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - programType
 *               - trackingType
 *               - ruleType
 *               - rewardFlow
 *               - validFrom
 *               - validTill
 *             properties:
 *               name:
 *                 type: string
 *
 *               description:
 *                 type: string
 *
 *               programType:
 *                 type: string
 *                 example: REFERRAL
 *
 *               trackingType:
 *                 type: string
 *                 enum:
 *                   - DAILY
 *                   - WEEKLY
 *                   - MONTHLY
 *
 *               ruleType:
 *                 type: string
 *                 enum:
 *                   - FIXED_TARGET
 *                   - SLAB
 *                   - PER_ORDER
 *                   - HYBRID
 *                   - TASK
 *
 *               rewardFlow:
 *                 type: string
 *                 enum:
 *                   - BOTH
 *                   - REFEREE_ONLY
 *                   - REFERRER_ONLY
 *
 *               cityId:
 *                 type: array
 *                 items:
 *                   type: string
 *
 *               pincodeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *
 *               validTill:
 *                 type: string
 *                 format: date-time
 *
 *               priority:
 *                 type: integer
 *
 *               isActive:
 *                 type: boolean
 *
 *     responses:
 *       201:
 *         description: Referral program created successfully
 *
 *       400:
 *         description: Validation error
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/referral-programs",
  adminAuthMiddleware,
  allowRoles( "SUPER_ADMIN"), 
  createReferralProgram
);


/**
 * @swagger
 * /api/admin/referral-programs:
 *   get:
 *     summary: Get all referral programs
 *     tags: [Admin Referral Programs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral programs fetched successfully
 *
 *       500:
 *         description: Internal server error
 */
router.get(
  "/referral-programs",
  adminAuthMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"), 
  getAllReferralConfigs
);


/**
 * @swagger
 * /api/admin/referral-programs/{programId}:
 *   put:
 *     summary: Update referral incentive program
 *     tags: [Admin Referral Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *     responses:
 *       200:
 *         description: Referral program updated successfully
 *
 *       404:
 *         description: Program not found
 *
 *       500:
 *         description: Internal server error
 */
router.put(
  "/referral-programs/:programId",
  adminAuthMiddleware,
  allowRoles("SUPER_ADMIN"), 
  updateReferralConfig
);


/**
 * @swagger
 * /api/admin/referral-programs/{id}/status:
 *   patch:
 *     summary: Update referral program active status
 *     tags: [Admin Referral Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Referral Config ID
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *
 *     responses:
 *       200:
 *         description: Status updated successfully
 *
 *       404:
 *         description: Referral config not found
 *
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/referral-programs/:id/status",
  adminAuthMiddleware,
  allowRoles("SUPER_ADMIN"), 
  updateReferralConfigStatus
);


/**
 * @swagger
 * /api/admin/referral-programs/rider/{riderId}:
 *   get:
 *     summary: Get referral programs by rider pincode
 *     tags: [Admin Referral Programs]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: riderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Rider ID
 *
 *     responses:
 *       200:
 *         description: Referral programs fetched successfully
 *
 *       404:
 *         description: Rider not found
 *
 *       500:
 *         description: Internal server error
 */
router.get(
  "/referral-programs/rider/:riderId",
  adminAuthMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"), 
  getReferralProgramByRiderPincode
);


/**
 * @swagger
 * /api/admin/referrals:
 *   get:
 *     summary: Get all referrals
 *     tags: [Admin Referrals]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter referrals by status
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Records per page
 *
 *     responses:
 *       200:
 *         description: Referrals fetched successfully
 *
 *       500:
 *         description: Internal server error
 */
router.get(
  "/referrals",
  adminAuthMiddleware,
  allowRoles("ADMIN", "SUPER_ADMIN"), 
  getAllReferrals
);


/**
 * @swagger
 * /api/admin/referrals/{id}/credit:
 *   post:
 *     summary: Credit referral reward
 *     tags: [Admin Referrals]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Referral ID
 *
 *     responses:
 *       200:
 *         description: Referral reward credited successfully
 *
 *       404:
 *         description: Referral record not found
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/referrals/:id/credit",
  adminAuthMiddleware,
  allowRoles("SUPER_ADMIN"), 
  creditReferralReward
);

module.exports = router;