const prisma = require("../config/prisma");

// ================= HELPERS =================

const isValidDate = (date) => !isNaN(new Date(date).getTime());

function getProgramStatus(program) {
  const now = new Date();

  if (!program.isActive) return "DISABLED";
  if (now < program.validFrom) return "UPCOMING";
  if (now > program.validTill) return "EXPIRED";
  return "RUNNING";
}

// ================= VALIDATION =================

const validateRequest = (body) => {
  const {
    name,
    ruleType,
    dateRange,
    weekConfig,
    slabs,
    target,
    reward,
    pincodeIds
  } = body;

  if (!name) return "name is required";

  if (!ruleType) return "ruleType is required";

  if (!weekConfig?.weekStartDay)
    return "weekStartDay is required";

  if (!dateRange?.startDate || !dateRange?.endDate)
    return "dateRange is required";

  if (!isValidDate(dateRange.startDate) || !isValidDate(dateRange.endDate))
    return "Invalid date format";

  // ✅ PINCODE REQUIRED
  if (!pincodeIds || !Array.isArray(pincodeIds) || pincodeIds.length === 0) {
    return "pincodeIds is required and must be a non-empty array";
  }

  if (ruleType === "SLAB") {
    if (!slabs || slabs.length === 0) {
      return "slabs required for SLAB";
    }
  }

  if (ruleType === "FIXED_TARGET" && !target)
    return "target required for FIXED_TARGET";

  if (ruleType === "FIXED_TARGET" && !reward?.amount)
    return "reward.amount required";

  return null;
};

// ================= CREATE =================

