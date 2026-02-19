const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

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


    if (decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
        error: "INVALID_TOKEN_TYPE",
      });
    }

    // Find rider in DB (Prisma way)
    const rider = await prisma.rider.findUnique({
      where: { id: decoded.riderId },
      select: {
        id: true,
        phoneNumber: true,
      },
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Attach essential rider info
    req.rider = { id: rider.id };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: "AUTH_ERROR",
    });
  }
};
