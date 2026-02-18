const express = require("express");
const router = express.Router();
const {riderAuthMiddleWare} = require("../middleware/riderAuthMiddleware");
const {
  raiseAssetIssue,
} = require("../controllers/riderAssetsController");


/**
 * @swagger
 * /api/rider/assets/issues:
 *   post:
 *     summary: Raise an issue for rider assets
 *     tags: [Rider Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assets
 *             properties:
 *               issueType:
 *                 type: string
 *                 enum: [DAMAGED, LOST, WRONG_SIZE, OTHER]
 *                 example: DAMAGED
 *               description:
 *                 type: string
 *                 example: Helmet inner padding is torn
 *               assets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - assetType
 *                     - assetName
 *                   properties:
 *                     assetType:
 *                       type: string
 *                       enum: [T_SHIRT, BAG, HELMET, JACKET, ID_CARD, OTHER]
 *                       example: HELMET
 *                     assetName:
 *                       type: string
 *                       example: Steelbird Helmet
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
 *                   example: Issue raised successfully
 *       400:
 *         description: Issue already raised or validation error
 *       401:
 *         description: Unauthorized
 */

router.post("/issues", riderAuthMiddleWare, raiseAssetIssue);


module.exports = router;
