const express = require("express");

const router = express.Router();

const { markOrderDelivered } = require("../controllers/order.controller");

// ---------------- DELIVER ORDER ----------------

// PATCH /api/orders/deliver/:id

router.patch("/deliver/:id", markOrderDelivered);

module.exports = router;
