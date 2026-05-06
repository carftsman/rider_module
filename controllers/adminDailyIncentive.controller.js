// controllers/adminDailyIncentive.controller.js

const prisma = require("../config/prisma");

// DATE VALIDATION

function isValidDateString(dateStr) {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  const [year, month, day] = dateStr.split("-").map(Number);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

// CREATE DAILY INCENTIVE

exports.createDailyIncentive = async (req, res) => {
  try {
    const {
      name,
      cityId,
      pincodeIds = [],
      dateRange,
      daysOfWeek = [],
      ruleType,
      slabs,
      target,
      reward,
      conditions,
      constraints,
      maxPayoutPerDay,
      isActive = true
    } = req.body;

    // BASIC VALIDATION
   

    if (!name || !ruleType || !dateRange) {
      return res.status(400).json({
        success: false,
        message: "name, ruleType and dateRange are required"
      });
    }

    if ((!pincodeIds || pincodeIds.length === 0) && !cityId) {
      return res.status(400).json({
        success: false,
        message: "Either pincodeIds or cityId is required"
      });
    }

    if (ruleType === "SLAB" && (!daysOfWeek || daysOfWeek.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "daysOfWeek is required for SLAB incentives"
      });
    }

    const { startDate, endDate } = dateRange;

    // DATE VALIDATION
    

    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format or invalid calendar date"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be greater than endDate"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be in the past"
      });
    }

    // RULE VALIDATION
  

    if (!["SLAB", "FIXED_TARGET", "HYBRID"].includes(ruleType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ruleType"
      });
    }

    if (ruleType === "SLAB") {
      if (!slabs || slabs.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Slabs are required"
        });
      }

      for (const slab of slabs) {
        if (slab.minOrders <= 0 || slab.maxOrders <= 0) {
          return res.status(400).json({
            success: false,
            message: "Orders must be greater than 0"
          });
        }

        if (slab.minOrders > slab.maxOrders) {
          return res.status(400).json({
            success: false,
            message: "minOrders cannot be greater than maxOrders"
          });
        }
      }
    }

    // DUPLICATE CHECK (FINAL FIX)
    // SAME PINCODE BLOCK
    if (pincodeIds && pincodeIds.length > 0) {
      const existingPincode = await prisma.program.findFirst({
        where: {
          programType: "DAILY_TARGET",
          trackingType: "DAILY",
          ruleType: {
            in: ["SLAB", "FIXED_TARGET", "HYBRID"]
          },
          isActive: true,
          AND: [
            { validFrom: { lte: end } },
            { validTill: { gte: start } }
          ],
          pincodeIds: {
            hasSome: pincodeIds
          }
        }
      });

      if (existingPincode) {
        return res.status(400).json({
          success: false,
          message: "Incentive already exists for this pincode and date range"
        });
      }
    }

    // CITY BLOCK (covers city + pincode conflicts)
    if (cityId) {
      const existingCity = await prisma.program.findFirst({
        where: {
          programType: "DAILY_TARGET",
          trackingType: "DAILY",
          ruleType: {
            in: ["SLAB", "FIXED_TARGET", "HYBRID"]
          },
          isActive: true,
          AND: [
            { validFrom: { lte: end } },
            { validTill: { gte: start } }
          ],
          cityId: {
            has: cityId
          }
        }
      });

      if (existingCity) {
        return res.status(400).json({
          success: false,
          message: "Incentive already exists for this city and date range"
        });
      }
    }

    // BUILD DATA


    const weekStartDay = daysOfWeek?.[0] || "MON";

    const programData = {
      name,
      programType: "DAILY_TARGET",
      trackingType: "DAILY",
      ruleType,
      cityId: cityId ? [cityId] : [],
      pincodeIds,
      validFrom: start,
      validTill: end,
      daysOfWeek,
      weekStartDay,
      minAcceptanceRate:
        constraints?.minAcceptanceRate || conditions?.minAcceptanceRate,
      minCompletionRate:
        constraints?.minCompletionRate || conditions?.minCompletionRate,
      maxPayoutPerDay,
      isActive
    };

    // RULE HANDLING

    if (ruleType === "SLAB") {
      programData.slabs = {
        create: slabs.map((s) => ({
          minValue: s.minOrders,
          maxValue: s.maxOrders,
          rewardAmount: s.rewardAmount
        }))
      };
    }

    if (ruleType === "FIXED_TARGET") {
      programData.targets = {
        create: {
          targetOrders: target?.orders,
          rewardAmount: reward?.amount
        }
      };
    }

    if (ruleType === "HYBRID") {
      if (conditions) {
        programData.rules = {
          create: {
            minOrders: conditions.minOrders,
            minEarnings: conditions.minEarnings
          }
        };
      }

      if (reward) {
        programData.targets = {
          create: {
            rewardAmount: reward.amount
          }
        };
      }
    }

    // CREATE
    

    const program = await prisma.program.create({
      data: programData
    });

    return res.status(201).json({
      success: true,
      message: "Daily incentive created successfully",
      data: {
        id: program.id,
        name: program.name
      }
    });

  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

