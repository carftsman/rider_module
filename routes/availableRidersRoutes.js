const express = require("express");
const router = express.Router();
const riderController = require("../controllers/availableRidersController");

router.get("/available-riders", riderController.getAvailableRiders);

module.exports = router;
