const express = require("express");
const router = express.Router();

const { selectRiderType } = require("../controllers/companySelectionController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
/**
 * @swagger
 * /api/company/rider/type:
 *   post:
 *     summary: Select rider type (Individual or Company)
 *     description: Allows a logged-in rider to choose their rider type and updates onboarding stage to APP_PERMISSIONS.
 *     tags:
 *       - Rider Onboarding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - riderType
 *             properties:
 *               riderType:
 *                 type: string
 *                 enum:
 *                   - INDIVIDUAL_EMPLOYEE
 *                   - COMPANY_EMPLOYEE
 *                 example: INDIVIDUAL_EMPLOYEE
 *     responses:
 *       200:
 *         description: Rider type selected successfully
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
 *                   example: Rider type selected successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "b3f1c2d4-5678-90ab-cdef-1234567890ab"
 *                     phoneNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     riderType:
 *                       type: string
 *                       example: INDIVIDUAL_EMPLOYEE
 *                     onboardingStage:
 *                       type: string
 *                       example: APP_PERMISSIONS
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             examples:
 *               missingRiderType:
 *                 value:
 *                   success: false
 *                   message: riderType is required
 *               invalidRiderType:
 *                 value:
 *                   success: false
 *                   message: 'Invalid riderType. Allowed values: INDIVIDUAL_EMPLOYEE, COMPANY_EMPLOYEE'
 *       404:
 *         description: Rider not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Rider not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 */
router.post("/rider/type", riderAuthMiddleWare, selectRiderType);

module.exports = router;