// UPDATE DAILY INCENTIVE
exports.updateDailyIncentive = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.program.update({
      where: { id },
      data: req.body
    });

    return res.json({
      success: true,
      message: "Daily incentive updated",
      data: updated
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL DAILY INCENTIVES

exports.getAllDailyIncentives = async (req, res) => {
  try {
    const programs = await prisma.program.findMany({
      where: {
        programType: "DAILY_TARGET",
        trackingType: "DAILY",

        //  EXCLUDE PEAK SLOT PROGRAMS
        slots: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        ruleType: true,
        isActive: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      data: programs
    });

  } catch (error) {
    console.error("GET ALL ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
// GET DAILY INCENTIVE DETAILS
exports.getDailyIncentiveById = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await prisma.program.findFirst({
      where: {
        id,
        programType: "DAILY_TARGET",
        trackingType: "DAILY",

        //exclude peak slots
        slots: { none: {} }
      },
      include: {
        slabs: true,
        rules: true,
        targets: true
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Daily incentive not found"
      });
    }
    const formatDate = (date) =>
      date ? date.toISOString().split("T")[0] : null;
    // FORMAT RESPONSE
    

    const response = {
      id: program.id,
      name: program.name,
      type: "DAILY",
      cityId: program.cityId?.[0] || null,
      pincodeIds: program.pincodeIds || [],

      dateRange: {
        startDate: formatDate(program.validFrom),
        endDate: formatDate(program.validTill)
      },

      ruleType: program.ruleType,
      isActive: program.isActive
    };
    if (program.maxPayoutPerDay != null) {
      response.maxPayoutPerDay = program.maxPayoutPerDay;
    }

    // SLAB
  
    if (program.ruleType === "SLAB") {
      response.slabs = program.slabs.map(s => ({
        minOrders: s.minValue,
        maxOrders: s.maxValue,
        rewardAmount: s.rewardAmount
      }));
    }

    // FIXED TARGET
 
    if (program.ruleType === "FIXED_TARGET") {
      response.target = {
        orders: program.targets?.[0]?.targetOrders || null
      };

      response.reward = {
        amount: program.targets?.[0]?.rewardAmount || null
      };
    }

    // HYBRID
   
    if (program.ruleType === "HYBRID") {
      response.conditions = {
        minOrders: program.rules?.[0]?.minOrders || null,
        minEarnings: program.rules?.[0]?.minEarnings || null,
        minAcceptanceRate: program.minAcceptanceRate || null,
        minCompletionRate: program.minCompletionRate || null
      };

      response.reward = {
        amount: program.targets?.[0]?.rewardAmount || null
      };
    }

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error("GET ONE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.deleteDailyIncentive = async (req, res) => {
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

    const now = new Date();

    // Start of today (00:00)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Start of tomorrow (00:00)
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    /**
     * RULE:
     * Allow delete ONLY if program is for future (>= tomorrow)
     */
    if (program.validFrom < startOfTomorrow) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete today's or past incentives"
      });
    }

    // 2. Delete
    await prisma.program.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: "Daily incentive deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete daily incentive"
    });
  }
};