const express = require("express");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
const { getAvailablePrograms , getProgramDetails,joinProgram,getMyPrograms,getMyProgress,getTodayTask,getEarnings} = require("../controllers/riderJoiningBonusController");
const riderJoiningBonusRouter = express.Router();


/**
 * @swagger
 * /api/rider/joining/bonus/programs:
 *   get:
 *     summary: Get available joining bonus programs for rider
 *     tags: [Rider Joining Bonus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Programs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Location not set
 *       500:
 *         description: Server error
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