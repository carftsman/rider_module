const notificationRoutes = require("express").Router();
const {sendNotification} = require("../controllers/notificationController");

notificationRoutes.post("/send", sendNotification);

module.exports = notificationRoutes;
