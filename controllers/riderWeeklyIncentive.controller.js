const prisma = require("../config/prisma");
function getWeekKey(date = new Date()) {
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const week = Math.ceil((((date - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

exports.getWeeklyIncentives = async (req, res) => {
  try {
    const riderId = req.rider.id;

    // 1. Rider location
    const riderLocation = await prisma.riderLocation.findUnique({
      where: { riderId }
    });

    if (!riderLocation?.pincode) {
      return res.json({ success: true, data: [] });
    }

    const today = new Date();

    // 2. Get active programs
    const programs = await prisma.program.findMany({
      where: {
        programType: "INCENTIVE",
        trackingType: "WEEKLY",
        isActive: true,
        pincodeIds: {
          has: riderLocation.pincode
        },
        validFrom: { lte: today },
        validTill: { gte: today }
      },
      select: {
        id: true,
        trackingType: true
      }
    });

    // ✅ FIX: handle empty programs early
    if (!programs.length) {
      return res.json({ success: true, data: [] });
    }

    // 3. Weekly key
const week = getWeekKey();

const progresses = await prisma.programProgress.findMany({
  where: {
    riderId,
    week,
    programId: {
      in: programs.map(p => p.id)
    }
  }
});

// 🔥 IMPORTANT FIX: UPSERT ZERO RECORDS
const response = [];

for (const prog of programs) {

  let progProgress = progresses.find(p => p.programId === prog.id);

  // ✅ If not exists → create ZERO progress
  if (!progProgress) {
    progProgress = await prisma.programProgress.create({
      data: {
        riderId,
        programId: prog.id,
        week,
        totalOrders: 0,
        totalEarnings: 0,
        rewardAmount: 0,
        achieved: false
      }
    });
  }

  response.push({
    programId: prog.id,
    type: "WEEKLY",
    ordersCompleted: progProgress.totalOrders,
    rewardEarned: progProgress.rewardAmount,
    status: progProgress.achieved
      ? "ACHIEVED"
      : (progProgress.totalOrders > 0 ? "IN_PROGRESS" : "NOT_STARTED")
  });
}

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly incentives"
    });
  }
};
exports.getRiderWeeklyPrograms = async (req, res) => {
  try {
    const riderId = req.rider.id;

    // 1️⃣ Rider pincode
    const riderLocation = await prisma.riderLocation.findUnique({
      where: { riderId }
    });

    if (!riderLocation?.pincode) {
      return res.json({ success: true, data: [] });
    }

    const today = new Date();

    // 2️⃣ Fetch programs WITH FULL DETAILS
    const programs = await prisma.program.findMany({
      where: {
        programType: "INCENTIVE",
        trackingType: "WEEKLY",
        isActive: true,
        pincodeIds: {
          has: riderLocation.pincode
        },
        validFrom: { lte: today },
        validTill: { gte: today }
      },
      include: {
        slabs: true,
        targets: true,
        rules: true,
        consistency: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // 3️⃣ Format response
    const response = programs.map((p) => {

      // 🔥 STATUS CALCULATION
      const status =
        today < p.validFrom ? "UPCOMING" :
        today > p.validTill ? "EXPIRED" :
        "RUNNING";

// 🔥 MAX REWARD FIRST
let maxReward = null;

// 🔹 SLAB
if (p.ruleType === "SLAB" && p.slabs?.length) {
  maxReward = Math.max(...p.slabs.map(s => s.rewardAmount));
}

// 🔹 FIXED TARGET
else if (p.ruleType === "FIXED_TARGET" && p.targets?.[0]) {
  maxReward = p.targets[0].rewardAmount;
}

// 🔹 HYBRID
else if (p.ruleType === "HYBRID" && p.targets?.[0]) {
  maxReward = p.targets[0].rewardAmount;
}

// 🔹 fallback
if (maxReward === null) {
  maxReward = p.maxPayoutPerWeek ?? null;
}

// ✅ THEN use it
const result = {
  programId: p.id,
  name: p.name,
  type: "WEEKLY",
  ruleType: p.ruleType,
  status,
  validFrom: p.validFrom,
  validTill: p.validTill,
  weekStartDay: p.weekStartDay,
  maxReward
};

      // ✅ SLAB
      if (p.ruleType === "SLAB" && p.slabs?.length) {
        result.slabs = p.slabs
          .sort((a, b) => a.minValue - b.minValue) // 🔥 IMPORTANT
          .map(s => ({
            minOrders: s.minValue,
            maxOrders: s.maxValue,
            rewardAmount: s.rewardAmount
          }));
      }

      // ✅ FIXED TARGET
      if (p.ruleType === "FIXED_TARGET" && p.targets?.[0]) {
        result.target = {
          orders: p.targets[0].targetOrders
        };
        result.reward = {
          amount: p.targets[0].rewardAmount
        };
      }

      // ✅ HYBRID
      if (p.ruleType === "HYBRID" && p.rules?.[0]) {
        result.conditions = {
          minOrders: p.rules[0].minOrders,
          minEarnings: p.rules[0].minEarnings
        };
      }

      // ✅ CONSISTENCY
      if (p.consistency) {
        result.consistencyRule = {
          minActiveDays: p.consistency.minActiveDays,
          minOrdersPerDay: p.consistency.minOrdersPerDay
        };
      }

      return result;
    });

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error("Weekly programs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch weekly programs"
    });
  }
};