const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create admin
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "ADMIN",
      },
    });

    return res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.adminLogin = async (req, res) => {
  try {
    console.log("SIGNING WITH:", process.env.JWT_ADMIN_ACCESS_SECRET);
    const { email, password } = req.body;

    // 1. Find admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3. Create ACCESS token (short-lived)
    const accessToken = jwt.sign(
      {
        adminId: admin.id,
        role: admin.role,
        type: "access",
      },
      process.env.JWT_ADMIN_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    // 4. Create REFRESH token (long-lived)
    const refreshToken = jwt.sign(
      {
        adminId: admin.id,
        type: "refresh",
      },
      process.env.JWT_ADMIN_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    // 5. Store refresh token in DB (important for security)
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        refreshToken,
      },
    });

    // 6. Response
    return res.status(200).json({
      success: true,
      message: ` ${admin.role} Login successful`,
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



exports.adminRefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_ADMIN_REFRESH_SECRET
      );
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    // check admin in DB
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
    });

    if (!admin || admin.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not valid",
      });
    }

    // generate new access token
    const newAccessToken = jwt.sign(
      {
        adminId: admin.id,
        role: admin.role,
        type: "access",
      },
      process.env.JWT_ADMIN_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};