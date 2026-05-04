const express = require("express");
const joiningBonusRouter = express.Router();

const { createProgram ,createProgramTask,getProgramTasks, getAllPrograms, getProgramById, updateProgram, toggleProgramStatus, getTasks, updateTask, deleteTask, getProgramRiders, getRiderProgress} = require("../controllers/adminJoiningBonusController");

joiningBonusRouter.post("/program", createProgram);
joiningBonusRouter.post("/programTask", createProgramTask);
joiningBonusRouter.get("/program", getProgramTasks);


joiningBonusRouter.get("/programs", getAllPrograms);
joiningBonusRouter.get("/programs/:programId", getProgramById);
joiningBonusRouter.put("/programs/:programId", updateProgram);
joiningBonusRouter.patch("/programs/:programId/status", toggleProgramStatus);

joiningBonusRouter.get("/programs/:programId/tasks", getTasks);
joiningBonusRouter.put("/tasks/:taskId", updateTask);
joiningBonusRouter.delete("/tasks/:taskId", deleteTask);


joiningBonusRouter.get("/programs/:programId/riders", getProgramRiders);
joiningBonusRouter.get("/programs/:programId/riders/:riderId", getRiderProgress);

module.exports = joiningBonusRouter;