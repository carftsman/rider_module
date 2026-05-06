const prisma = require("../config/prisma");

const getDailyIncentive = async (req, res) => {
  try {
const riderId =
  req.rider?.id || req.rider?.riderId;
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

// GET RIDER LOCATION

const riderLocation =
  await prisma.riderLocation.findUnique({
    where: { riderId }
  });

if (!riderLocation) {
  return res.json({
    programId: null,
    type: "DAILY",
    ordersCompleted: 0,
    rewardEarned: 0,
    status: "NO_ACTIVE_PROGRAM",
  });
}

const riderPincode =
  riderLocation.pincode
    ? String(riderLocation.pincode).trim()
    : null;

const riderCityId =
  riderLocation.cityId || null;

const now = new Date();

let program = null;

// PINCODE FIRST

if (riderPincode) {
  program = await prisma.program.findFirst({
    where: {
      programType: "DAILY_TARGET",
      trackingType: "DAILY",
      isActive: true,
      validFrom: { lte: now },
      validTill: { gte: now },
      pincodeIds: {
        has: riderPincode
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

// FALLBACK CITY

if (!program && riderCityId) {
  program = await prisma.program.findFirst({
    where: {
      programType: "DAILY_TARGET",
      trackingType: "DAILY",
      isActive: true,
      validFrom: { lte: now },
      validTill: { gte: now },
      cityId: {
        has: riderCityId
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

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
    let status = "NOT_STARTED";

   if (!progress) {
  return res.json({
    programId: program.id,
    type: "DAILY",
    ordersCompleted: 0,
    rewardEarned: 0,
    status: "NOT_STARTED",
  });
}

if (progress.achieved) {
  status = "ACHIEVED";
}
else if (progress.totalOrders > 0) {
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
    console.error("ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

const getRiderDailyPrograms = async (req, res) => {
  try {
    const riderId =
  req.rider?.id || req.rider?.riderId;

    // GET RIDER LOCATION

    const riderLocation = await prisma.riderLocation.findUnique({
      where: { riderId }
    });

    if (!riderLocation) {
      return res.json({ success: true, data: [] });
    }

    // PREPARE VARIABLES

    const riderPincode = riderLocation.pincode
      ? String(riderLocation.pincode).trim()
      : null;

    const riderCityId = riderLocation.cityId || null;

    const now = new Date();
    /// FETCH PROGRAMS (PINCODE FIRST)

    let programs = [];

    if (riderPincode) {
      programs = await prisma.program.findMany({
        where: {
          programType: "DAILY_TARGET",
          trackingType: "DAILY",
          isActive: true,
          validFrom: { lte: now },
          validTill: { gte: now },
          pincodeIds: { has: riderPincode }
        },
        include: {
          slabs: true,
          targets: true,
          rules: true
        },
        orderBy: { createdAt: "desc" }
      });
    }

    // FALLBACK TO CITY
    if (!programs.length && riderCityId) {
      programs = await prisma.program.findMany({
        where: {
          programType: "DAILY_TARGET",
          trackingType: "DAILY",
          isActive: true,
          validFrom: { lte: now },
          validTill: { gte: now },
          cityId: { has: riderCityId }
        },
        include: {
          slabs: true,
          targets: true,
          rules: true
        },
        orderBy: { createdAt: "desc" }
      });
    }


    // FORMAT RESPONSE (ADMIN STYLE)

    const response = programs.map((p) => {

      let maxPayoutPerDay = p.maxPayoutPerDay;

      if (maxPayoutPerDay === null) {

        if (p.ruleType === "SLAB" && p.slabs?.length) {
          maxPayoutPerDay = Math.max(...p.slabs.map(s => s.rewardAmount));
        }

        else if (["FIXED_TARGET", "HYBRID"].includes(p.ruleType) && p.targets?.[0]) {
          maxPayoutPerDay = p.targets[0].rewardAmount;
        }
      }


      const result = {
        name: p.name,

        cityId: p.cityId?.[0] || null,

        dateRange: {
          startDate: p.validFrom,
          endDate: p.validTill
        },

        ruleType: p.ruleType,

        maxPayoutPerDay,

        isActive: p.isActive
      };

      // SLAB

      if (p.ruleType === "SLAB" && p.slabs?.length) {
        result.slabs = p.slabs.map(s => ({
          minOrders: s.minValue,
          maxOrders: s.maxValue,
          rewardAmount: s.rewardAmount
        }));
      }

      // FIXED TARGET

      if (p.ruleType === "FIXED_TARGET") {
        result.target = {
          orders: p.targets?.[0]?.targetOrders || null
        };

        result.reward = {
          amount: p.targets?.[0]?.rewardAmount || null
        };
      }

      // HYBRID

      if (p.ruleType === "HYBRID") {
        result.conditions = {
          minOrders: p.rules?.[0]?.minOrders || null,
          minEarnings: p.rules?.[0]?.minEarnings || null,
          minAcceptanceRate: p.minAcceptanceRate || null,
          minCompletionRate: p.minCompletionRate || null
        };

        result.reward = {
          amount: p.targets?.[0]?.rewardAmount || null
        };
      }

      return result;
    });

    // RESPONSE

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error("Daily programs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily programs"
    });
  }
};

module.exports = {
  getDailyIncentive,
  getRiderDailyPrograms,
};
