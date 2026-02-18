const fcmService = require("../helpers/fcmService");

exports.sendNotification = async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    await fcmService.sendToDevice({
      token,
      title,
      body,
      data,
    });

    res.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
    });
  }
};
