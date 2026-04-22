const prisma = require("../config/prisma");

//  COMMON FUNCTION (DRY)
async function getIncentivesByType(riderId, type = null) {
  const now = new Date();

  // 1️ Fetch incentives
  const where = {
    status: "ACTIVE",
    validFrom: { lte: now },
    validTill: { gte: now }
  };

  if (type) {
    where.incentiveType = type;
  }

  const incentives = await prisma.incentive.findMany({
    where,
    include: {
      slabs: {
        orderBy: { minOrders: "asc" }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // 2️ Fetch rider progress
  const progressList = await prisma.riderIncentiveProgress.findMany({
    where: { riderId }
  });

  // 3️ Merge progress
  return incentives.map((inc) => {
    const progress = progressList.find(
      (p) => p.incentiveId === inc.id
    );

    return {
      ...inc,
      progress: progress || {
        totalOrders: 0,
        peakOrders: 0,
        normalOrders: 0,
        completedPeakSlots: 0,
        completedNormalSlots: 0,
        achievedReward: 0,
        eligible: false
      }
    };
  });
}


// 1️ GET ALL (Dashboard)


exports.getAllIncentivesWithProgress = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const data = await getIncentivesByType(riderId);

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch incentives"
    });
  }
};


// 2️ GET DAILY

exports.getDailyIncentives = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const data = await getIncentivesByType(
      riderId,
      "DAILY_TARGET"
    );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily incentives"
    });
  }
};


// 3️ GET WEEKLY

exports.getWeeklyIncentives = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const data = await getIncentivesByType(
      riderId,
      "WEEKLY_TARGET"
    );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch weekly incentives"
    });
  }
};


// 4️ GET PEAK

exports.getPeakIncentives = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const now = new Date();

    // 1️⃣ Get incentives
    const incentives = await prisma.incentive.findMany({
      where: {
        incentiveType: "PEAK_SLOT",
        status: "ACTIVE",
        validFrom: { lte: now },
        validTill: { gte: now }
      },
      include: {
        slabs: {
          orderBy: { minOrders: "asc" }
        }
      }
    });

    // 2️⃣ Get rider progress
    const progressList = await prisma.riderIncentiveProgress.findMany({
      where: { riderId }
    });

    // 3️⃣ Get TODAY PEAK SLOTS (IMPORTANT 🔥)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const peakSlots = await prisma.slot.findMany({
      where: {
        isPeakSlot: true,
        slotStartAt: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      select: {
        slotId: true,
        startTime: true,
        endTime: true,
        slotStartAt: true,
        slotEndAt: true
      }
    });

    // 4️⃣ Merge everything
    const data = incentives.map((inc) => {
      const progress = progressList.find(
        (p) => p.incentiveId === inc.id
      );

      return {
        ...inc,

        // 🔥 ADD PEAK TIME HERE
        peakSlots, 

        progress: progress || {
          totalOrders: 0,
          peakOrders: 0,
          normalOrders: 0,
          completedPeakSlots: 0,
          completedNormalSlots: 0,
          achievedReward: 0,
          eligible: false
        }
      };
    });

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch peak incentives"
    });
  }
};


exports.getIncentiveByIdWithProgress = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { id } = req.params;

    const incentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        slabs: {
          orderBy: { minOrders: "asc" }
        }
      }
    });

    if (!incentive) {
      return res.status(404).json({
        success: false,
        message: "Incentive not found"
      });
    }

    const progress = await prisma.riderIncentiveProgress.findFirst({
      where: {
        riderId,
        incentiveId: id
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        ...incentive,
        progress: progress || {
          totalOrders: 0,
          peakOrders: 0,
          normalOrders: 0,
          completedPeakSlots: 0,
          completedNormalSlots: 0,
          achievedReward: 0,
          eligible: false
        }
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch incentive"
    });
  }
};