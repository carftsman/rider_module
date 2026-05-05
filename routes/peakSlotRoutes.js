// const express = require("express");
// const router = express.Router();
// const controller = require("../controllers/peakSlotController");
// const prisma = require("../config/prisma");
 
 
// /**
//  * @swagger
//  * /admin/incentives/peak-slot:
//  *   post:
//  *     summary: Create PER_ORDER Peak Slot Incentive
//  *     tags: [Peak Slot Incentives]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [name, cityName, dateRange, slots]
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: Evening Peak Bonus
//  *               cityName:
//  *                 type: string
//  *                 example: Hyderabad
//  *               pincodeIds:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                 example: ["500081"]
//  *               dateRange:
//  *                 type: object
//  *                 properties:
//  *                   startDate:
//  *                     type: string
//  *                     example: "2026-05-01"
//  *                   endDate:
//  *                     type: string
//  *                     example: "2026-05-10"
//  *               slots:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   required: [startTime, endTime, ruleType, reward]
//  *                   properties:
//  *                     startTime:
//  *                       type: string
//  *                       example: "18:00"
//  *                     endTime:
//  *                       type: string
//  *                       example: "21:00"
//  *                     daysOfWeek:
//  *                       type: array
//  *                       items:
//  *                         type: string
//  *                       example: ["MON", "TUE", "WED", "THU", "FRI"]
//  *                     ruleType:
//  *                       type: string
//  *                       enum: [PER_ORDER]
//  *                       example: PER_ORDER
//  *                     reward:
//  *                       type: object
//  *                       properties:
//  *                         amount:
//  *                           type: number
//  *                           example: 20
//  *               isActive:
//  *                 type: boolean
//  *                 example: true
//  *     responses:
//  *       201:
//  *         description: Created successfully
//  */
 
// router.post("/peak-slot",controller.createPerOrderPeakSlot)
 
 
 
// /**
//  * @swagger
//  * /admin/incentives/peak-slot/{id}:
//  *   put:
//  *     summary: Update Peak Slot Incentive
//  *     tags: [Peak Slot Incentives]
//  *
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         example: peak_001
//  *
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: Updated Evening Peak
//  *               isActive:
//  *                 type: boolean
//  *                 example: false
//  *
//  *     responses:
//  *       200:
//  *         description: Updated successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Peak slot updated successfully
//  *       404:
//  *         description: Not found
//  *       500:
//  *         description: Server error
//  */
 
// router.put("/peak-slot/:id", controller.updatePeakSlot);
 
// /**
//  * @swagger
//  * /admin/incentives/peak-slot:
//  *   get:
//  *     summary: Get all Peak Slot Incentives
//  *     tags: [Peak Slot Incentives]
//  *
//  *     responses:
//  *       200:
//  *         description: Successfully fetched peak slot incentives
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       id:
//  *                         type: string
//  *                         example: peak_001
//  *
//  *                       name:
//  *                         type: string
//  *                         example: Evening Peak Bonus
//  *
//  *                       isActive:
//  *                         type: boolean
//  *                         example: true
//  *
//  *                       slots:
//  *                         type: array
//  *                         items:
//  *                           type: object
//  *                           properties:
//  *                             startTime:
//  *                               type: string
//  *                               example: "18:00"
//  *
//  *                             endTime:
//  *                               type: string
//  *                               example: "21:00"
//  *
//  *                             ruleType:
//  *                               type: string
//  *                               example: PER_ORDER
//  *
//  *       500:
//  *         description: Server error
//  */
 
// router.get("/peak-slot",controller.getAllPeakSlots)
 
 
// /**
//  * @swagger
//  * /admin/incentives/peak-slot/{id}:
//  *   get:
//  *     summary: Get single Peak Slot Incentive details
//  *     tags: [Peak Slot Incentives]
//  *
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         example: peak_001
//  *
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: string
//  *                       example: peak_001
//  *
//  *                     name:
//  *                       type: string
//  *                       example: Evening Peak Bonus
//  *
//  *                     cityName:
//  *                       type: string
//  *                       example: Hyderabad
//  *
//  *                     slots:
//  *                       type: array
//  *                       items:
//  *                         type: object
//  *                         properties:
//  *                           startTime:
//  *                             type: string
//  *                             example: "18:00"
//  *
//  *                           endTime:
//  *                             type: string
//  *                             example: "21:00"
//  *
//  *                           daysOfWeek:
//  *                             type: array
//  *                             items:
//  *                               type: string
//  *                             example: ["MON", "TUE"]
//  *
//  *                           ruleType:
//  *                             type: string
//  *                             example: PER_ORDER
//  *
//  *                           reward:
//  *                             type: object
//  *                             properties:
//  *                               amount:
//  *                                 type: number
//  *                                 example: 20
//  *
//  *       404:
//  *         description: Not found
//  *       500:
//  *         description: Server error
//  */
// router.get("/peak-slot/:id", controller.getPeakSlotById);
 
// module.exports = router;
 
 
 
 
 
// if we want to post the slab
 
 
const express = require("express");
const router = express.Router();
const controller = require("../controllers/peakSlotController");
const prisma = require("../config/prisma");
 
/**
 * @swagger
 * /admin/incentives/peak-slot:
 *   post:
 *     summary: Create SLAB Peak Slot Incentive
 *     tags: [Peak Slot Incentives]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cityName
 *               - dateRange
 *               - slots
 *               - pincode   // 👈 add this if mandatory
 *             properties:
 *               name:
 *                 type: string
 *                 example: Weekend Peak Slab Bonus
 *
 *               cityName:
 *                 type: string
 *                 example: Hyderabad
 *
 *               pincode:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["500001"]
 *
 *               dateRange:
 *                 type: object
 *                 required:
 *                   - startDate
 *                   - endDate
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     example: "2026-05-01"
 *                   endDate:
 *                     type: string
 *                     example: "2026-05-31"
 *
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - startTime
 *                     - endTime
 *                     - ruleType
 *                     - slabs
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       example: "19:00"
 *
 *                     endTime:
 *                       type: string
 *                       example: "23:00"
 *
 *                     daysOfWeek:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["SAT", "SUN"]
 *
 *                     ruleType:
 *                       type: string
 *                       enum: [SLAB]
 *                       example: SLAB
 *
 *                     slabs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - minOrders
 *                           - maxOrders
 *                           - rewardAmount
 *                         properties:
 *                           minOrders:
 *                             type: number
 *                             example: 5
 *
 *                           maxOrders:
 *                             type: number
 *                             example: 10
 *
 *                           rewardAmount:
 *                             type: number
 *                             example: 100
 *
 *               isActive:
 *                 type: boolean
 *                 example: true
 *
 *     responses:
 *       201:
 *         description: SLAB Peak Slot created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/peak-slot",controller.createSlabPeakSlot)
 
module.exports = router;