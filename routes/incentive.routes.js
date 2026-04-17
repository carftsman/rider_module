const express = require("express");
const riderIncentivesrouter = express.Router();
const {createDailyIncentive ,createWeeklyIncentive , createPeakIncentive ,getAllIncentives,getIncentiveById ,deleteIncentive,lockIncentive,unlockIncentive} = require("../controllers/incentive.controller")

riderIncentivesrouter.post("/daily", createDailyIncentive);
riderIncentivesrouter.post("/weekly", createWeeklyIncentive);
riderIncentivesrouter.post("/peak", createPeakIncentive);

riderIncentivesrouter.get("/", getAllIncentives);
riderIncentivesrouter.get("/:id", getIncentiveById);

riderIncentivesrouter.delete("/:id", deleteIncentive);

riderIncentivesrouter.patch("/admin/:id/lock", lockIncentive);
riderIncentivesrouter.patch("/admin/:id/unlock", unlockIncentive);

module.exports = riderIncentivesrouter;