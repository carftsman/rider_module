const express = require("express");
const router = express.Router();
const { getBestRoute } = require("../controllers/gpsController");
 
router.post("/best", getBestRoute);
 
module.exports = router;