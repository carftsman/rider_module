const express = require("express");
const router = express.Router();
const controller = require("../controllers/peakSlotController");
const prisma = require("../config/prisma");
 
 
/**
 * @swagger
 * /admin/incentives/peak-slot:
 *   post:
 *     summary: Create Peak Slot Incentive (PER_ORDER)
 *     tags: [Peak Slot Incentives]
 *     description: Create peak slot incentive using PER_ORDER structure.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ruleType
 *               - name
 *               - cityName
 *               - dateRange
 *               - slots
 *             properties:
 *               ruleType:
 *                 type: string
 *                 example: PER_ORDER
 *
 *               name:
 *                 type: string
 *                 example: Evening Bonus
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
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     example: "2026-05-01"
 *                   endDate:
 *                     type: string
 *                     example: "2026-05-10"
 *
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       example: "18:00"
 *
 *                     endTime:
 *                       type: string
 *                       example: "21:00"
 *
 *                     daysOfWeek:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["MON", "TUE"]
 *
 *                     reward:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           example: 20
 *
 *               isActive:
 *                 type: boolean
 *                 example: true
 *
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/peak-slot",controller.createPeakSlot)
 
 
 
/**
 * @swagger
 * /admin/incentives/peak-slot/{id}:
 *   put:
 *     summary: Update Peak Slot Incentive
 *     tags: [Peak Slot Incentives]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: peak_001
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Evening Peak
 *               isActive:
 *                 type: boolean
 *                 example: false
 *
 *     responses:
 *       200:
 *         description: Updated successfully
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
 *                   example: Peak slot updated successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
 
router.put("/peak-slot/:id", controller.updatePeakSlot);
 
/**
 * @swagger
 * /admin/incentives/peak-slot:
 *   get:
 *     summary: Get all Peak Slot Incentives
 *     tags: [Peak Slot Incentives]
 *
 *     responses:
 *       200:
 *         description: Successfully fetched peak slot incentives
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: peak_001
 *
 *                       name:
 *                         type: string
 *                         example: Evening Peak Bonus
 *
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *
 *                       slots:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             startTime:
 *                               type: string
 *                               example: "18:00"
 *
 *                             endTime:
 *                               type: string
 *                               example: "21:00"
 *
 *                             ruleType:
 *                               type: string
 *                               example: PER_ORDER
 *
 *       500:
 *         description: Server error
 */
 
router.get("/peak-slot",controller.getAllPeakSlots)
 
 
/**
 * @swagger
 * /admin/incentives/peak-slot/{id}:
 *   get:
 *     summary: Get single Peak Slot Incentive details
 *     tags: [Peak Slot Incentives]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: peak_001
 *
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: peak_001
 *
 *                     name:
 *                       type: string
 *                       example: Evening Peak Bonus
 *
 *                     cityName:
 *                       type: string
 *                       example: Hyderabad
 *
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           startTime:
 *                             type: string
 *                             example: "18:00"
 *
 *                           endTime:
 *                             type: string
 *                             example: "21:00"
 *
 *                           daysOfWeek:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["MON", "TUE"]
 *
 *                           ruleType:
 *                             type: string
 *                             example: PER_ORDER
 *
 *                           reward:
 *                             type: object
 *                             properties:
 *                               amount:
 *                                 type: number
 *                                 example: 20
 *
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get("/peak-slot/:id", controller.getPeakSlotById);


/**
 * @swagger
 * /admin/incentives/peak-slot/{id}:
 *   delete:
 *     summary: Delete Peak Slot Program
 *     description: >
 *       Deletes a peak slot program by ID.
 *       Deletion is only allowed if no slot is currently active.
 *       A slot is considered active when:
 *       - Current day matches slot daysOfWeek
 *       - Current time is within startMinutes and endMinutes
 *
 *     tags:
 *       - Peak Slot Incentives
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Program ID of the peak slot to delete
 *         schema:
 *           type: string
 *           example: c38edbe3-7c34-47c0-bc03-d4108f169f8b
 *
 *     responses:
 *       200:
 *         description: Peak slot deleted successfully
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
 *                   example: Peak slot deleted successfully
 *
 *       400:
 *         description: Cannot delete while slot is active
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
 *                   example: Cannot delete peak slot while it is active
 *
 *       404:
 *         description: Program not found
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
 *                   example: Peak slot not found
 *
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
 *                   example: Something went wrong
 */
 

router.delete("/peak-slot/:id", controller.deletePeakSlot);

module.exports = router;
 
 
 
 
 
// if we want to post the slab
 
 
// const express = require("express");
// const router = express.Router();
// const controller = require("../controllers/peakSlotController");
// const prisma = require("../config/prisma");
 
// /**
//  * @swagger
//  * /admin/incentives/peak-slot:
//  *   post:
//  *     summary: Create SLAB Peak Slot Incentive
//  *     tags: [Peak Slot Incentives]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *               - cityName
//  *               - dateRange
//  *               - slots
//  *               - pincode   // 👈 add this if mandatory
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: Weekend Peak Slab Bonus
//  *
//  *               cityName:
//  *                 type: string
//  *                 example: Hyderabad
//  *
//  *               pincode:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                 example: ["500001"]
//  *
//  *               dateRange:
//  *                 type: object
//  *                 required:
//  *                   - startDate
//  *                   - endDate
//  *                 properties:
//  *                   startDate:
//  *                     type: string
//  *                     example: "2026-05-01"
//  *                   endDate:
//  *                     type: string
//  *                     example: "2026-05-31"
//  *
//  *               slots:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   required:
//  *                     - startTime
//  *                     - endTime
//  *                     - ruleType
//  *                     - slabs
//  *                   properties:
//  *                     startTime:
//  *                       type: string
//  *                       example: "19:00"
//  *
//  *                     endTime:
//  *                       type: string
//  *                       example: "23:00"
//  *
//  *                     daysOfWeek:
//  *                       type: array
//  *                       items:
//  *                         type: string
//  *                       example: ["SAT", "SUN"]
//  *
//  *                     ruleType:
//  *                       type: string
//  *                       enum: [SLAB]
//  *                       example: SLAB
//  *
//  *                     slabs:
//  *                       type: array
//  *                       items:
//  *                         type: object
//  *                         required:
//  *                           - minOrders
//  *                           - maxOrders
//  *                           - rewardAmount
//  *                         properties:
//  *                           minOrders:
//  *                             type: number
//  *                             example: 5
//  *
//  *                           maxOrders:
//  *                             type: number
//  *                             example: 10
//  *
//  *                           rewardAmount:
//  *                             type: number
//  *                             example: 100
//  *
//  *               isActive:
//  *                 type: boolean
//  *                 example: true
//  *
//  *     responses:
//  *       201:
//  *         description: SLAB Peak Slot created successfully
//  *       400:
//  *         description: Validation error
//  *       500:
//  *         description: Server error
//  */
// router.post("/peak-slot",controller.createSlabPeakSlot)
 
// module.exports = router;