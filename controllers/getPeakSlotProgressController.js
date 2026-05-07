const prisma = require("../config/prisma");

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const getPeakSlotProgress = async (req, res) => {
  try {
    const riderId = req.rider.id;

    // GET RIDER PINCODE

    const riderLocation = await prisma.riderLocation.findUnique({
      where: { riderId },
      select: { pincode: true },
    });

    if (!riderLocation?.pincode) {
      return res.status(400).json({
        success: false,
        message: "Rider pincode not found",
      });
    }

    const riderPincode = riderLocation.pincode;

    const today = new Date();

    // GET ACTIVE PROGRAMS

    const programs = await prisma.program.findMany({
      where: {
        isActive: true,

        programType: "PEAK_SLOT",

        trackingType: "DAILY",

        pincodeIds: {
          has: riderPincode,
        },

      },

      select: {
        id: true,

        ruleType: true,

        minAcceptanceRate: true,

        minCompletionRate: true,

        maxPayoutPerDay: true,

        slots: {
          include: {
            slabs: true,
          },
        },

        targets: true,
      },
    });

    if (!programs.length) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // CREATE / FETCH PROGRESS

    const progressMap = {};

    for (const p of programs) {
      let progProgress = await prisma.programProgress.findFirst({
        where: {
          riderId,
          programId: p.id,
        },
      });

      // CREATE EMPTY PROGRESS

      if (!progProgress) {
        progProgress = await prisma.programProgress.create({
          data: {
            riderId,

            programId: p.id,

            totalOrders: 0,

            totalEarnings: 0,

            rewardAmount: 0,

            achieved: false,
          },
        });
      }

      progressMap[p.id] = progProgress;
    }

    // BUILD RESPONSE

    const incentives = programs.flatMap((p) => {

      const progProgress = progressMap[p.id];

      const orders =
        progProgress?.totalOrders || 0;

      const earnings =
        progProgress?.totalEarnings || 0;

      // PER_ORDER + SLAB

      if (
        p.ruleType === "PER_ORDER" ||
        p.ruleType === "SLAB"
      ) {

        return p.slots.map((slot) => ({

          ruleType: p.ruleType,

          slotId: slot.id,

          time:
            `${minutesToTime(slot.startMinutes)} - ${minutesToTime(slot.endMinutes)}`,

          ordersCompleted: orders,

          reward:
            orders > 0
              ? orders * (slot.rewardPerOrder || 0)
              : 0,

          status:
            progProgress?.achieved
              ? "ACHIEVED"
              : orders > 0
              ? "IN_PROGRESS"
              : "NOT_STARTED"
        }));
      }

      // FIXED TARGET

      if (p.ruleType === "FIXED_TARGET") {

  const target = p.targets?.[0];

  const targetOrders =
    target?.targetOrders || 0;

  const rewardAmount =
    target?.rewardAmount || 0;

  return [{
  ruleType: "FIXED_TARGET",

  slotId: p.id,

  ordersCompleted: orders,

  rewardAmount:
  targetOrders > 0
    ? Math.floor(
        orders / targetOrders
      ) * rewardAmount
    : 0,

  status:
    orders >= targetOrders
      ? "ACHIEVED"
      : orders > 0
      ? "IN_PROGRESS"
      : "NOT_STARTED"
}];
}

      // HYBRID
if (p.ruleType === "HYBRID") {

  const target = p.targets?.[0];

  const targetOrders =
    target?.targetOrders || 0;

  const targetEarnings =
    target?.targetEarnings || 0;

  // CURRENT RIDER VALUES

  const acceptanceRate =
    progProgress?.acceptanceRate || 0;

  const completionRate =
    progProgress?.completionRate || 0;

  // ALL CONDITIONS CHECK

  const achieved =
    orders >= targetOrders &&
    earnings >= targetEarnings &&
    acceptanceRate >= (p.minAcceptanceRate || 0) &&
    completionRate >= (p.minCompletionRate || 0);

  return [{
    ruleType: "HYBRID",

    slotId: p.id,

    ordersCompleted: orders,


    rewardAmount:
      achieved
        ? target?.rewardAmount || 0
        : 0,

    status:
      achieved
        ? "ACHIEVED"
        : orders > 0 || earnings > 0
        ? "IN_PROGRESS"
        : "NOT_STARTED"
  }];
}
      return [];
    });

    return res.status(200).json({
      success: true,
      data: incentives,
    });

  } catch (error) {
    console.error("Peak slot progress error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// helper
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const getRiderPeakSlotPrograms = async (req, res) => {
  try {
    const riderId = req.rider.id;

    
    //  GET RIDER LOCATION
   
    const riderLocation = await prisma.riderLocation.findUnique({
      where: { riderId }
    });

    if (!riderLocation) {
      return res.json({ success: true, data: [] });
    }

    const riderPincode = riderLocation.pincode?.trim();
    const riderCityId = riderLocation.cityId || null;

    const now = new Date();
    const currentMinutes =
  now.getHours() * 60 + now.getMinutes();

    // FETCH PROGRAMS 
    
    let programs = [];

    const baseQuery = {
  programType: "PEAK_SLOT",

  isActive: true,

  validFrom: {
    lte: now
  },

  validTill: {
    gte: now
  }
};

    if (riderPincode) {
      programs = await prisma.program.findMany({
        where: {
          ...baseQuery,
          pincodeIds: { has: riderPincode }
        },
        include: {
  slots: {
    orderBy: {
      startMinutes: "asc"
    },
    include: {
      slabs: true
    }
  },

  targets: true
}
      });
    }

    // FALLBACK TO CITY
  // FALLBACK TO CITY

if (!programs.length && riderCityId) {

  programs = await prisma.program.findMany({

    where: {
      ...baseQuery,

      cityId: {
        has: riderCityId
      }
    },

    include: {

      slots: {
        orderBy: {
          startMinutes: "asc"
        },

        include: {
          slabs: true
        }
      },

      targets: true
    }
  });
}

    //REMOVE DUPLICATES
    
    const uniquePrograms = Array.from(
      new Map(programs.map(p => [p.id, p])).values()
    );

    // FETCH CITY NAMES (FROM cityId)
    
    const allCityIds = [
      ...new Set(uniquePrograms.flatMap(p => p.cityId || []))
    ];

    const cities = await prisma.city.findMany({
      where: { id: { in: allCityIds } },
      select: { id: true, name: true }
    });

    const cityMap = {};
    cities.forEach(c => {
      cityMap[c.id] = c.name;
    });

    // FETCH PINCODE → CITY
    
    const allPincodes = [
      ...new Set(uniquePrograms.flatMap(p => p.pincodeIds || []))
    ];

const pincodes = await prisma.pincode.findMany({
  where: {
    code: { in: allPincodes },
    ...(riderCityId && { cityId: riderCityId }) //  ADD THIS
  },
  include: { city: true }
});

   const pincodeCityMap = {};

for (const p of pincodes) {
  // only assign if not already set
  if (!pincodeCityMap[p.code]) {
    pincodeCityMap[p.code] = p.city?.name || null;
  }
}

    // FORMAT RESPONSE
    
    const response = uniquePrograms
  .map(program => {

    // CITY NAME LOGIC

    let cityName = null;

    if (program.cityId?.length) {
      cityName = cityMap[program.cityId[0]] || null;

    } else if (program.pincodeIds?.length) {

      cityName =
        pincodeCityMap[program.pincodeIds[0]] || null;
    }

    const base = {
      name: program.name,

      cityName,

      ruleType: program.ruleType,

      isActive: program.isActive
    };

    // PER_ORDER + SLAB

    if (
      program.ruleType === "PER_ORDER" ||
      program.ruleType === "SLAB"
    ) {

      return {
        ...base,

        slots: program.slots
  .filter(slot => {

    const start =
      slot.startMinutes;

    const end =
      slot.endMinutes;

    return (
      currentMinutes >= start &&
      currentMinutes <= end
    );
  })

  .map(slot => {

          const formattedSlot = {
            startTime: minutesToTime(slot.startMinutes),

            endTime: minutesToTime(slot.endMinutes),

            ruleType: slot.ruleType
          };

          // PER ORDER

          if (slot.ruleType === "PER_ORDER") {

            formattedSlot.reward = {
              amount: slot.rewardPerOrder || 0
            };
          }

          // SLAB

          if (slot.ruleType === "SLAB") {

            formattedSlot.slabs = slot.slabs.map(s => ({
              minOrders: s.minOrders,
              maxOrders: s.maxOrders,
              rewardAmount: s.rewardAmount
            }));
          }

          return formattedSlot;
        })
      };
    }

    // FIXED TARGET

  if (program.ruleType === "FIXED_TARGET") {

  const activeSlot = program.slots.find(slot => {

    return (
      currentMinutes >= slot.startMinutes &&
      currentMinutes <= slot.endMinutes
    );
  });

  // NO ACTIVE SLOT

  if (!activeSlot) {
    return null;
  }

  const target = program.targets?.[0];

  return {

    ...base,

    slots: [{
      startTime:
        minutesToTime(activeSlot.startMinutes),

      endTime:
        minutesToTime(activeSlot.endMinutes),

      
    }],

    target: {
      orders:
        target?.targetOrders || 0
    },

    reward: {
      amount:
        target?.rewardAmount || 0
    }
  };
}

    // HYBRID

    if (program.ruleType === "HYBRID") {

  const activeSlot = program.slots.find(slot => {

    return (
      currentMinutes >= slot.startMinutes &&
      currentMinutes <= slot.endMinutes
    );
  });

  // NO ACTIVE SLOT

  if (!activeSlot) {
    return null;
  }

  const target = program.targets?.[0];

  return {

    ...base,

    slots: [{
      startTime:
        minutesToTime(activeSlot.startMinutes),

      endTime:
        minutesToTime(activeSlot.endMinutes),

      
    }],

    conditions: {

      minOrders:
        target?.targetOrders || 0,

      minEarnings:
        target?.targetEarnings || 0,

      minAcceptanceRate:
        program.minAcceptanceRate || 0,

      minCompletionRate:
        program.minCompletionRate || 0
    },

    reward: {
      amount:
        target?.rewardAmount || 0
    },

    maxPayoutPerDay:
      program.maxPayoutPerDay || 0
  };
}

    return null;
  })
  
  .filter(program => {

  // remove null
  if (!program) return false;

  // remove empty slot programs
  if (
    (program.ruleType === "PER_ORDER" ||
     program.ruleType === "SLAB") &&
    (!program.slots || !program.slots.length)
  ) {
    return false;
  }

  return true;
});

      response.sort((a, b) => {
  const aStart = a.slots?.[0]?.startTime || "99:99";
  const bStart = b.slots?.[0]?.startTime || "99:99";

  return aStart.localeCompare(bStart);
});


    // RESPONSE
    
    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error("Peak slot programs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch peak slot programs"
    });
  }
};

module.exports = { getPeakSlotProgress, getRiderPeakSlotPrograms };