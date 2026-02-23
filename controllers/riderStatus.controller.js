const prisma = require("../config/prisma");
 
exports.goOnline = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const now = new Date();
 
    const result = await prisma.$transaction(async (tx) => {
 
      const riderData = await tx.rider.findUnique({
        where: { id: riderId },
        include: {
          deliveryStatus: true,
          status: true // your RiderStatus relation
        }
      });
 
      if (!riderData) {
        throw new Error("Rider not found");
      }
 
      if (riderData.isOnline) {
        throw new Error("Rider already online");
      }
 
      // ✅ YOUR LOGIC — safe first time access
      const loginTime = riderData?.status?.lastLoginAt || null;
 
      // update rider main status
      await tx.rider.update({
        where: { id: riderId },
        data: {
          isOnline: true,
          isPartnerActive: true
        }
      });
 
      // ✅ rider status upsert (safe)
      const updatedStatus = await tx.riderStatus.upsert({
        where: { riderId },
 
        update: {
          lastLoginAt: now,
          lastLogoutAt: null
        },
 
        create: {
          riderId,
          lastLoginAt: now,
          lastLogoutAt: null
        }
      });
 
      // delivery active
      const deliveryStatus = await tx.riderDeliveryStatus.upsert({
        where: { riderId },
 
        update: {
          isActive: true,
          inactiveReason: null,
          updatedAt: now
        },
 
        create: {
          riderId,
          isActive: true,
          updatedAt: now
        }
      });
 
      return { updatedStatus, deliveryStatus };
    });
 
    res.status(200).json({
      success: true,
      message: "Rider is now ONLINE",
      isPartnerActive: true,
      riderStatus: result.updatedStatus,
      deliveryStatus: result.deliveryStatus
    });
 
  } catch (error) {
    console.error("ONLINE ERROR:", error);
 
    res.status(400).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};
 
 
exports.goOffline = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { reason = "MANUAL_OFF" } = req.body || {};
 
    const allowedReasons = [
      "MANUAL_OFF",
      "KYC_PENDING",
      "ACCOUNT_SUSPENDED",
      "OUT_OF_SERVICE_AREA",
      "COD_LIMIT_EXCEEDED"
    ];
 
    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inactive reason"
      });
    }
 
    // Fetch rider with status
    const riderData = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        status: true // prisma relation name
      }
    });
 
    if (!riderData) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }
 
    // ✅ Your logic — safely guarded
    const loginTime =
      riderData.status && riderData.status.lastLoginAt
        ? riderData.status.lastLoginAt
        : null;
 
    const logoutTime = new Date();
 
    let sessionMinutes = 0;
 
    if (loginTime) {
      const diffMs = logoutTime - loginTime;
      sessionMinutes = Math.floor(diffMs / 60000);
    }
 
    const previousMinutes =
      riderData.status?.totalOnlineMinutesToday || 0;
 
    const updatedTotalMinutes =
      previousMinutes + sessionMinutes;
 
    // Transaction update
    const result = await prisma.$transaction(async (tx) => {
 
      const updatedStatus = await tx.riderStatus.upsert({
        where: { riderId },
        update: {
          lastLogoutAt: logoutTime,
          totalOnlineMinutesToday: updatedTotalMinutes
        },
        create: {
          riderId,
          lastLogoutAt: logoutTime,
          totalOnlineMinutesToday: updatedTotalMinutes
        }
      });
 
      await tx.riderDeliveryStatus.upsert({
        where: { riderId },
        update: {
          isActive: false,
          inactiveReason: reason,
          updatedAt: logoutTime
        },
        create: {
          riderId,
          isActive: false,
          inactiveReason: reason,
          updatedAt: logoutTime
        }
      });
 
      await tx.rider.update({
        where: { id: riderId },
        data: {
          isOnline: false,
          isPartnerActive: false
        }
      });
 
      return updatedStatus;
    });
 
    return res.status(200).json({
      success: true,
      message: "Rider is now OFFLINE",
      riderStatus: result
    });
 
  } catch (error) {
    console.error("GO OFFLINE ERROR:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
 