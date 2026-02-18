const express = require("express");
const router = express.Router();

const {
  updateOrderStatus,
  getOrderStatus
} = require("../controllers/webOrderController");

// Rider / Admin updates order status
router.put("/status", updateOrderStatus);

// User fetch latest order status (fallback)
router.get("/:orderId/status", getOrderStatus);

module.exports = router;
