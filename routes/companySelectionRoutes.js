const express = require("express");
const router = express.Router();

const { selectRiderType } = require("../controllers/companySelectionController");
const { riderAuthMiddleWare } = require("../middleware/riderAuthMiddleWare");

router.post("/rider/type", riderAuthMiddleWare, selectRiderType);

module.exports = router;