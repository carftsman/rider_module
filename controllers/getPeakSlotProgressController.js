const prisma = require("../config/prisma");

const getPeakSlotProgress = async (req, res) => {
  try {
    const riderId = req.rider.id;

    // 1. Get rider pincode
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

    // 2. Get programs for rider pincode
    const programs = await prisma.program.findMany({
      where: {
        isActive: true,
        pincodeIds: {
          has: riderPincode,
        },
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

    // 3. Flatten all slots from programs
    const allSlots = programs.flatMap((p) =>
      p.slots.map((slot) => ({
        slotId: slot.id,
        time: `${minutesToTime(slot.startMinutes)} - ${minutesToTime(slot.endMinutes)}`,
        reward: slot.rewardPerOrder || 0,
        status: "IN_PROGRESS", // you can later calculate real status
        ordersCompleted: 0, // attach from progress table later if needed
      }))
    );

    return res.status(200).json({
      success: true,
      slots: allSlots,
    });

  } catch (error) {
    console.error(error);
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

module.exports = { getPeakSlotProgress };