const prisma = require("../config/prisma");

// ================= COMMON VALIDATIONS =================

function validateDateRange(validFrom, validTill) {
  if (new Date(validTill) <= new Date(validFrom)) {
    throw {
      status: 400,
      message: "validTill must be greater than validFrom"
    };
  }
}

function validateSlabs(slabs, minOrders) {
  if (!slabs || slabs.length === 0) {
    throw { status: 400, message: "Slabs are required" };
  }

  // sort slabs
  slabs.sort((a, b) => a.minOrders - b.minOrders);

  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];

    if (slab.minOrders < minOrders) {
      throw {
        status: 400,
        message: "Slab minOrders must be >= minOrdersPerDay"
      };
    }

    if (slab.minOrders > slab.maxOrders) {
      throw {
        status: 400,
        message: "Invalid slab range"
      };
    }

    if (i > 0 && slabs[i - 1].maxOrders >= slab.minOrders) {
      throw {
        status: 400,
        message: "Slabs should not overlap"
      };
    }
  }
}


exports.createDailyIncentive = async (req, res) => {
  try {
    const {
      title,
      description,
      validFrom,
      validTill,
      applicableCities = [],
      applicableZones = [],
      minOrdersPerDay,
      minPeakSlots = 0,
      minNormalSlots = 0,
      payoutTiming,
      slabs = []
    } = req.body;

    // ================= VALIDATIONS =================

    if (!title || !validFrom || !validTill) {
      return res.status(400).json({ message: "title, validFrom, validTill are required" });
    }

    if (!minOrdersPerDay) {
      return res.status(400).json({ message: "minOrdersPerDay is required" });
    }

    if (!Array.isArray(slabs) || slabs.length === 0) {
      return res.status(400).json({ message: "At least one slab is required" });
    }

    const fromDate = new Date(validFrom);
    const tillDate = new Date(validTill);

    if (isNaN(fromDate) || isNaN(tillDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (fromDate >= tillDate) {
      return res.status(400).json({ message: "validFrom must be less than validTill" });
    }

    if (minPeakSlots < 0 || minNormalSlots < 0) {
      return res.status(400).json({ message: "Invalid slot configuration" });
    }

    // ✅ Normalize (IMPORTANT)
    const normalizedCities =
      applicableCities.length > 0 ? applicableCities : ["ALL"];

    const normalizedZones =
      applicableZones.length > 0 ? applicableZones : ["ALL"];

    // ================= SLAB VALIDATION =================

    slabs.sort((a, b) => a.minOrders - b.minOrders);

    let lastMax = minOrdersPerDay - 1;

    for (let slab of slabs) {
      if (slab.minOrders > slab.maxOrders) {
        return res.status(400).json({
          message: "Invalid slab: minOrders cannot be greater than maxOrders"
        });
      }

      if (slab.minOrders <= lastMax) {
        return res.status(400).json({
          message: "Slabs are overlapping or not in sequence"
        });
      }

      lastMax = slab.maxOrders;
    }

    // ================= TRANSACTION =================

    const result = await prisma.$transaction(async (tx) => {

      // 🔍 CHECK EXISTING OVERLAP
      const existing = await tx.incentive.findFirst({
        where: {
          incentiveType: "DAILY_TARGET",

          validFrom: { lte: tillDate },
          validTill: { gte: fromDate },

          applicableCities: {
            hasSome: normalizedCities
          },
          applicableZones: {
            hasSome: normalizedZones
          }
        },
        include: { slabs: true }
      });

      // ================= IF EXISTS =================

      if (existing) {
        // ❌ LOCKED
        if (existing.isLocked) {
          throw {
            status: 400,
            message: "Incentive already locked, cannot modify"
          };
        }

        // ❌ ACTIVE (already started)
        if (new Date() >= existing.validFrom) {
          throw {
            status: 400,
            message: "Incentive already active, cannot modify"
          };
        }

        // 🔁 REPLACE FLOW

        // delete old slabs
        await tx.incentiveSlab.deleteMany({
          where: { incentiveId: existing.id }
        });

        // update incentive
        const updated = await tx.incentive.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            validFrom: fromDate,
            validTill: tillDate,
            applicableCities: normalizedCities,
            applicableZones: normalizedZones,
            minOrdersPerDay,
            minPeakSlots,
            minNormalSlots,
            payoutTiming
          }
        });

        // insert new slabs
        await tx.incentiveSlab.createMany({
          data: slabs.map(s => ({
            incentiveId: existing.id,
            slotType: s.slotType || "NORMAL",
            minOrders: s.minOrders,
            maxOrders: s.maxOrders,
            rewardAmount: s.rewardAmount
          }))
        });

        return {
          type: "UPDATED",
          data: updated
        };
      }

      // ================= CREATE NEW =================

      const created = await tx.incentive.create({
        data: {
          title,
          description,
          incentiveType: "DAILY_TARGET",
          validFrom: fromDate,
          validTill: tillDate,
          applicableCities: normalizedCities,
          applicableZones: normalizedZones,
          minOrdersPerDay,
          minPeakSlots,
          minNormalSlots,
          payoutTiming,
          slabs: {
            create: slabs.map(s => ({
              slotType: s.slotType || "NORMAL",
              minOrders: s.minOrders,
              maxOrders: s.maxOrders,
              rewardAmount: s.rewardAmount
            }))
          }
        },
        include: { slabs: true }
      });

      return {
        type: "CREATED",
        data: created
      };

    }, {
      isolationLevel: "Serializable"
    });

    // ================= RESPONSE =================

    return res.status(result.type === "CREATED" ? 201 : 200).json({
      message:
        result.type === "CREATED"
          ? "Daily incentive created"
          : "Existing incentive replaced",
      data: result.data
    });

  } catch (err) {
    console.error(err);

    return res.status(err.status || 500).json({
      message: err.message || "Internal server error"
    });
  }
};

