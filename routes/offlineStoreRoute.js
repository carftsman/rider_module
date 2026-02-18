// const express = require("express");
// const router = express.Router();

// const {
//   createOfflineStore,
//   getOfflineStores,
// } = require("../controllers/offlineStoreController");

// /**
//  * @swagger
//  * /api/offline-stores:
//  *   get:
//  *     tags: [Offline Store]
//  *     summary: Get all active offline stores
//  *     responses:
//  *       200:
//  *         description: List of offline stores
//  */
// router.get("/", getOfflineStores);

// /**
//  * @swagger
//  * /api/admin/offline-stores:
//  *   post:
//  *     tags: [Offline Store]
//  *     summary: Create a new offline store
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - storeName
//  *               - completeAddress
//  *               - pincode
//  *             properties:
//  *               storeName:
//  *                 type: string
//  *               completeAddress:
//  *                 type: string
//  *               pincode:
//  *                 type: string
//  *     responses:
//  *       201:
//  *         description: Store created successfully
//  */
// router.post("/admin", createOfflineStore);

// module.exports = router;
