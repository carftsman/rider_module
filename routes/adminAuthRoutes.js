const express = require("express");
const adminAuthRouter = express.Router();

const {adminRegister,adminLogin, adminRefreshToken} = require("../controllers/adminAuthController");

adminAuthRouter.post("/register", adminRegister);
adminAuthRouter.post("/login", adminLogin);
adminAuthRouter.post("/refresh", adminRefreshToken);

module.exports = adminAuthRouter;