exports.createWeeklyIncentive = async (req, res) => {
  try {
    const {
      title,
      description,
      validFrom,
      validTill,
      applicableCities = [],
      applicableZones = [],
      totalDaysInWeek,
      minOrdersPerDay,
      minPeakSlots = 0,
      minNormalSlots = 0,
      payoutTiming,
      slabs = []
    } = req.body;

    // ================= VALIDATIONS =================

    if (!title || !validFrom || !validTill) {
      return res.status(400).json({
        message: "title, validFrom, validTill are required"
      });
    }

    if (!totalDaysInWeek || totalDaysInWeek < 1 || totalDaysInWeek > 7) {
      return res.status(400).json({
        message: "totalDaysInWeek must be between 1 and 7"
      });
    }

    if (!minOrdersPerDay) {
      return res.status(400).json({
        message: "minOrdersPerDay is required"
      });
    }

    if (!Array.isArray(slabs) || slabs.length === 0) {
      return res.status(400).json({
        message: "At least one slab is required"
      });
    }

    const fromDate = new Date(validFrom);
    const tillDate = new Date(validTill);

    if (isNaN(fromDate) || isNaN(tillDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (fromDate >= tillDate) {
      return res.status(400).json({
        message: "validFrom must be less than validTill"
      });
    }

    if (minPeakSlots < 0 || minNormalSlots < 0) {
      return res.status(400).json({
        message: "Invalid slot configuration"
      });
    }

    // ✅ Normalize (IMPORTANT)
    const normalizedCities =
      applicableCities.length > 0 ? applicableCities : ["ALL"];

    const normalizedZones =
      applicableZones.length > 0 ? applicableZones : ["ALL"];

    // ================= SLAB VALIDATION =================

    slabs.sort((a, b) => a.minOrders - b.minOrders);

    let lastMax = minOrdersPerDay - 1;

    for (let slab of slabs) {
      if (slab.minOrders > slab.maxOrders) {
        return res.status(400).json({
          message: "Invalid slab: minOrders cannot be greater than maxOrders"
        });
      }

      if (slab.minOrders <= lastMax) {
        return res.status(400).json({
          message: "Slabs are overlapping or not in sequence"
        });
      }

      lastMax = slab.maxOrders;
    }

    // ================= TRANSACTION =================

    const result = await prisma.$transaction(async (tx) => {

      // 🔍 CHECK OVERLAP
      const existing = await tx.incentive.findFirst({
        where: {
          incentiveType: "WEEKLY_TARGET",

          validFrom: { lte: tillDate },
          validTill: { gte: fromDate },

          applicableCities: {
            hasSome: normalizedCities
          },
          applicableZones: {
            hasSome: normalizedZones
          }
        },
        include: { slabs: true }
      });

      // ================= IF EXISTS =================

      if (existing) {
        // ❌ LOCKED
        if (existing.isLocked) {
          throw {
            status: 400,
            message: "Incentive already locked, cannot modify"
          };
        }

        // ❌ ACTIVE
        if (new Date() >= existing.validFrom) {
          throw {
            status: 400,
            message: "Incentive already active, cannot modify"
          };
        }

        // 🔁 REPLACE FLOW

        await tx.incentiveSlab.deleteMany({
          where: { incentiveId: existing.id }
        });

        const updated = await tx.incentive.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            validFrom: fromDate,
            validTill: tillDate,
            applicableCities: normalizedCities,
            applicableZones: normalizedZones,
            totalDaysInWeek,
            minOrdersPerDay,
            minPeakSlots,
            minNormalSlots,
            payoutTiming
          }
        });

        await tx.incentiveSlab.createMany({
          data: slabs.map(s => ({
            incentiveId: existing.id,
            slotType: s.slotType || "NORMAL",
            minOrders: s.minOrders,
            maxOrders: s.maxOrders,
            rewardAmount: s.rewardAmount
          }))
        });

        return {
          type: "UPDATED",
          data: updated
        };
      }

      // ================= CREATE NEW =================

      const created = await tx.incentive.create({
        data: {
          title,
          description,
          incentiveType: "WEEKLY_TARGET",
          validFrom: fromDate,
          validTill: tillDate,
          applicableCities: normalizedCities,
          applicableZones: normalizedZones,
          totalDaysInWeek,
          minOrdersPerDay,
          minPeakSlots,
          minNormalSlots,
          payoutTiming,
          slabs: {
            create: slabs.map(s => ({
              slotType: s.slotType || "NORMAL",
              minOrders: s.minOrders,
              maxOrders: s.maxOrders,
              rewardAmount: s.rewardAmount
            }))
          }
        },
        include: { slabs: true }
      });

      return {
        type: "CREATED",
        data: created
      };

    }, {
      isolationLevel: "Serializable"
    });

    // ================= RESPONSE =================

    return res.status(result.type === "CREATED" ? 201 : 200).json({
      message:
        result.type === "CREATED"
          ? "Weekly incentive created"
          : "Existing incentive replaced",
      data: result.data
    });

  } catch (err) {
    console.error(err);

    return res.status(err.status || 500).json({
      message: err.message || "Internal server error"
    });
  }
};


