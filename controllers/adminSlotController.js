

const prisma = require("../config/prisma")

const { startOfISOWeek, addDays, setHours, setMinutes,setISOWeek ,setISOWeekYear} = require("date-fns")

// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();





exports.createWeeklySlots = async (req, res) => {
  try {

    const { weekNumber, year, city, zone, slotTemplate } = req.body;

    if (!weekNumber || !year || !city || !zone || !slotTemplate?.length) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // ✅ FIXED HERE
const existing = await prisma.weeklySlot.findFirst({
  where: {
    
      weekNumber,
      year,
      city,
      zone
    
  }
});

    if (existing) {
      return res.status(400).json({
        message: "Weekly slots already exist"
      });
    }

    const weekStartDate = startOfISOWeek(
      setISOWeek(setISOWeekYear(new Date(), year), weekNumber)
    );

    const WeeklySlot = await prisma.$transaction(async (tx) => {

      // ✅ FIXED HERE
      const parent = await tx.WeeklySlot.create({
        data: { weekNumber, year, city, zone }
      });

      const slotsToCreate = [];
      const days = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

      for (let i = 0; i < 7; i++) {

        const baseDate = addDays(weekStartDate, i);

        for (const tpl of slotTemplate) {

          const [sh, sm] = tpl.startTime.split(":").map(Number);
          const [eh, em] = tpl.endTime.split(":").map(Number);

          const slotStartAt = setMinutes(setHours(new Date(baseDate), sh), sm);
          const slotEndAt = setMinutes(setHours(new Date(baseDate), eh), em);

          slotsToCreate.push({
            weeklySlotId: parent.id,
            date: baseDate,
            slotKey: `${days[i]}_${tpl.startTime.replace(":","")}_${tpl.endTime.replace(":","")}`,
            dayOfWeek: days[i],
            dayNumber: i + 1,
            startTime: tpl.startTime,
            endTime: tpl.endTime,
            durationMinutes: tpl.durationMinutes,
            slotStartAt,
            slotEndAt,
            maxRiders: tpl.maxRiders,
            isPeakSlot: tpl.isPeakSlot ?? false,
            incentiveText: tpl.incentiveText ?? "",
            incentiveAmount: tpl.incentiveAmount ?? 0,
            priority: tpl.priority ?? 0
          });

        }
      }

      await tx.slot.createMany({
        data: slotsToCreate
      });

      return parent;

    });

    return res.status(201).json({
      message: "Weekly slots created successfully",
      weeklySlotId: WeeklySlot.id
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });

  }
};