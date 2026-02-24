const Slot = require("../models/SlotModel");
const { getWeekNumber } = require("../helpers/getWeekNumber");

const SlotBooking = require("../models/SlotBookingModel");
const Rider = require("../models/RiderModel");
// FCM Notification
const fcmService = require("../helpers/fcmService");

const prisma=require("../config/prisma");




exports.getWeeklySlots = async (req, res) => {
  try {
    let { city, zone, weekNumber, year } = req.query;

    if (!city) {
      return res.status(400).json({ success: false, message: "City is required" });
    }
    if (!zone) {
      return res.status(400).json({ success: false, message: "Zone is required" });
    }

    const today = new Date();

    if (!weekNumber) {
      weekNumber = getWeekNumber(today);
    }

    if (!year) {
      year = today.getFullYear();
    }

    const weekDocs = await prisma.weeklySlot.findMany({
      where: {
        city,
        zone,
        weekNumber: Number(weekNumber),
        year: Number(year),
        isDeleted: false
      },
      include: {
        slots: {
          where: {
            status: "ACTIVE"
          },
          orderBy: [
            { date: "asc" },
            { startTime: "asc" }
          ]
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (!weekDocs.length) {
      return res.json({
        success: true,
        message: "No slots found for this week",
        weekNumber,
        year,
        count: 0,
        data: []
      });
    }

    const weekly = weekDocs[0]; 
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const grouped = {};

    weekly.slots.forEach(slot => {
      const dateKey = slot.date;

      if (!grouped[dateKey]) {
        const currentDate = new Date(dateKey);

        grouped[dateKey] = {
          date: dateKey, 
          dayName: dayNames[currentDate.getDay()],
          weekNumber: weekly.weekNumber,
          year: weekly.year,
          city: weekly.city,
          zone: weekly.zone,
          slots: []
        };
      }

      grouped[dateKey].slots.push(slot);
    });

    const result = Object.values(grouped);

    return res.json({
      success: true,
      message: "Weekly slots fetched",
      weekNumber: Number(weekNumber),
      year: Number(year),
      count: result.length,
      data: result
    });

  } catch (err) {
    console.error("Get Weekly Slots Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getDailySlotsWithStatus = async (req, res) => {
  try {
    const riderId = req.rider?.id;
    const { date, city, zone, status = "all" } = req.query;

    /* -----------------------------
       Validate inputs
    ----------------------------- */
    if (!date || !city || !zone) {
      return res.status(400).json({
        success: false,
        message: "date, city and zone are required"
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format (YYYY-MM-DD required)"
      });
    }

    /* -----------------------------
       Fetch slots
    ----------------------------- */
    const slots = await prisma.slot.findMany({
      where: {
        date: date,
        weeklySlot: {
          city,
          zone
        }
      },
      include: riderId
        ? {
            slotBookings: {
              where: { riderId }
            }
          }
        : {},
      orderBy: { startTime: "asc" }
    });

    if (!slots.length) {
      return res.json({
        success: true,
        message: "No slots found",
        date,
        count: 0,
        data: []
      });
    }

    /* -----------------------------
       Enrich slot data
    ----------------------------- */
    let enriched = slots.map(slot => {
      const booking = slot.slotBookings?.[0];

      return {
        slotId: slot.slotId,  // ✅ corrected
        startTime: slot.startTime,
        endTime: slot.endTime,

        isAvailable: slot.isAvailable, // ✅ ADDED FROM SCHEMA

        isBooked: booking?.status === "BOOKED",
        isCancelled: booking?.status === "CANCELLED_BY_RIDER",

        bookingId: booking?.id || null,
        bookingStatus: booking?.status || "NOT_BOOKED"
      };
    });

    /* -----------------------------
       Apply filters
    ----------------------------- */
    if (status === "booked") {
      enriched = enriched.filter(
        s => s.bookingStatus === "BOOKED"
      );
    }

    if (status === "cancelled") {
      enriched = enriched.filter(
        s => s.bookingStatus === "CANCELLED_BY_RIDER"
      );
    }

    if (status === "available") {
      enriched = enriched.filter(
        s =>
          s.isAvailable &&   // ✅ only available slots
          (
            s.bookingStatus === "NOT_BOOKED" ||
            s.bookingStatus === "CANCELLED_BY_RIDER"
          )
      );
    }

    /* -----------------------------
       Response
    ----------------------------- */
    return res.status(200).json({
      success: true,
      message: "Daily slots fetched",
      date,
      count: enriched.length,
      data: enriched
    });

  } catch (err) {
    console.error("Daily Slots Error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
};



exports.getDailySlots = async (req, res) => {
  try {
    const { date, city, zone } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required (YYYY-MM-DD)" });
    }
    if (!city) {
      return res.status(400).json({ success: false, message: "City is required" });
    }
    if (!zone) {
      return res.status(400).json({ success: false, message: "Zone is required" });
    }

    const slots = await prisma.slot.findMany({
      where: {
        date: date, 
        status: "ACTIVE",
        weeklySlot: {
          city,
          zone,
          isDeleted: false
        }
      },
      include: {
        weeklySlot: true
      },
      orderBy: {
        startTime: "asc"
      }
    });

    if (!slots.length) {
      return res.json({
        success: true,
        message: "No slots found for this date",
        date,
        count: 0,
        data: []
      });
    }

    return res.json({
      success: true,
      message: "Daily slots fetched",
      date,
      weekNumber: slots[0].weeklySlot.weekNumber,
      year: slots[0].weeklySlot.year,
      count: slots.length,
      data: slots
    });

  } catch (err) {
    console.error("Get Daily Slots Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




exports.bookSlot = async (req, res) => {

  try {

    const riderId = req.rider.id;

    const { date, slotIds } = req.body;
 
    if (!date || !Array.isArray(slotIds) || slotIds.length === 0) {

      return res.status(400).json({

        success: false,

        message: "date and slotIds[] are required"

      });

    }
 
    //////////////////////////////////////////////////////

    // 1. Fetch Rider

    //////////////////////////////////////////////////////

    const rider = await prisma.rider.findUnique({

      where: { id: riderId }

    });
 
    if (!rider) {

      return res.status(404).json({

        success: false,

        message: "Rider not found"

      });

    }
 
    if (!rider.isFullyRegistered) {

      return res.status(403).json({

        success: false,

        message: "Complete onboarding before booking slots"

      });

    }
 
    //////////////////////////////////////////////////////

    // 2. Fetch Slots

    //////////////////////////////////////////////////////

    const slots = await prisma.slot.findMany({

      where: {

        slotId: { in: slotIds },

        date: date,

        status: "ACTIVE"

      },

      include: {

        weeklySlot: true

      }

    });
 
    if (slots.length === 0) {

      return res.status(404).json({

        success: false,

        message: "No slots found for this date"

      });

    }
 
    //////////////////////////////////////////////////////

    // 3. Validate Slots

    //////////////////////////////////////////////////////

    const validSlots = [];

    const failed = [];
 
    for (const slotId of slotIds) {

      const slot = slots.find(s => s.slotId === slotId);
 
      if (!slot) {

        failed.push({ slotId, reason: "Slot not found" });

        continue;

      }
 
      if (slot.bookedRiders >= slot.maxRiders) {

        failed.push({ slotId, reason: "Slot is full" });

        continue;

      }
 
      const alreadyBooked = await prisma.slotBooking.findUnique({

        where: {

          riderId_date_slotId: {

            riderId,

            date,

            slotId: slot.slotId

          }

        }

      });
 
      if (alreadyBooked?.status === "BOOKED") {

        failed.push({ slotId, reason: "Already booked" });

        continue;

      }
 
      validSlots.push(slot);

    }
 
    if (validSlots.length === 0) {

      return res.status(400).json({

        success: false,

        message: "No valid slots to book",

        failed

      });

    }
 
    //////////////////////////////////////////////////////

    // 4. Date helpers

    //////////////////////////////////////////////////////

    const jsDate = new Date(date);

    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
 
    const dayOfWeek = days[jsDate.getUTCDay()];

    const dayNumber = jsDate.getUTCDay() === 0 ? 7 : jsDate.getUTCDay();
 
    //////////////////////////////////////////////////////

    // 5. Create Bookings (Transaction Safe)

    //////////////////////////////////////////////////////

    const createdBookings = [];
 
    await prisma.$transaction(async (tx) => {

      for (const slot of validSlots) {

        const slotKey =

          `${dayOfWeek}_${slot.startTime.replace(":", "")}_${slot.endTime.replace(":", "")}`;
 
        const booking = await tx.slotBooking.upsert({

          where: {

            riderId_date_slotId: {

              riderId,

              date,

              slotId: slot.slotId

            }

          },

          update: {

            status: "BOOKED",

            bookedFrom: "APP",

            cancellationReason: ""

          },

          create: {

            riderId,

            daySlotId: slot.weeklySlotId,

            slotId: slot.slotId,

            slotKey,

            date,

            dayOfWeek,

            dayNumber,

            weekNumber: slot.weeklySlot.weekNumber,

            year: slot.weeklySlot.year,

            city: slot.weeklySlot.city,

            zone: slot.weeklySlot.zone,

            startTime: slot.startTime,

            endTime: slot.endTime,

            slotStartAt: slot.slotStartAt,

            slotEndAt: slot.slotEndAt,

            totalMinutes: slot.durationMinutes,

            isPeakSlot: slot.isPeakSlot,

            incentiveText: slot.incentiveText,

            status: "BOOKED",

            bookedFrom: "APP"

          }

        });
 
        createdBookings.push(booking);
 
        await tx.slot.update({

          where: { slotId: slot.slotId },

          data: {

            bookedRiders: { increment: 1 }

          }

        });
 
        await tx.slotRider.upsert({

          where: {

            slotId_riderId: {

              slotId: slot.slotId,

              riderId

            }

          },

          update: {

            status: "BOOKED"

          },

          create: {

            slotId: slot.slotId,

            riderId,

            status: "BOOKED"

          }

        });

      }

    });
 
    //////////////////////////////////////////////////////

    // 6. FCM Notification

    //////////////////////////////////////////////////////

    if (rider.fcmToken) {

      await fcmService.sendToDevice({

        token: rider.fcmToken,

        title: "Slot Booked",

        body:

          createdBookings.length > 1

            ? `${createdBookings.length} slots booked successfully`

            : "Slot booked successfully",

        data: { type: "SLOT_BOOKED" }

      });

    }
 
    //////////////////////////////////////////////////////

    // 7. Response

    //////////////////////////////////////////////////////

    return res.json({

      success: true,

      message: "Slots booked successfully",

      bookedCount: createdBookings.length,

      failedCount: failed.length,

      booked: createdBookings,

      failed

    });
 
  } catch (err) {

    console.error("Slot Booking Error:", err);

    return res.status(500).json({

      success: false,

      message: "Server error"

    });

  }

};

exports.cancelSlot = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { bookingId } = req.params;

    //////////////////////////////////////////////////////
    // 1️⃣ Validate input
    //////////////////////////////////////////////////////

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    //////////////////////////////////////////////////////
    // 2️⃣ Find booking
    //////////////////////////////////////////////////////

    const booking = await prisma.slotBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    //////////////////////////////////////////////////////
    // 3️⃣ Verify ownership
    //////////////////////////////////////////////////////

    if (booking.riderId !== riderId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized cancel attempt",
      });
    }

    //////////////////////////////////////////////////////
    // 4️⃣ Prevent invalid cancel
    //////////////////////////////////////////////////////

    if (booking.status !== "BOOKED") {
      return res.status(400).json({
        success: false,
        message: "Slot already cancelled or completed",
      });
    }

    //////////////////////////////////////////////////////
    // 5️⃣ Transaction (Atomic Operation)
    //////////////////////////////////////////////////////

    const result = await prisma.$transaction(async (tx) => {
      
      // Update SlotBooking
      const updatedBooking = await tx.slotBooking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED_BY_RIDER",
          cancellationReason: "Rider cancelled",
        },
      });

      // Decrement Slot bookedRiders safely
      await tx.slot.update({
        where: { slotId: booking.slotId },
        data: {
          bookedRiders: {
            decrement: 1,
          },
        },
      });

      // Update SlotRider status
      await tx.slotRider.updateMany({
        where: {
          slotId: booking.slotId,
          riderId: riderId,
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      return updatedBooking;
    });

    //////////////////////////////////////////////////////
    // 6️⃣ Send Notification (FIXED HERE)
    //////////////////////////////////////////////////////

    const rider = await prisma.rider.findUnique({
      where: { id: riderId }, // ✅ FIXED (was wrongly using slotId)
      select: { fcmToken: true },
    });

    if (rider?.fcmToken) {
      await fcmService.sendToDevice({
        token: rider.fcmToken,
        title: "Slot Cancelled",
        body: `Your slot ${booking.startTime}-${booking.endTime} on ${booking.date} was cancelled`,
        data: {
          type: "SLOT_CANCELLED",
          bookingId: booking.id,
          slotId: booking.slotId,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
        },
      });
    }

    //////////////////////////////////////////////////////
    // 7️⃣ Final Response
    //////////////////////////////////////////////////////

    return res.json({
      success: true,
      message: "Slot cancelled successfully",
      data: result,
    });

  } catch (err) {
    console.error("Cancel Slot Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.getCurrentSlot = async (req, res) => {
  try {

    const riderId = req.rider.id;

    //////////////////////////////////////////////////////
    // 1️⃣ Fetch rider location
    //////////////////////////////////////////////////////

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: { location: true }
    });

    if (!rider || !rider.location?.city || !rider.location?.area) {
      return res.status(400).json({
        success: false,
        message: "Rider location not configured"
      });
    }

    const { city, area } = rider.location;
    const zone = area;

    //////////////////////////////////////////////////////
    // 2️⃣ Get IST time
    //////////////////////////////////////////////////////

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const today = now.toISOString().split("T")[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    //////////////////////////////////////////////////////
    // 3️⃣ Get today's slots (FIXED)
    //////////////////////////////////////////////////////

    const slots = await prisma.slot.findMany({
      where: {
        date: today, // ✅ FIXED (was DateTime filter)
        status: "ACTIVE",
        weeklySlot: {
          city,
          zone
        }
      },
      include: { weeklySlot: true },
      orderBy: { slotStartAt: "asc" }
    });

    if (!slots.length) {
      return res.json({
        success: true,
        message: "No slots created for today",
        data: null
      });
    }

    //////////////////////////////////////////////////////
    // 4️⃣ Find current & next slot
    //////////////////////////////////////////////////////

    let currentSlot = null;
    let nextSlot = null;

    for (const slot of slots) {

      const [sh, sm] = slot.startTime.split(":").map(Number);
      const [eh, em] = slot.endTime.split(":").map(Number);

      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        if (slot.bookedRiders < slot.maxRiders) {
          currentSlot = slot;
          break;
        }
      }

      if (!nextSlot && startMinutes > currentMinutes) {
        if (slot.bookedRiders < slot.maxRiders) {
          nextSlot = slot;
        }
      }
    }

    const selectedSlot = currentSlot || nextSlot;

    if (!selectedSlot) {
      return res.json({
        success: true,
        message: "No available slots for today",
        data: null
      });
    }

    //////////////////////////////////////////////////////
    // 5️⃣ Calculate delay
    //////////////////////////////////////////////////////

    let delayMinutes = 0;

    if (currentSlot) {
      const [sh, sm] = selectedSlot.startTime.split(":").map(Number);
      const slotStartMinutes = sh * 60 + sm;
      delayMinutes = Math.max(0, currentMinutes - slotStartMinutes);
    }

    //////////////////////////////////////////////////////
    // 6️⃣ Check booking (FIXED slotId)
    //////////////////////////////////////////////////////

    const booking = await prisma.slotBooking.findUnique({
      where: {
        riderId_date_slotId: {
          riderId,
          date: today,
          slotId: selectedSlot.slotId // ✅ FIXED (was selectedSlot.id)
        }
      }
    });

    //////////////////////////////////////////////////////
    // 7️⃣ Response
    //////////////////////////////////////////////////////

    return res.json({
      success: true,
      message: currentSlot
        ? "Current slot available"
        : "Current slot full, showing next slot",
      date: today,
      data: {
        daySlotId: selectedSlot.weeklySlotId,
        slot: {
          slotId: selectedSlot.slotId, // ✅ FIXED
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          durationInHours: selectedSlot.durationMinutes / 60,
          bookedRiders: selectedSlot.bookedRiders,
          maxRiders: selectedSlot.maxRiders,
          isPeakSlot: selectedSlot.isPeakSlot,
          status: selectedSlot.status
        },
        isBooked: booking?.status === "BOOKED",
        delayMinutes: currentSlot ? delayMinutes : 0
      }
    });

  } catch (err) {
    console.error("Current Slot Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}; 




exports.getSlotHistory = async (req, res) => {
  try {
    const riderId = req.rider.id;
    let { weekNumber, year } = req.query;
 
    if (!weekNumber) {
      return res.status(400).json({
        success: false,
        message: "weekNumber is required"
      });
    }
 
    const currentYear = new Date().getFullYear();
    year = Number(year) || currentYear;
    weekNumber = Number(weekNumber);
 
    /* ---------------------------------------
       1. Fetch bookings
    --------------------------------------- */
    const bookings = await prisma.slotBooking.findMany({
      where: {
        riderId,
        weekNumber,
        year
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" }
      ]
    });
 
    /* ---------------------------------------
       2. Derive runtime status (MISSED logic)
    --------------------------------------- */
    const now = new Date();
 
    const enrichedBookings = bookings.map(b => {
      let derivedStatus = b.status;
 
      const slotDateTime = new Date(`${b.date}T${b.startTime}`);
 
      // If slot is past and still booked → MISSED
      if (
        b.status === "BOOKED" &&
        slotDateTime < now
      ) {
        derivedStatus = "MISSED";
      }
 
      return {
        ...b,
        derivedStatus
      };
    });
 
    /* ---------------------------------------
       3. Weekly Summary
    --------------------------------------- */
    const summary = {
      totalSlots: enrichedBookings.length,
      completed: enrichedBookings.filter(b => b.derivedStatus === "COMPLETED").length,
      cancelled: enrichedBookings.filter(b => b.derivedStatus === "CANCELLED_BY_RIDER").length,
      noShow: enrichedBookings.filter(b => b.derivedStatus === "MISSED").length,
      booked: enrichedBookings.filter(b => b.derivedStatus === "BOOKED").length
    };
 
    /* ---------------------------------------
       4. ISO week generator
    --------------------------------------- */
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
 
    const weekStart = getISOWeekStart(weekNumber, year);
 
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      weekDates.push(d.toISOString().slice(0, 10));
    }
 
    /* ---------------------------------------
       5. Map days
    --------------------------------------- */
    const daysMap = {};
 
    weekDates.forEach(date => {
      daysMap[date] = {
        date,
        totalSlots: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        booked: 0,
        slots: []
      };
    });
 
    enrichedBookings.forEach(b => {
      const dateKey = b.date;
 
      if (!daysMap[dateKey]) return;
 
      daysMap[dateKey].slots.push(b);
      daysMap[dateKey].totalSlots++;
 
      if (b.derivedStatus === "COMPLETED") daysMap[dateKey].completed++;
      if (b.derivedStatus === "CANCELLED_BY_RIDER") daysMap[dateKey].cancelled++;
      if (b.derivedStatus === "MISSED") daysMap[dateKey].noShow++;
      if (b.derivedStatus === "BOOKED") daysMap[dateKey].booked++;
    });
 
    return res.json({
      success: true,
      message: "Weekly slot history fetched",
      weekNumber,
      year,
      summary,
      days: Object.values(daysMap)
    });
 
  } catch (err) {
    console.error("Slot History Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};




exports.getCurrentAndNextSlot = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const now = new Date();

    // Fetch today's booked slots
    let todaySlots = await prisma.slotBooking.findMany({
      where: {
        riderId,
        status: "BOOKED",
        slotEndAt: { gte: now }
      },
      include: { slot: true },
      orderBy: { slotStartAt: "asc" }
    });

    
    const allSlots = todaySlots;

    if (allSlots.length === 0) {
      return res.json({
        success: true,
        message: "No booked slots found",
        currentSlot: null,
        nextSlot: null
      });
    }

    let currentSlot = null;
    let nextSlot = null;

    for (let slot of allSlots) {
      const slotStart = slot.slotStartAt;
      const slotEnd = slot.slotEndAt;

      if (now >= slotStart && now <= slotEnd) {
        currentSlot = slot;
      }

      if (slotStart > now && !nextSlot) {
        nextSlot = slot;
      }
    }

    return res.json({
      success: true,
      message: "Current & next slot fetched",
      currentSlot,
      nextSlot
    });

  } catch (err) {
    console.error("Current/Next Slot Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// get riders 



exports.getSlotCapacity = async (req, res) => {
  try {
    const { slotId } = req.params;

    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: "slotId is required"
      });
    }

    const slot = await prisma.slot.findUnique({
      where: {
        slotId: slotId   
      },
      include: {
        riderBookings: {
          where: {
            status: "BOOKED"
          }
        }
      }
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found"
      });
    }

    const bookedRidersCount = slot.riderBookings.length;
    const availableRiders = Math.max(
      0,
      slot.maxRiders - bookedRidersCount
    );

    return res.status(200).json({
      success: true,
      message: "Slot capacity fetched successfully",
      data: {
        slotId: slot.slotId,   
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxRiders: slot.maxRiders,
        bookedRidersCount,
        availableRiders,
        isFull: availableRiders === 0,
        canBook: availableRiders > 0
      }
    });

  } catch (error) {
    console.error("Slot Capacity Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};


