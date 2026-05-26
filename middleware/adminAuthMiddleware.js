const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

exports.adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
        error: "NO_TOKEN",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token missing",
        error: "TOKEN_MISSING",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_ADMIN_ACCESS_SECRET
      );
    } catch (err) {
      console.error("JWT VERIFY ERROR:", err.message);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token expired",
          error: "TOKEN_EXPIRED",
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

    const admin = await prisma.admin.findUnique({
      where: {
        id: decoded.adminId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
        error: "ADMIN_NOT_FOUND",
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    console.error("Admin Auth Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: "AUTH_MIDDLEWARE_ERROR",
    });
  }
};