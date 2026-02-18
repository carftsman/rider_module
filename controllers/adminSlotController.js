const WeeklySlots = require("../models/SlotModel");
const mongoose = require("mongoose")
/**
 * convert HH:mm to minutes
 */
const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Check overlapping slots
 */
const hasOverlap = (slots) => {
  const grouped = {};

  for (const slot of slots) {
    if (!grouped[slot.dayNumber]) grouped[slot.dayNumber] = [];
    grouped[slot.dayNumber].push(slot);
  }

  for (const day in grouped) {
    const daySlots = grouped[day]
      .map(s => ({
        start: timeToMinutes(s.startTime),
        end: timeToMinutes(s.endTime)
      }))
      .sort((a, b) => a.start - b.start);

    for (let i = 1; i < daySlots.length; i++) {
      if (daySlots[i].start < daySlots[i - 1].end) {
        return true;
      }
    }
  }

  return false;
};

// exports.createWeeklySlots = async (req, res) => {
//   try {
//     const { weekNumber, year, city, zone, slots } = req.body;

//     /* ---------------- BASIC VALIDATION ---------------- */
//     if (!weekNumber || !year || !city || !zone || !Array.isArray(slots)) {
//       return res.status(400).json({
//         success: false,
//         message: "weekNumber, year, city, zone and slots are required"
//       });
//     }

//     /* ----------- PREVENT DUPLICATE WEEK CREATION ----------- */
//     const exists = await WeeklySlots.findOne({
//       weekNumber,
//       year,
//       city,
//       zone,
//       isDeleted: false
//     });

//     if (exists) {
//       return res.status(409).json({
//         success: false,
//         message: "Slots already created for this week and zone"
//       });
//     }

//     /* ----------- DUPLICATE SLOT KEY CHECK ----------- */
//     const slotKeys = slots.map(s => s.slotKey);
//     if (new Set(slotKeys).size !== slotKeys.length) {
//       return res.status(400).json({
//         success: false,
//         message: "Duplicate slotKey found"
//       });
//     }

//     /* ----------- SLOT LEVEL VALIDATION ----------- */
//     for (const slot of slots) {
//       if (timeToMinutes(slot.startTime) >= timeToMinutes(slot.endTime)) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid time range for slot ${slot.slotKey}`
//         });
//       }

//       // Auto-calculate duration
//       slot.durationInMinutes =
//         timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);

//       // SlotKey vs Day mismatch
//       if (!slot.slotKey.startsWith(slot.dayOfWeek)) {
//         return res.status(400).json({
//           success: false,
//           message: `slotKey does not match dayOfWeek for ${slot.slotKey}`
//         });
//       }

//       // Incentive rule
//       if (slot.incentiveAmount > 0 && !slot.isPeakSlot) {
//         return res.status(400).json({
//           success: false,
//           message: `Incentive allowed only for peak slots (${slot.slotKey})`
//         });
//       }

//       // Inactive slot safety
//       if (slot.status === "INACTIVE") {
//         slot.isAvailable = false;
//         slot.isVisible = false;
//         slot.isLocked = true;
//       }
//     }

//     /* ----------- OVERLAP CHECK ----------- */
//     if (hasOverlap(slots)) {
//       return res.status(400).json({
//         success: false,
//         message: "Overlapping slots detected"
//       });
//     }

//     /* ----------- SAVE WEEKLY SLOTS ----------- */
//     const weeklySlots = await WeeklySlots.create({
//       weekNumber,
//       year,
//       city,
//       zone,
//       slots
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Weekly slots created successfully",
//       data: {
//         id: weeklySlots._id,
//         weekNumber,
//         year,
//         city,
//         zone
//       }
//     });

//   } catch (error) {
//     console.error("CREATE SLOT ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };



//-----------------------------------------

function getISOWeekStart(week, year) {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);

  const target = new Date(monday);
  target.setDate(monday.getDate() + (week - 1) * 7);
  return target;
}

function buildSlotDate(baseDate, time) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}