exports.createPeakIncentive = async (req, res) => {
  try {
    const {
      title,
      description,
      validFrom,
      validTill,
      applicableCities = [],
      applicableZones = [],
      minPeakSlots,
      payoutTiming,
      slabs = []
    } = req.body;

    // ================= VALIDATIONS =================

    if (!title || !validFrom || !validTill) {
      return res.status(400).json({
        message: "title, validFrom, validTill are required"
      });
    }

    if (!minPeakSlots || minPeakSlots < 1) {
      return res.status(400).json({
        message: "minPeakSlots must be greater than 0"
      });
    }

    if (!Array.isArray(slabs) || slabs.length === 0) {
      return res.status(400).json({
        message: "Slabs are required"
      });
    }

    const fromDate = new Date(validFrom);
    const tillDate = new Date(validTill);

    if (isNaN(fromDate) || isNaN(tillDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (fromDate >= tillDate) {
      return res.status(400).json({
        message: "validFrom must be less than validTill"
      });
    }

    // ✅ Normalize (IMPORTANT)
    const normalizedCities =
      applicableCities.length > 0 ? applicableCities : ["ALL"];

    const normalizedZones =
      applicableZones.length > 0 ? applicableZones : ["ALL"];

    // ================= SLAB VALIDATION =================

    slabs.sort((a, b) => a.minOrders - b.minOrders);

    let lastMax = 0;

    for (let slab of slabs) {
      if (slab.slotType !== "PEAK") {
        return res.status(400).json({
          message: "Only PEAK slotType allowed"
        });
      }

      if (slab.minOrders > slab.maxOrders) {
        return res.status(400).json({
          message: "Invalid slab: minOrders > maxOrders"
        });
      }

      if (slab.minOrders <= lastMax) {
        return res.status(400).json({
          message: "Slabs overlapping or not sequential"
        });
      }

      lastMax = slab.maxOrders;
    }

    // ================= TRANSACTION =================

    const result = await prisma.$transaction(async (tx) => {

      // 🔍 CHECK OVERLAP
      const existing = await tx.incentive.findFirst({
        where: {
          incentiveType: "PEAK_SLOT",

          validFrom: { lte: tillDate },
          validTill: { gte: fromDate },

          applicableCities: {
            hasSome: normalizedCities
          },
          applicableZones: {
            hasSome: normalizedZones
          }
        },
        include: { slabs: true }
      });

      // ================= IF EXISTS =================

      if (existing) {
        // ❌ LOCKED
        if (existing.isLocked) {
          throw {
            status: 400,
            message: "Incentive already locked, cannot modify"
          };
        }

        // ❌ ACTIVE
        if (new Date() >= existing.validFrom) {
          throw {
            status: 400,
            message: "Incentive already active, cannot modify"
          };
        }

        //REPLACE FLOW

        await tx.incentiveSlab.deleteMany({
          where: { incentiveId: existing.id }
        });

        const updated = await tx.incentive.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            validFrom: fromDate,
            validTill: tillDate,
            applicableCities: normalizedCities,
            applicableZones: normalizedZones,
            peakSlotEnabled: true,
            minPeakSlots,
            payoutTiming
          }
        });

        await tx.incentiveSlab.createMany({
          data: slabs.map(s => ({
            incentiveId: existing.id,
            slotType: "PEAK",
            minOrders: s.minOrders,
            maxOrders: s.maxOrders,
            rewardAmount: s.rewardAmount
          }))
        });

        return {
          type: "UPDATED",
          data: updated
        };
      }

      // ================= CREATE NEW =================

      const created = await tx.incentive.create({
        data: {
          title,
          description,
          incentiveType: "PEAK_SLOT",
          validFrom: fromDate,
          validTill: tillDate,
          applicableCities: normalizedCities,
          applicableZones: normalizedZones,
          peakSlotEnabled: true,
          minPeakSlots,
          payoutTiming,
          slabs: {
            create: slabs.map(s => ({
              slotType: "PEAK",
              minOrders: s.minOrders,
              maxOrders: s.maxOrders,
              rewardAmount: s.rewardAmount
            }))
          }
        },
        include: { slabs: true }
      });

      return {
        type: "CREATED",
        data: created
      };

    }, {
      isolationLevel: "Serializable"
    });

    // ================= RESPONSE =================

    return res.status(result.type === "CREATED" ? 201 : 200).json({
      message:
        result.type === "CREATED"
          ? "Peak incentive created"
          : "Existing peak incentive replaced",
      data: result.data
    });

  } catch (err) {
    console.error(err);

    return res.status(err.status || 500).json({
      message: err.message || "Internal server error"
    });
  }
};

