const prisma = require("../config/prisma");

const getRiderIncentives = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: { location: true }
    });

    const riderPincode = rider?.location?.pincode;

    if (!riderPincode) {
      return res.status(400).json({
        success: false,
        message: "Rider pincode not found"
      });
    }

    // ONLY PEAK programs (ruleType = PER_ORDER)
    const programs = await prisma.program.findMany({
      where: {
        isActive: true,
        ruleType: "PER_ORDER",
        pincodeIds: { has: riderPincode }
      },
      include: {
        progresses: {
          where: { riderId }
        }
      }
    });

    const incentives = programs.map((program) => {
      const progress = program.progresses?.[0];

      return {
        programId: program.id,
        type: "PEAK",
        trackingType: program.trackingType === "DAILY" ? "DAILY" : "SLAB",
        ordersCompleted: progress?.ordersCompleted || 0,
        rewardEarned: progress?.rewardEarned || 0,
        status: progress?.status || "IN_Progress"
      };
    });

    // ✅ EXACT RESPONSE (NO EXTRA FIELDS)
    return res.json({
      incentives
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { getRiderIncentives };