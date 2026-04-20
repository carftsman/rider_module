const prisma = require("../config/prisma");
 
exports.goOnline = async (req, res) => {

  try {

    const riderId = req.rider.id;

    const now = new Date();
 
    const today = new Date();

    today.setHours(0, 0, 0, 0);
 
    const result = await prisma.$transaction(async (tx) => {

      const riderData = await tx.rider.findUnique({

        where: { id: riderId },

        include: {

          deliveryStatus: true,

          status: true,

        },

      });
 
      if (!riderData) {

        throw new Error("Rider not found");

      }
 
      if (riderData.isOnline) {

        throw new Error("Rider already online");

      }
 
      let totalOnlineMinutesToday =

        riderData?.status?.totalOnlineMinutesToday || 0;
 
      const savedDate = riderData?.status?.onlineMinutesDate

        ? new Date(riderData.status.onlineMinutesDate)

        : null;
 
      // Reset if date changed

      if (

        !savedDate ||

        savedDate.toDateString() !== today.toDateString()

      ) {

        totalOnlineMinutesToday = 0;

      }
 
      await tx.rider.update({

        where: { id: riderId },

        data: {

          isOnline: true,

          isPartnerActive: true,

        },

      });
 
      const updatedStatus = await tx.riderStatus.upsert({

        where: { riderId },
 
        update: {

          lastLoginAt: now,

          lastLogoutAt: null,

          totalOnlineMinutesToday,

          onlineMinutesDate: today,

        },
 
        create: {

          riderId,

          lastLoginAt: now,

          lastLogoutAt: null,

          totalOnlineMinutesToday: 0,

          onlineMinutesDate: today,

        },

      });
 
      const deliveryStatus = await tx.riderDeliveryStatus.upsert({

        where: { riderId },
 
        update: {

          isActive: true,

          inactiveReason: "MANUAL_OFF",

          updatedAt: now,

        },
 
        create: {

          riderId,

          isActive: true,

          inactiveReason: "MANUAL_OFF",

          updatedAt: now,

        },

      });
 
      return { updatedStatus, deliveryStatus };

    });
 
    res.status(200).json({

      success: true,

      message: "Rider is now ONLINE",

      isPartnerActive: true,

      riderStatus: result.updatedStatus,

      deliveryStatus: result.deliveryStatus,

    });

  } catch (error) {

    console.error("ONLINE ERROR:", error);
 
    res.status(400).json({

      success: false,

      message: error.message || "Server error",

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

    // ------------------------
    // FETCH RIDER WITH RELATIONS
    // ------------------------
    const riderData = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        status: true,
        deliveryStatus: true
      }
    });

    if (!riderData) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    const logoutTime = new Date();

    // ------------------------
    // SESSION CALCULATION
    // ------------------------
    const loginTime = riderData.status?.lastLoginAt;

    let sessionMinutes = 0;

    if (loginTime) {
      const diffMs = logoutTime - new Date(loginTime);
      sessionMinutes = Math.floor(diffMs / 60000);
    }

    const updatedTotalMinutes =
      (riderData.status?.totalOnlineMinutesToday || 0) +
      sessionMinutes;

    // ------------------------
    // ATOMIC UPDATE
    // ------------------------
    const result = await prisma.$transaction(async (tx) => {

      // Update main Rider table
      await tx.rider.update({
        where: { id: riderId },
        data: {
          isOnline: false,
          isPartnerActive: false
        }
      });

      // Update RiderStatus (NO isOnline here ❗)
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

      // Update DeliveryStatus
      const updatedDelivery = await tx.riderDeliveryStatus.upsert({
        where: { riderId },
        update: {
          isActive: false,
          inactiveReason: reason,
          updatedAt: new Date()
        },
        create: {
          riderId,
          isActive: false,
          inactiveReason: reason,
          updatedAt: new Date()
        }
      });

      return { updatedStatus, updatedDelivery };
    });

    // ------------------------
    // RESPONSE
    // ------------------------
    res.status(200).json({
      success: true,
      message: "Rider is now OFFLINE",
      riderStatus: {
        lastLoginAt: result.updatedStatus.lastLoginAt,
        lastLogoutAt: result.updatedStatus.lastLogoutAt,
        totalOnlineMinutesToday:
          result.updatedStatus.totalOnlineMinutesToday
      },
      deliveryStatus: {
        isActive: result.updatedDelivery.isActive,
        inactiveReason: result.updatedDelivery.inactiveReason
      }
    });

  } catch (error) {
    console.error("GO OFFLINE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};