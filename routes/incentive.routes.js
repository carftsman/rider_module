const express = require("express");
const adminIncentivesrouter = express.Router();
const {createDailyIncentive ,createWeeklyIncentive , createPeakIncentive ,getAllIncentives,getIncentiveById ,deleteIncentive,lockIncentive,unlockIncentive} = require("../controllers/incentive.controller")

adminIncentivesrouter.post("/daily", createDailyIncentive);
adminIncentivesrouter.post("/weekly", createWeeklyIncentive);
adminIncentivesrouter.post("/peak", createPeakIncentive);

adminIncentivesrouter.get("/", getAllIncentives);
adminIncentivesrouter.get("/:id", getIncentiveById);

adminIncentivesrouter.delete("/:id", deleteIncentive);

adminIncentivesrouter.patch("/admin/:id/lock", lockIncentive);
adminIncentivesrouter.patch("/admin/:id/unlock", unlockIncentive);

module.exports = adminIncentivesrouter;