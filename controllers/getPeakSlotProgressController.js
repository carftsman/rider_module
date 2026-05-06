const prisma = require("../config/prisma");

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const getPeakSlotProgress = async (req, res) => {
  try {
    const riderId = req.rider.id;

    //  Get rider pincode
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

    //  Get active programs for rider
    const programs = await prisma.program.findMany({
      where: {
        isActive: true,
        programType: "PEAK_SLOT",
        trackingType: "DAILY",
        pincodeIds: {
          has: riderPincode,
        },
        validFrom: { lte: today },
        validTill: { gte: today },
      },
      select: {
        id: true,
        slots: true,
      },
    });

    if (!programs.length) {
      return res.status(200).json({
        success: true,
        slots: [],
      });
    }

    // Create / Fetch progress
    const progressMap = {};

    for (const p of programs) {
      let progProgress = await prisma.programProgress.findFirst({
        where: {
          riderId,
          programId: p.id,
        },
      });

      // If not exists → create zero progress
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

    //Build response
  const allSlots = programs.flatMap((p) =>
  p.slots.map((slot) => {
    const progProgress = progressMap[p.id];
    const orders = progProgress?.totalOrders || 0;

    return {
      slotId: slot.id,
      time: `${minutesToTime(slot.startMinutes)} - ${minutesToTime(slot.endMinutes)}`,

      ordersCompleted: orders,

      reward: orders > 0
        ? orders * (slot.rewardPerOrder || 0)
        : 0,

      status: progProgress?.achieved
        ? "ACHIEVED"
        : orders > 0
        ? "IN_PROGRESS"
        : "NOT_STARTED",
    };
  })
);

    return res.status(200).json({
      success: true,
      slots: allSlots,
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

    // FETCH PROGRAMS 
    
    let programs = [];

    const baseQuery = {
      programType: "PEAK_SLOT",
      isActive: true,
      validFrom: { lte: now },
      validTill: { gte: now }
    };

    if (riderPincode) {
      programs = await prisma.program.findMany({
        where: {
          ...baseQuery,
          pincodeIds: { has: riderPincode }
        },
        include: {
          slots: {
            include: {
              slabs: true
            }
          }
        }
      });
    }

    // FALLBACK TO CITY
    
    if (!programs.length && riderCityId) {
      programs = await prisma.program.findMany({
        where: {
          ...baseQuery,
          cityId: { has: riderCityId }
        },
        include: {
          slots: {
            include: {
              slabs: true
            }
          }
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
        // filter only PER_ORDER + SLAB slots
        const validSlots = program.slots.filter(slot =>
          ["PER_ORDER", "SLAB"].includes(slot.ruleType)
        );

        if (!validSlots.length) return null;

        // CITY NAME LOGIC
        
        let cityName = null;

        if (program.cityId?.length) {
          cityName = cityMap[program.cityId[0]] || null;
        } else if (program.pincodeIds?.length) {
          cityName =
            pincodeCityMap[program.pincodeIds[0]] || null;
        }

        return {
          name: program.name,

          cityName,

          pincodeIds: program.pincodeIds || [],

          dateRange: {
            startDate: program.validFrom,
            endDate: program.validTill
          },

          slots: validSlots.map(slot => {
            const formattedSlot = {
              startTime: minutesToTime(slot.startMinutes),
              endTime: minutesToTime(slot.endMinutes),
              daysOfWeek: slot.daysOfWeek,
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
          }),

          isActive: program.isActive
        };
      })
      .filter(Boolean);

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