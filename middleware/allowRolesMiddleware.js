exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    try {

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
          error: "ADMIN_NOT_AUTHENTICATED",
        });
      }

      if (!roles.includes(req.admin.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
          error: "INSUFFICIENT_ROLE",
          requiredRoles: roles,
          currentRole: req.admin.role,
        });
      }

      next();
    } catch (error) {
      console.error("Role Middleware Error:", error);

      return res.status(500).json({
        success: false,
        message: "Role authorization failed",
        error: "ROLE_MIDDLEWARE_ERROR",
      });
    }
  };
};