// exports.deleteIncentive = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const incentive = await prisma.incentive.findUnique({
//       where: { id },
//       include: {
//         payouts: true,
//         progress: true
//       }
//     });

//     //Not found
//     if (!incentive) {
//       return res.status(404).json({
//         message: "Incentive not found"
//       });
//     }

//     // Prevent delete if locked
//     if (incentive.isLocked) {
//       return res.status(400).json({
//         message: "Cannot delete locked incentive"
//       });
//     }

//     // Prevent delete if payouts exist
//     if (incentive.payouts.length > 0) {
//       return res.status(400).json({
//         message: "Cannot delete incentive with payouts"
//       });
//     }

//     //Prevent delete if progress exists
//     if (incentive.progress.length > 0) {
//       return res.status(400).json({
//         message: "Cannot delete incentive with active progress"
//       });
//     }

//     //  DELETE (hard delete)
//     await prisma.incentive.delete({
//       where: { id }
//     });

//     return res.status(200).json({
//       message: "Incentive deleted successfully"
//     });

//   } catch (err) {
//     return res.status(500).json({
//       message: "Error deleting incentive"
//     });
//   }
// };


exports.deleteIncentive = async (req, res) => {
  try {
    const { id } = req.params;

    const incentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        payouts: true,
        progress: true,
        slabs: true
      }
    });

    // ❌ NOT FOUND
    if (!incentive) {
      return res.status(404).json({
        message: "Incentive not found"
      });
    }

    // ❌ LOCKED
    if (incentive.isLocked) {
      return res.status(400).json({
        message: "Cannot delete locked incentive"
      });
    }

    const now = new Date();

    // ❌ RUNNING OR PAST
    if (now >= incentive.validFrom) {
      return res.status(400).json({
        message: "Cannot delete running or past incentive"
      });
    }

    // ❌ HAS PAYOUTS
    if (incentive.payouts.length > 0) {
      return res.status(400).json({
        message: "Cannot delete incentive with payouts"
      });
    }

    // ❌ HAS PROGRESS
    if (incentive.progress.length > 0) {
      return res.status(400).json({
        message: "Cannot delete incentive with rider progress"
      });
    }

    // ✅ TRANSACTION DELETE (IMPORTANT)
    await prisma.$transaction([
      // delete slabs first
      prisma.incentiveSlab.deleteMany({
        where: { incentiveId: id }
      }),

      // delete incentive
      prisma.incentive.delete({
        where: { id }
      })
    ]);

    return res.status(200).json({
      message: "Incentive deleted successfully"
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message || "Error deleting incentive"
    });
  }
};


// exports.getIncentiveById = async (req, res) => {
//     console.log("Route hit");
//     console.log(req.params.id);
//   try {
//     const { id } = req.params;

