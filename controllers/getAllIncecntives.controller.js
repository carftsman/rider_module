const prisma = require("../config/prisma");
function formatMinutes24(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
exports.getAllIncentives = async (req, res) => {
  try {
    const { type, status } = req.query;

    const now = new Date();
    const riderId = req.rider.id;

    const riderLocation = await prisma.riderLocation.findUnique({
      where: { riderId }
    });


    const where = {
      AND: []
    };

    // TYPE + RANGE CONFIG
    const typeMap = {
      PEAK: "PEAK_SLOT",
      DAILY: "DAILY_TARGET",
      WEEKLY: "WEEKLY_TARGET"
    };

    const rangeMap = {
      PEAK_SLOT: 2,
      DAILY_TARGET: 7,
      WEEKLY_TARGET: 30
    };

    let selectedTypes = [];

    
    // TYPE FILTER
    
    if (type) {
      const dbType = typeMap[type];
      selectedTypes = [dbType];
      where.programType = dbType;
    } else {
      selectedTypes = Object.values(typeMap);
      where.programType = {
        in: selectedTypes
      };
    }

    
    // DATE RANGE FILTER
    
    const maxRangeDays = Math.max(
      ...selectedTypes.map((t) => rangeMap[t])
    );

    const maxDate = new Date(now);
    maxDate.setDate(now.getDate() + maxRangeDays);

    where.AND.push({
      AND: [
        {
          validFrom: { lte: maxDate }
        },
        {
          validTill: { gte: now }
        }
      ]
    });

    // RIDER LOCATION FILTER
    const locationFilters = [];

    if (riderLocation?.pincode) {
      locationFilters.push({
        pincodeIds: {
          has: riderLocation.pincode
        }
      });
    }

    if (riderLocation?.city) {
      locationFilters.push({
        cityId: {
          has: riderLocation.city
        }
      });
    }

    if (locationFilters.length > 0) {
      where.AND.push({
        OR: locationFilters
      });
    }

    // FETCH PROGRAMS

    const programs = await prisma.program.findMany({
      where,
      select: {
        id: true,
        name: true,
        programType: true,
        trackingType: true,
        ruleType: true,

        slots: {
          select: {
            startMinutes: true,
            endMinutes: true
          }
        },

        validFrom: true,
        validTill: true,
        isActive: true,

        progresses: {
          where: { riderId },
          select: {
            totalOrders: true,
            totalEarnings: true,
            achieved: true,
            rewardAmount: true
          }
        },

        programTaskProgresses: {
          where: { riderId },
          select: {
            taskId: true,
            progressValue: true,
            isCompleted: true
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      }
    });

// FLAT SLOT RESPONSE

const formatted = programs.flatMap((p) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const daysMap = {
    PEAK_SLOT: 2,
    DAILY_TARGET: 7,
    WEEKLY_TARGET: 30
  };

 let days;

if (p.programType === "WEEKLY_TARGET") {
  const till = new Date(p.validTill);

  days =
    Math.ceil(
      (till - now) / (1000 * 60 * 60 * 24)
    ) + 1;
} else {
  days = daysMap[p.programType] || 7;
}

  let result = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const dateStr =
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");

    const from = new Date(p.validFrom);
const till = new Date(p.validTill);

from.setHours(0, 0, 0, 0);
till.setHours(23, 59, 59, 999);
d.setHours(0, 0, 0, 0);

if (d < from || d > till) continue;

    // IF NO SLOTS (DAILY/WEEKLY CASE)
    if (!p.slots || p.slots.length === 0) {
      result.push({
        programId: p.id,
        name: p.name,
        type: p.programType,
        ruleType: p.ruleType,
        date: dateStr,
        slotId: `${p.id}-${dateStr}-full`,
        startMinutes: 0,
        endMinutes: 1439,
        isActive: i === 0 && currentMinutes >= 0,
timeLabel: `${p.validFrom.toISOString().split("T")[0]} → ${p.validTill.toISOString().split("T")[0]}`,
        status: i === 0 ? "ACTIVE" : "UPCOMING"
      });

      continue;
    }

    // SLOT BASED (PEAK)
    for (const slot of p.slots) {
  const isToday = i === 0;

  const isActive =
    isToday &&
    currentMinutes >= slot.startMinutes &&
    currentMinutes <= slot.endMinutes;

  const isUpcoming =
    !isToday ||
    currentMinutes < slot.startMinutes;

  // SKIP OLD COMPLETED SLOT
  if (!isActive && !isUpcoming) {
    continue;
  }

  result.push({
    programId: p.id,
    name: p.name,
    type: p.programType,
    ruleType: p.ruleType,
    date: dateStr,

    slotId: `${p.id}-${dateStr}-${slot.startMinutes}`,

    startMinutes: slot.startMinutes,
    endMinutes: slot.endMinutes,

    timeLabel: `${dateStr} ${formatMinutes24(
      slot.startMinutes
    )} - ${formatMinutes24(slot.endMinutes)}`,

    isActive,
    status: isActive ? "ACTIVE" : "UPCOMING"
  });
}
  }

  return result;
});

    
    // FILTER 
    
    const finalData = status
      ? formatted.filter((item) => item.status === status)
      : formatted;

    
    // RESPONSE
    
    return res.json({
      success: true,
      total: finalData.length,
      data: finalData
    });

  } catch (error) {
    console.error("GET ALL INCENTIVES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



exports.getCompletedIncentives = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const programs = await prisma.program.findMany({
      where: {
        progresses: {
          some: {
            riderId,
            achieved: true,
            rewardAmount: {
              gt: 0
            }
          }
        }
      },

      select: {
        id: true,
        name: true,
        programType: true,
        ruleType: true,

        progresses: {
          where: {
            riderId,
            achieved: true,
            rewardAmount: {
              gt: 0
            }
          },

          select: {
            id: true,
            rewardAmount: true,
            date: true,
            createdAt: true
          }
        }
      }
    });

    const completed = programs.flatMap((p) => {
      return p.progresses.map((pr) => ({
        progressId: pr.id,

        programId: p.id,
        name: p.name,
        type: p.programType,
        ruleType: p.ruleType,

        status: "COMPLETED",

        rewardAmount: Number(pr.rewardAmount || 0),

        date: pr.date,
        createdAt: pr.createdAt
      }));
    });

    return res.json({
      success: true,
      total: completed.length,
      data: completed
    });

  } catch (error) {
    console.error("GET COMPLETED INCENTIVES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
