const express = require("express");
const kitRouter = express.Router();
 
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
const {
  addKitAddress,
  getKitAddress,
} = require("../controllers/kitAddressController");
 
// Add / Update kit address
 
/**
 * @swagger
 * /api/rider/kit-address:
 *   post:
 *     tags: [Kit]
 *     summary: Add or update kit delivery address
 *     description: Saves kit delivery address (name, complete address, pincode) for the authenticated rider.
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
 *               - name
 *               - completeAddress
 *               - pincode
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Suji"
 *               completeAddress:
 *                 type: string
 *                 example: "Flat 203, Main Road, Near Metro Station"
 *               pincode:
 *                 type: string
 *                 example: "560001"
 *
 *     responses:
 *       200:
 *         description: Kit delivery address saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kit delivery address saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Suji"
 *                     completeAddress:
 *                       type: string
 *                       example: "Flat 203, Main Road, Near Metro Station"
 *                     pincode:
 *                       type: string
 *                       example: "560001"
 *
 *       400:
 *         description: Missing required fields
 *
 *       401:
 *         description: Unauthorized – invalid or missing token
 *
 *       404:
 *         description: Rider not found
 *
 *       500:
 *         description: Server error while saving kit address
 */
 
kitRouter.post(
  "/kit-address",
  riderAuthMiddleWare,
  addKitAddress
);
 
// Get kit address
 
/**
 * @swagger
 * /api/rider/kit-address:
 *   get:
 *     tags: [Kit]
 *     summary: Get kit delivery address
 *     description: Fetches the kit delivery address of the authenticated rider.
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Kit delivery address fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kit delivery address fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Suji"
 *                     completeAddress:
 *                       type: string
 *                       example: "Flat 203, Main Road, Near Metro Station"
 *                     pincode:
 *                       type: string
 *                       example: "560001"
 *
 *       401:
 *         description: Unauthorized – invalid or missing token
 *
 *       404:
 *         description: Kit delivery address not found
 *
 *       500:
 *         description: Server error while fetching kit address
 */
 
 
kitRouter.get(
  "/kit-address",
  riderAuthMiddleWare,
  getKitAddress
);
 
module.exports = kitRouter;