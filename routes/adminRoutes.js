const express = require("express");
const adminRouter = express.Router();
const { approveRiderKyc } = require("../controllers/adminController");
const {
  createOfflineStore,
  getOfflineStores,
} = require("../controllers/offlineStoreController");

const { createWeeklySlots } = require("../controllers/adminSlotController");



adminRouter.put("/approve-kyc/:riderId", approveRiderKyc);

/**
 * @swagger
 * /api/admin/get-offline-stores:
 *   get:
 *     tags: [Offline Store]
 *     summary: Get all active offline stores
 *     description: Fetches all active offline stores for admin view
 *     responses:
 *       200:
 *         description: List of offline stores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       storeName:
 *                         type: string
 *                       completeAddress:
 *                         type: string
 *                       pincode:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *       500:
 *         description: Server error
 */
adminRouter.get("/get-offline-stores", getOfflineStores);

/**
 * @swagger
 * /api/admin/offline-stores:
 *   post:
 *     tags: [Offline Store]
 *     summary: Create a new offline store
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeName
 *               - completeAddress
 *               - pincode
 *             properties:
 *               storeName:
 *                 type: string
 *               completeAddress:
 *                 type: string
 *               pincode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Store created successfully
 */
adminRouter.post("/offline-stores", createOfflineStore);

adminRouter.post("/create-weekly", createWeeklySlots);

module.exports = adminRouter;
