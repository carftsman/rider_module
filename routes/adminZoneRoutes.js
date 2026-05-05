const express = require("express");
const adminZoneRoutes = express.Router();

const {
  createZonePoint,
  getZonePoints
  
} = require("../controllers/adminZoneController.js");

// ADMIN
/**
 * @swagger
 * /api/admin/zones/zone-points:
 *   post:
 *     summary: Create a new Zone Point
 *     tags: [Zone Points]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - addressLine1
 *               - city
 *               - state
 *               - pincode
 *               - latitude
 *               - longitude
 *               - zoneId
 *             properties:
 *               name:
 *                 type: string
 *                 example: PB House Pickup Point
 *               addressLine1:
 *                 type: string
 *                 example: 1st Floor, Street No.7, PB House
 *               addressLine2:
 *                 type: string
 *                 example: HUDA Techno Enclave, Madhapur
 *               city:
 *                 type: string
 *                 example: Hyderabad
 *               state:
 *                 type: string
 *                 example: Telangana
 *               pincode:
 *                 type: string
 *                 example: "500081"
 *               latitude:
 *                 type: number
 *                 example: 17.4483
 *               longitude:
 *                 type: number
 *                 example: 78.3915
 *               zoneId:
 *                 type: string
 *                 example: clx123abc456zoneid
 *     responses:
 *       201:
 *         description: Zone Point created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
adminZoneRoutes.post("/zone-points", createZonePoint);

// adminZoneRoutes.post("/zone-points", createZonePoint);

// USER
adminZoneRoutes.get("/add/zone-points", getZonePoints);
// router.get("/:zoneId/points", getZonePointsByZone);

module.exports = adminZoneRoutes;