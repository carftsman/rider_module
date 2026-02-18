const express = require("express");
const router = express.Router();

const {
  createPricingConfig,
} = require("../controllers/pricingConfigController");

// POST – Save pricing config
router.post("/pricing-config", createPricingConfig);

module.exports = router;
