const express = require("express");
const router = express.Router();
const{getReferralProgress}=require('../controllers/riderReferralController')
router.get("/rider/:riderId/referrals", getReferralProgress);
module.exports=router;