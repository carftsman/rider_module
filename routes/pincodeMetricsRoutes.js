const express = require("express");

const router = express.Router();

const {
  syncPincodeMetrics,
} = require("../controllers/pincodeMetricsController");


router.post(
  "/sync/:pincodeId",
  syncPincodeMetrics
);

module.exports = router;