//     const incentive = await prisma.incentive.findUnique({
//       where: { id },
//       include: {
//         slabs: true,
//         payouts: true,
//         progress: true
//       }
//     });

//     if (!incentive) {
//       return res.status(404).json({
//         message: "Incentive not found"
//       });
//     }

//     return res.status(200).json({
//       message: "Incentive fetched successfully",
//       data: incentive
//     });

//   } catch (err) {
//     return res.status(500).json({
//       message: "Error fetching incentive"
//     });
//   }
// };

exports.getIncentiveById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Incentive ID is required"
      });
    }

    const incentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        slabs: {
          orderBy: { minOrders: "asc" }
        },
        payouts: true,
        progress: true
      }
    });

    if (!incentive) {
      return res.status(404).json({
        message: "Incentive not found"
      });
    }

    // 🔥 ADD STATUS FLAGS (VERY USEFUL FOR UI)
    const now = new Date();

    const enriched = {
      ...incentive,
      isActive: incentive.validFrom <= now && incentive.validTill >= now,
      isUpcoming: now < incentive.validFrom,
      isExpired: now > incentive.validTill
    };

    return res.status(200).json({
      message: "Incentive fetched successfully",
      data: enriched
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message || "Error fetching incentive"
    });
  }
};


exports.getAllIncentives = async (req, res) => {
  try {
    const {
      type,
      status,
      locked,
      city,
      zone,
      search,
      page = 1,
      limit = 10,
      filter // active | upcoming | expired
    } = req.query;

    const skip = (page - 1) * limit;

    // ================= BUILD WHERE =================

    const where = {};

    // 🔹 TYPE FILTER
    if (type) {
      where.incentiveType = type;
    }

    // 🔹 STATUS FILTER
    if (status) {
      where.status = status;
    }

    // 🔹 LOCK FILTER
    if (locked !== undefined) {
      where.isLocked = locked === "true";
    }

    // 🔹 CITY FILTER
    if (city) {
      where.applicableCities = {
        hasSome: [city, "ALL"]
      };
    }

    // 🔹 ZONE FILTER
    if (zone) {
      where.applicableZones = {
        hasSome: [zone, "ALL"]
      };
    }

    // 🔹 SEARCH (TITLE)
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive"
      };
    }

    // 🔹 DATE FILTER
    const now = new Date();

    if (filter === "active") {
      where.validFrom = { lte: now };
      where.validTill = { gte: now };
    }

    if (filter === "upcoming") {
      where.validFrom = { gt: now };
    }

    if (filter === "expired") {
      where.validTill = { lt: now };
    }

    // ================= QUERY =================

    const [incentives, total] = await Promise.all([
      prisma.incentive.findMany({
        where,
        include: {
          slabs: true
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: Number(skip),
        take: Number(limit)
      }),

      prisma.incentive.count({ where })
    ]);

    // ================= RESPONSE =================

    return res.status(200).json({
      message: "Incentives fetched successfully",
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: incentives
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message || "Failed to fetch incentives"
    });
  }
};

exports.lockIncentive = async (req, res) => {
  try {
    const { id } = req.params;

    const incentive = await prisma.incentive.findUnique({
      where: { id }
    });

    if (!incentive) {
      return res.status(404).json({ message: "Incentive not found" });
    }

    if (incentive.isLocked) {
      return res.status(400).json({
        message: "Incentive already locked"
      });
    }

    const updated = await prisma.incentive.update({
      where: { id },
      data: {
        isLocked: true,
        lockedAt: new Date()
      }
    });

    return res.status(200).json({
      message: "Incentive locked successfully",
      data: updated
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message || "Internal server error"
    });
  }
};

exports.unlockIncentive = async (req, res) => {
  try {
    const { id } = req.params;

    const incentive = await prisma.incentive.findUnique({
      where: { id }
    });

    if (!incentive) {
      return res.status(404).json({
        message: "Incentive not found"
      });
    }

    if (!incentive.isLocked) {
      return res.status(400).json({
        message: "Incentive is already unlocked"
      });
    }

    const now = new Date();

    // ❌ DO NOT ALLOW IF ALREADY STARTED
    if (now >= incentive.validFrom) {
      return res.status(400).json({
        message: "Cannot unlock running or past incentive"
      });
    }

    const updated = await prisma.incentive.update({
      where: { id },
      data: {
        isLocked: false,
        lockedAt: null
      }
    });

    return res.status(200).json({
      message: "Incentive unlocked successfully",
      data: updated
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message || "Internal server error"
    });
  }
};