// exports.createWeeklySlots = async (req, res) => {
//   try {
//     const {
//       weekNumber,
//       year,
//       city,
//       zone,
//       slotsTemplate
//     } = req.body;

//     if (!weekNumber || !year || !city || !zone || !slotsTemplate?.length) {
//       return res.status(400).json({
//         message: "weekNumber, year, city, zone and slotsTemplate are required"
//       });
//     }

//     // ---- Prevent duplicate week ----
//     const exists = await WeeklySlots.findOne({
//       weekNumber,
//       year,
//       city,
//       zone
//     });

//     if (exists) {
//       return res.status(409).json({
//         message: "Slots already exist for this week and location"
//       });
//     }

//     // ---- Get Monday of ISO week ----
//     const weekStart = getISOWeekStart(weekNumber, year);

//     const allSlots = [];

//     for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
//       const currentDate = new Date(weekStart);
//       currentDate.setDate(weekStart.getDate() + dayIndex);

//       const dayOfWeekMap = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
//       const dayOfWeek = dayOfWeekMap[currentDate.getDay()];
//       const dayNumber = dayIndex + 1;

//       slotsTemplate.forEach(template => {
//         const slotStartAt = buildSlotDate(currentDate, template.startTime);
//         const slotEndAt = buildSlotDate(currentDate, template.endTime);

//         const durationInMinutes =
//           (slotEndAt - slotStartAt) / (1000 * 60);

//         const slotKey = `${dayOfWeek}_${template.startTime.replace(":","")}_${template.endTime.replace(":","")}`;

//         allSlots.push({
//           date: currentDate,
//           slotKey,
//           dayOfWeek,
//           dayNumber,
//           startTime: template.startTime,
//           endTime: template.endTime,
//           durationInMinutes,
//           slotStartAt,
//           slotEndAt,
//           maxRiders: template.maxRiders,
//           isPeakSlot: template.isPeakSlot || false,
//           incentiveAmount: template.incentiveAmount || 0,
//           incentiveText: template.incentiveText || "",
//           priority: template.isPeakSlot ? 1 : 0,
//           riders: []     // 🔥 important
//         });
//       });
//     }

//     const weeklySlots = await WeeklySlots.create({
//       weekNumber,
//       year,
//       city,
//       zone,
//       slots: allSlots
//     });

//     res.status(201).json({
//       success: true,
//       message: "Weekly slots created successfully",
//       data: {
//         weekNumber,
//         year,
//         city,
//         zone,
//         totalSlots: allSlots.length
//       }
//     });

//   } catch (err) {
//     console.error("Create weekly slots error:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

exports.createWeeklySlots = async (req, res) => {
  try {
    const { weekNumber, year, city, zone, slots } = req.body;

    if (!weekNumber || !year || !city || !zone || !Array.isArray(slots)) {
      return res.status(400).json({
        message: "weekNumber, year, city, zone and slots are required"
      });
    }

    const exists = await WeeklySlots.findOne({
      weekNumber,
      year,
      city,
      zone
    });

    if (exists) {
      return res.status(409).json({
        message: "Weekly slots already exist"
      });
    }

    const formattedSlots = slots.map(s => {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);

      const durationInHours =
        (eh * 60 + em - (sh * 60 + sm)) / 60;

      return {
        slotId: new mongoose.Types.ObjectId(),
        startTime: s.startTime,
        endTime: s.endTime,
        durationInHours,
        breakInMinutes: s.breakInMinutes || 10,
        maxRiders: s.maxRiders,
        bookedRiders: 0,
        isPeakSlot: s.isPeakSlot || false,
        incentiveText: s.incentiveText || "",
        status: "ACTIVE"
      };
    });

    const weeklySlots = await WeeklySlots.create({
      weekNumber,
      year,
      city,
      zone,
      slots: formattedSlots
    });

    res.status(201).json({
      success: true,
      message: "Weekly slots created",
      data: weeklySlots
    });

  } catch (err) {
    console.error("Create weekly slots error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


