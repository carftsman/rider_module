const prisma = require("../config/prisma");
const { TrackingType, RuleType, ProgramType } = require("@prisma/client");
 
function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
 
const createPerOrderPeakSlot = async (req, res) => {
  try {
    const body = req.body;
 
    const start = new Date(body.dateRange.startDate);
    const end = new Date(body.dateRange.endDate);
 
const pincodeIds = Array.isArray(body.pincodeIds)
  ? body.pincodeIds.map(String)
  : [String(body.pincodeIds)];
 
const program = await prisma.program.create({
  data: {
    name: body.name,
    programType: "INCENTIVE",
    trackingType: "DAILY",
    ruleType: "PER_ORDER",
 
    validFrom: start,
    validTill: end,
 
    // ✅ FIXED
    cityId: body.cityId ? [String(body.cityId)] : [],
 
    pincodeIds,
 
    isActive: body.isActive ?? true,
 
    weekStartDay: body.weekStartDay || "MON",
    daysOfWeek: body.daysOfWeek
  }
});
 
    for (const slot of body.slots) {
      await prisma.programSlot.create({
        data: {
          programId: program.id,
          startMinutes: toMinutes(slot.startTime),
          endMinutes: toMinutes(slot.endTime),
          daysOfWeek: slot.daysOfWeek || [],
          ruleType: "PER_ORDER",
          rewardPerOrder: slot.reward.amount
        }
      });
    }
 
    return res.status(201).json({
  success: true,
  message: "Peak slot incentive created successfully",
  data: {
    id: program.id,
    name: program.name,
    totalSlots: body.slots.length
  }
});
 
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
 
// ---------------- SLAB ----------------
const createSlabPeakSlot = async (req, res) => {
  try {
    const body = req.body;
 
    // 1. Basic validations
    if (!body.name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
 
    if (!body.dateRange?.startDate || !body.dateRange?.endDate) {
      return res.status(400).json({ success: false, message: "dateRange is required" });
    }
 
    if (!Array.isArray(body.slots) || body.slots.length === 0) {
      return res.status(400).json({ success: false, message: "Slots required" });
    }
 
    if (!body.cityName) {
      return res.status(400).json({ success: false, message: "cityName is required" });
    }
 
    // 2. City mapping
    const city = await prisma.city.findFirst({
      where: {
        name: {
          equals: body.cityName,
          mode: "insensitive"
        }
      }
    });
 
    if (!city) {
      return res.status(400).json({ success: false, message: "Invalid cityName" });
    }
 
    // 3. Normalize pincodeIds
    const pincodeIds = Array.isArray(body.pincode)
  ? body.pincode.map(String)
  : body.pincode
    ? [String(body.pincode)]
    : [];
 
    // 4. Validate slots BEFORE DB
    for (const slot of body.slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({ success: false, message: "Slot time missing" });
      }
 
      const startMin = toMinutes(slot.startTime);
      const endMin = toMinutes(slot.endTime);
 
      if (startMin >= endMin) {
        return res.status(400).json({ success: false, message: "Invalid slot time" });
      }
 
      if (!Array.isArray(slot.slabs) || slot.slabs.length === 0) {
        return res.status(400).json({ success: false, message: "Slabs required" });
      }
 
      for (const s of slot.slabs) {
        if (s.minOrders > s.maxOrders) {
          return res.status(400).json({ success: false, message: "Invalid slab range" });
        }
      }
    }
 
    // 5. Create program
    const program = await prisma.program.create({
      data: {
        name: body.name,
        programType: "INCENTIVE",
        trackingType: "DAILY",
        ruleType: "SLAB",
 
        validFrom: new Date(body.dateRange.startDate),
        validTill: new Date(body.dateRange.endDate),
 
        cityId: [String(city.id)],
        pincodeIds,
 
        weekStartDay: body.weekStartDay || "MON",
        daysOfWeek: body.daysOfWeek || [],
        isActive: body.isActive ?? true
      }
    });
 
    // 6. Create slots + slabs
    for (const slot of body.slots) {
      const createdSlot = await prisma.programSlot.create({
        data: {
          programId: program.id,
          startMinutes: toMinutes(slot.startTime),
          endMinutes: toMinutes(slot.endTime),
          ruleType: "SLAB",
          daysOfWeek: slot.daysOfWeek || []
        }
      });
 
      await prisma.programSlotSlab.createMany({
        data: slot.slabs.map((s) => ({
          slotId: createdSlot.id,
          minOrders: s.minOrders,
          maxOrders: s.maxOrders,
          rewardAmount: s.rewardAmount
        }))
      });
    }
 
    return res.status(201).json({
      success: true,
      message: "Peak slot slab incentive created",
      data: {
        id: program.id
      }
    });
 
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
 
 
 
 
 
const getAllPeakSlots = async (req, res) => {
  try {
    const programs = await prisma.program.findMany({
      where: {
        programType: "INCENTIVE"
      },
      include: {
        slots: true   // ✅ FIXED (matches schema)
      },
      orderBy: {
        createdAt: "desc"
      }
    });
 
    const result = programs.map((p) => ({
  id: p.id,
  name: p.name,
  isActive: p.isActive,
 
  slots: (p.slots || []).map((s) => ({
    startTime: `${Math.floor(s.startMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(s.startMinutes % 60)
      .toString()
      .padStart(2, "0")}`,
 
    endTime: `${Math.floor(s.endMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(s.endMinutes % 60)
      .toString()
      .padStart(2, "0")}`,
 
    ruleType: s.ruleType
  }))
}));
 
    return res.status(200).json({
      success: true,
      data: result
    });
 
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
 
 
const getPeakSlotById = async (req, res) => {
  try {
    const { id } = req.params;
 
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        slots: true
      }
    });
 
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Peak slot not found"
      });
    }
 
    // ✅ ADD THIS HERE (AFTER program fetch)
    let cityName = [];
 
    if (program.cityId?.length) {
      const cities = await prisma.city.findMany({
        where: {
          id: { in: program.cityId }
        }
      });
 
      cityName = cities.map(c => c.name);
    }
 
    // ✅ RESULT
    const result = {
      id: program.id,
      name: program.name,
      cityName, // 👈 correct now
 
      slots: (program.slots || []).map((s) => ({
        startTime: `${String(Math.floor(s.startMinutes / 60)).padStart(2, "0")}:${String(s.startMinutes % 60).padStart(2, "0")}`,
        endTime: `${String(Math.floor(s.endMinutes / 60)).padStart(2, "0")}:${String(s.endMinutes % 60).padStart(2, "0")}`,
        daysOfWeek: s.daysOfWeek || [],
        ruleType: s.ruleType,
        reward: {
          amount: s.rewardPerOrder || 0
        }
      }))
    };
 
    return res.status(200).json({
      success: true,
      data: result
    });
 
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
 
const updatePeakSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
 
    // check program exists
    const program = await prisma.program.findUnique({
      where: { id }
    });
 
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Peak slot not found"
      });
    }
 
    // update only provided fields (safe update)
    const updatedProgram = await prisma.program.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(typeof isActive === "boolean" && { isActive })
      }
    });
 
    return res.status(200).json({
      success: true,
      message: "Peak slot updated successfully",
      data: {
        id: updatedProgram.id,
        name: updatedProgram.name,
        isActive: updatedProgram.isActive
      }
    });
 
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
 
module.exports = {
  createPerOrderPeakSlot,
  createSlabPeakSlot,
  getAllPeakSlots,
  updatePeakSlot ,
  getPeakSlotById
};
 