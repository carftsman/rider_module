const jwt = require("jsonwebtoken");
const Rider = require("../models/RiderModel");

exports.riderAuthMiddleWare = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
        error: "NO_TOKEN",
      });
    }

    const token = header.split(" ")[1];



    // Verify access token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token expired",
          error: "ACCESS_TOKEN_EXPIRED",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        error: "INVALID_TOKEN",
      });
    }

    // Validate rider in DB
    const rider = await Rider.findById(decoded.riderId).select("_id phone");
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Attach only essential rider data
    req.rider = { _id: rider._id };

    next(); // move to controller
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: "AUTH_ERROR",
    });
  }
};



