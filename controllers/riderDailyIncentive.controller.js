const prisma = require("../config/prisma");

const getDailyIncentive = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    // console.log("RiderId:", riderId);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID missing in token",
      });
    }

    // Start & End of day (safe for DateTime)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Find active DAILY program
    const program = await prisma.program.findFirst({
      where: {
        programType: "INCENTIVE",
        trackingType: "DAILY",
        isActive: true,
      },
    });

    console.log("👉 Program:", program?.id);

    if (!program) {
      return res.json({
        programId: null,
        type: "DAILY",
        ordersCompleted: 0,
        rewardEarned: 0,
        status: "NO_ACTIVE_PROGRAM",
      });
    }

    // 2. Find today's progress
    let progress = await prisma.programProgress.findFirst({
      where: {
        riderId,
        programId: program.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 3. Create if not exists
    if (!progress) {
      progress = await prisma.programProgress.create({
        data: {
          riderId, //  NOW WILL NOT BE UNDEFINED
          programId: program.id,
          date: new Date(),
          totalOrders: 0,
          rewardAmount: 0,
          achieved: false,
        },
      });
    }


let status = "NOT_STARTED";

if (progress.achieved) {
  status = "ACHIEVED";
} else if (progress.totalOrders > 0) {
  status = "IN_PROGRESS";
}

return res.json({
  programId: progress.programId,
  type: "DAILY",
  ordersCompleted: progress.totalOrders,
  rewardEarned: progress.rewardAmount,
  status,
});

  } catch (error) {
    console.error("🔥 ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getDailyIncentive,
};