exports.createWeeklyIncentive = async (req, res) => {
  try {
    const error = validateRequest(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const {
      name,
      cityId,
      pincodeIds,
      weekConfig,
      dateRange,
      ruleType,
      slabs,
      target,
      reward,
      conditions,
      consistencyRule,
      constraints,
      maxPayoutPerWeek,
      isActive
    } = req.body;

    const newStart = new Date(dateRange.startDate);
    const newEnd = new Date(dateRange.endDate);

    // ================= CONFLICT CHECK =================

   const existingPrograms = await prisma.program.findMany({
  where: {
    programType: "WEEKLY_TARGET",
    trackingType: "WEEKLY",
    isActive: true,
    validTill: { gte: new Date() }, // ✅ KEY FIX
    pincodeIds: {
      hasSome: pincodeIds
    }
  }
});

    for (const prog of existingPrograms) {
      const oldStart = new Date(prog.validFrom);
      const oldEnd = new Date(prog.validTill);

      const overlap =
        newStart <= oldEnd && newEnd >= oldStart;

      if (overlap) {
        return res.status(400).json({
          success: false,
          message:
            "Active weekly incentive already exists for this pincode in this date range"
        });
      }
    }

    // ================= OPTIONAL CONSTRAINTS =================

    const minAcceptanceRate =
      constraints?.minAcceptanceRate ??
      conditions?.minAcceptanceRate ??
      null;

    const minCompletionRate =
      constraints?.minCompletionRate ??
      conditions?.minCompletionRate ??
      null;

    // ================= CREATE =================

    const program = await prisma.program.create({
      data: {
        name,
        programType: "WEEKLY_TARGET",
        trackingType: "WEEKLY",
        ruleType,

        cityId: cityId ? [cityId] : [],
        pincodeIds,

        weekStartDay: weekConfig.weekStartDay,
        daysOfWeek: ["MON","TUE","WED","THU","FRI","SAT","SUN"],

        validFrom: newStart,
        validTill: newEnd,

        minAcceptanceRate,
        minCompletionRate,

        maxPayoutPerWeek,
        isActive: isActive ?? true,

        // ===== SLAB =====
        slabs: slabs?.length
          ? {
              create: slabs.map((s) => ({
                minValue: s.minOrders,
                maxValue: s.maxOrders,
                rewardAmount: s.rewardAmount
              }))
            }
          : undefined,

        // ===== FIXED TARGET =====
        targets: target
          ? {
              create: {
                targetOrders: target.orders,
                rewardAmount: reward?.amount || 0
              }
            }
          : undefined,

        // ===== HYBRID =====
        rules: conditions
          ? {
              create: {
                minOrders: conditions.minOrders,
                minEarnings: conditions.minEarnings
              }
            }
          : undefined,

        // ===== CONSISTENCY =====
        consistency: consistencyRule
          ? {
              create: {
                minActiveDays: consistencyRule.minActiveDays,
                minOrdersPerDay: consistencyRule.minOrdersPerDay
              }
            }
          : undefined
      }
    });

    return res.json({
      success: true,
      message: "Weekly incentive created successfully",
      data: {
        id: program.id,
        name: program.name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal error" });
  }
};
exports.updateWeeklyIncentive = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await prisma.program.findUnique({
      where: { id }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    // ❌ SLAB VALIDATION
    if (req.body.slabs) {
      if (!Array.isArray(req.body.slabs) || req.body.slabs.length === 0) {
        return res.status(400).json({
          success: false,
          message: "slabs must be a non-empty array"
        });
      }
    }

    // ❌ TARGET VALIDATION
    if (req.body.target && !req.body.reward?.amount) {
      return res.status(400).json({
        success: false,
        message: "reward.amount required with target"
      });
    }

    // ================= STATUS CHECK =================
    const now = new Date();

    let status;
    if (!program.isActive) status = "DISABLED";
    else if (now < program.validFrom) status = "UPCOMING";
    else if (now > program.validTill) status = "EXPIRED";
    else status = "RUNNING";

    if (status !== "UPCOMING") {
      return res.status(400).json({
        success: false,
        message: `Cannot update program. Status is ${status}`
      });
    }

    const {
      name,
      dateRange,
      isActive,
      slabs,
      target,
      reward,
      conditions,
      consistencyRule
    } = req.body;

    const updatedProgram = await prisma.$transaction(async (tx) => {

      // ================= MAIN UPDATE =================
     const updated = await tx.program.update({
  where: { id },
  data: {
    name,
    validFrom: dateRange?.startDate
      ? new Date(dateRange.startDate)
      : undefined,
    validTill: dateRange?.endDate
      ? new Date(dateRange.endDate)
      : undefined,
    isActive
  },
  include: {
    slabs: true   // 👈 THIS IS THE FIX
  }
});

// ================= SLABS =================
if (slabs) {

  const normalizedSlabs = slabs.map((s, index) => {

    // ❌ require ALL fields
    if (
      s.minOrders == null ||
      s.maxOrders == null ||
      s.rewardAmount == null
    ) {
      throw new Error(
        `Invalid slab at index ${index}. minOrders, maxOrders, rewardAmount are required`
      );
    }

    // ❌ invalid range
    if (s.minOrders > s.maxOrders) {
      throw new Error(
        `Invalid slab at index ${index}. minOrders cannot be greater than maxOrders`
      );
    }

    return {
      programId: id,
      minValue: s.minOrders,
      maxValue: s.maxOrders,
      rewardAmount: s.rewardAmount
    };
  });

  // 🔥 Replace slabs completely (STRICT MODE)
  await tx.programSlab.deleteMany({
    where: { programId: id }
  });

  await tx.programSlab.createMany({
    data: normalizedSlabs
  });
}

      // ================= TARGET =================
      if (target) {
        await tx.programTarget.deleteMany({
          where: { programId: id }
        });

        await tx.programTarget.create({
          data: {
            programId: id,
            targetOrders: target.orders,
            rewardAmount: reward?.amount || 0
          }
        });
      }

      // ================= HYBRID =================
      if (conditions) {
        await tx.programRule.deleteMany({
          where: { programId: id }
        });

        await tx.programRule.create({
          data: {
            programId: id,
            minOrders: conditions.minOrders,
            minEarnings: conditions.minEarnings
          }
        });
      }

      // ================= CONSISTENCY =================
      if (consistencyRule) {
        await tx.programConsistency.deleteMany({
          where: { programId: id }
        });

        await tx.programConsistency.create({
          data: {
            programId: id,
            minActiveDays: consistencyRule.minActiveDays,
            minOrdersPerDay: consistencyRule.minOrdersPerDay
          }
        });
      }

      return updated;
    });

    return res.json({
      success: true,
      message: "Program updated successfully",
      data: updatedProgram
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update program"
    });
  }
};
// ================= GET ALL =================

exports.getAllWeeklyIncentives = async (req, res) => {
  try {
    const programs = await prisma.program.findMany({
      where: {
        programType: "WEEKLY_TARGET",
        trackingType: "WEEKLY"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const response = programs.map(p => ({
      id: p.id,
      name: p.name,
      ruleType: p.ruleType,
      isActive: p.isActive,
      status: getProgramStatus(p) // ✅ KEY ADDITION
    }));

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch" });
  }
};

// ================= GET BY ID =================

exports.getWeeklyIncentiveById = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        slabs: true,
        targets: true,
        rules: true,
        consistency: true
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    const response = {
      id: program.id,
      name: program.name,
      ruleType: program.ruleType,
      status: getProgramStatus(program) // ✅ STATUS HERE ALSO
    };

    if (program.ruleType === "SLAB" && program.slabs?.length) {
      response.slabs = program.slabs.map(s => ({
        minOrders: s.minValue,
        maxOrders: s.maxValue,
        rewardAmount: s.rewardAmount
      }));
    }

    if (program.ruleType === "FIXED_TARGET" && program.targets?.[0]) {
      response.target = {
        orders: program.targets[0].targetOrders
      };
      response.reward = {
        amount: program.targets[0].rewardAmount
      };
    }

    if (program.ruleType === "HYBRID" && program.rules?.[0]) {
      response.conditions = {
        minOrders: program.rules[0].minOrders,
        minEarnings: program.rules[0].minEarnings
      };
    }

    if (program.consistency) {
      response.consistencyRule = {
        minActiveDays: program.consistency.minActiveDays,
        minOrdersPerDay: program.consistency.minOrdersPerDay
      };
    }

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch details" });
  }
};
exports.deleteWeeklyIncentive = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch program
    const program = await prisma.program.findUnique({
      where: { id }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    // 2. Get status
    const now = new Date();

    let status;
    if (!program.isActive) status = "DISABLED";
    else if (now < program.validFrom) status = "UPCOMING";
    else if (now > program.validTill) status = "EXPIRED";
    else status = "RUNNING";

    // 3. Restrict delete
    if (status !== "UPCOMING") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete program. Status is ${status}`
      });
    }

    // 4. Delete
    await prisma.program.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: "Program deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete program"
    });
  }
};