const express = require("express");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleware");
const { getAvailablePrograms , getProgramDetails,joinProgram,getMyPrograms,getMyProgress,getTodayTask,getEarnings} = require("../controllers/riderJoiningBonusController");
const riderJoiningBonusRouter = express.Router();


riderJoiningBonusRouter.get("/programs", riderAuthMiddleWare,getAvailablePrograms);
riderJoiningBonusRouter.get("/programs/:programId",riderAuthMiddleWare, getProgramDetails);
riderJoiningBonusRouter.post("/programs/:programId/join", riderAuthMiddleWare,joinProgram);

riderJoiningBonusRouter.get("/my-programs", riderAuthMiddleWare,getMyPrograms);
riderJoiningBonusRouter.get("/programs/:programId/progress",riderAuthMiddleWare, getMyProgress);
riderJoiningBonusRouter.get("/programs/:programId/today-task", riderAuthMiddleWare,getTodayTask);
riderJoiningBonusRouter.get("/programs/:programId/earnings",riderAuthMiddleWare, getEarnings);

module.exports = riderJoiningBonusRouter;