const express = require("express");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
const { getAvailablePrograms , getProgramDetails,joinProgram,getMyPrograms,getMyProgress,getTodayTask,getEarnings} = require("../controllers/riderJoiningBonusController");
const riderJoiningBonusRouter = express.Router();


/**
 * @swagger
 * /api/rider/joining/bonus/programs:
 *   get:
 *     tags:
 *       - Rider Joining Bonus
 *     security:
 *       - bearerAuth: []
 *     summary: Get available programs for rider
 *     description: >
 *       Fetches all active JOINING_BONUS programs available for the logged-in rider.
 *       
 *       Logic:
 *       - Filters only active programs
 *       - Filters based on current date (validFrom - validTill)
 *       - Filters based on rider's city & pincode
 *       - Returns only preview of tasks (first 2 tasks)
 *       - Includes enrollment status if rider already joined
 *
 *     responses:
 *
 *       200:
 *         description: Available programs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 count:
 *                   type: number
 *                   example: 2
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *
 *                       id:
 *                         type: string
 *                         example: PROG12345
 *
 *                       name:
 *                         type: string
 *                         example: Joining Bonus Program
 *
 *                       validityDays:
 *                         type: number
 *                         example: 7
 *
 *                       rewardPreview:
 *                         type: number
 *                         example: 300
 *
 *                       isEnrolled:
 *                         type: boolean
 *                         example: true
 *
 *                       enrollmentStatus:
 *                         type: string
 *                         example: ACTIVE
 *
 *                       tasksPreview:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *
 *                             id:
 *                               type: string
 *                               example: TASK123
 *
 *                             dayNumber:
 *                               type: number
 *                               example: 1
 *
 *                             taskType:
 *                               type: string
 *                               example: ORDERS
 *
 *                             rewardAmount:
 *                               type: number
 *                               example: 100
 *
 *       400:
 *         description: Rider location not set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Rider location not set
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: false
 *
 *                 message:
 *                   type: string
 *                   example: Server error
 */

riderJoiningBonusRouter.get("/programs", riderAuthMiddleWare,getAvailablePrograms);

/**
 * @swagger
 * /api/rider/joining/bonus/programs/{programId}:
 *   get:
 *     summary: Get program details with tasks
 *     tags: [Rider Joining Bonus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program details fetched
 *       404:
 *         description: Program not found
 */
riderJoiningBonusRouter.get("/programs/:programId",riderAuthMiddleWare, getProgramDetails);

/**
 * @swagger
 * /api/rider/joining/bonus/programs/{programId}/join:
 *   post:
 *     summary: Join a joining bonus program
 *     tags: [Rider Joining Bonus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined successfully
 *       400:
 *         description: Already joined / Program not active
 */
riderJoiningBonusRouter.post("/programs/:programId/join", riderAuthMiddleWare,joinProgram);

/**
 * @swagger
 * /api/rider/joining/bonus/my-programs:
 *   get:
 *     summary: Get rider enrolled programs
 *     tags: [Rider Joining Bonus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrolled programs fetched
 */
riderJoiningBonusRouter.get("/my-programs", riderAuthMiddleWare,getMyPrograms);

/**
 * @swagger
 * /api/rider/joining/bonus/programs/{programId}/progress:
 *   get:
 *     summary: Get rider progress for a program
 *     tags: [Rider Joining Bonus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress fetched
 *       400:
 *         description: Not enrolled
 */
riderJoiningBonusRouter.get("/programs/:programId/progress",riderAuthMiddleWare, getMyProgress);

/**
 * @swagger
 * /api/rider/joining/bonus/programs/{programId}/today-task:
 *   get:
 *     summary: Get today's task for the program
 *     tags: [Rider Joining Bonus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Today's task fetched
 */
riderJoiningBonusRouter.get("/programs/:programId/today-task", riderAuthMiddleWare,getTodayTask);

module.exports = riderJoiningBonusRouter;