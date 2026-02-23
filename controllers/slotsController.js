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

    // Fetch all days of this week
        const weekDocs = await prisma.weeklySlot.findMany({
      where: {
        city,
        zone,
        weekNumber: Number(weekNumber),
        year: Number(year),
        isDeleted: false
      },
      include: {
        slots: true
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

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const result = weekDocs.map(day => {

      const currentDate = day.slots.length
        ? day.slots[0].date
        : null;

      const dayName = currentDate
        ? dayNames[new Date(currentDate).getDay()]
        : "Invalid";

      const activeSlots = day.slots
        .filter(s => s.status === "ACTIVE")
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      return {
        date: currentDate || null,
        dayName,
        weekNumber: day.weekNumber,
        year: day.year,
        city: day.city,
        zone: day.zone,
        slots: activeSlots
      };
    });

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
 
    const parsedDate = new Date(date);
 
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format (YYYY-MM-DD required)"
      });
    }
 
    /* -----------------------------
       Build day range (timezone safe)
    ----------------------------- */
    const start = new Date(parsedDate);
    start.setHours(0, 0, 0, 0);
 
    const end = new Date(parsedDate);
    end.setHours(23, 59, 59, 999);
 
    /* -----------------------------
       Fetch slots
    ----------------------------- */
    const slots = await prisma.slot.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        },
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
        slotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
 
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
          s.bookingStatus === "NOT_BOOKED" ||
          s.bookingStatus === "CANCELLED_BY_RIDER"
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
 
  }catch (err) {
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

    const selectedDate = new Date(`${date}T00:00:00`);

    const dailyDoc = await prisma.weeklySlot.findFirst({
      where: {
        city,
        zone,
        isDeleted: false,
        slots: {
          some: {
            date: selectedDate
          }
        }
      },
      include: {
        slots: true
      }
    });

    if (!dailyDoc) {
      return res.json({
        success: true,
        message: "No slots found for this date",
        date,
        count: 0,
        data: []
      });
    }

    const activeSlots = dailyDoc.slots
      .filter(s =>
        s.status === "ACTIVE" &&
        new Date(s.date).toISOString().split("T")[0] === date
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return res.json({
      success: true,
      message: "Daily slots fetched",
      date,
      weekNumber: dailyDoc.weekNumber,
      year: dailyDoc.year,
      count: activeSlots.length,
      data: activeSlots
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
    // 2. Fetch slots from Slot table
    //////////////////////////////////////////////////////
   console.log("slot ID : " , slotIds)
   console.log("date : " , new Date(date))
   
const startOfDay = new Date(date);
startOfDay.setUTCHours(0, 0, 0, 0);

const endOfDay = new Date(date);
endOfDay.setUTCHours(23, 59, 59, 999);

const slots = await prisma.slot.findMany({
  where: {
    id: { in: slotIds },
    date: {
      gte: startOfDay,
      lte: endOfDay
    }
  },
  include: {
    weeklySlot: true
  }
});

    console.log("slots : " ,slots)

    if (slots.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No slots found for this date"
      });
    }

    //////////////////////////////////////////////////////
    // 3. Validate slots
    //////////////////////////////////////////////////////

    let validBookings = [];
    let failed = [];

    for (let slotId of slotIds) {

      const slot = slots.find(s => s.id === slotId);

      if (!slot) {
        failed.push({ slotId, reason: "Slot not found" });
        continue;
      }

      if (slot.status !== "ACTIVE") {
        failed.push({ slotId, reason: "Slot is inactive" });
        continue;
      }

      if (slot.bookedRiders >= slot.maxRiders) {
        failed.push({ slotId, reason: "Slot is full" });
        continue;
      }

      // Check already booked
      const already = await prisma.slotBooking.findUnique({
        where: {
          riderId_date_slotId: {
            riderId,
            date,
            slotId
          }
        }
      });

      if (already && already.status === "BOOKED") {
        failed.push({ slotId, reason: "Already booked" });
        continue;
      }

      validBookings.push(slot);
    }

    if (validBookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid slots to book",
        failed
      });
    }

    //////////////////////////////////////////////////////
    // 4. Prepare date info
    //////////////////////////////////////////////////////

    const jsDate = new Date(date);
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const dayOfWeek = days[jsDate.getUTCDay()];
    const dayNumber = jsDate.getUTCDay() === 0 ? 7 : jsDate.getUTCDay();

    //////////////////////////////////////////////////////
    // 5. Create bookings
    //////////////////////////////////////////////////////

    let createdBookings = [];

    for (const slot of validBookings) {

      const slotKey =
        `${dayOfWeek}_${slot.startTime.replace(":", "")}_${slot.endTime.replace(":", "")}`;

      const durationMinutes = slot.durationMinutes;

      const booking = await prisma.slotBooking.upsert({

        where: {
          riderId_date_slotId: {
            riderId,
            date,
            slotId: slot.id
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
          slotId: slot.id,

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

          totalMinutes: durationMinutes,

          isPeakSlot: slot.isPeakSlot,
          incentiveText: slot.incentiveText,

          status: "BOOKED",
          bookedFrom: "APP"
        }
      });

      createdBookings.push(booking);

      //////////////////////////////////////////////////////
      // Increase bookedRiders count
      //////////////////////////////////////////////////////

      await prisma.slot.update({
        where: { id: slot.id },
        data: {
          bookedRiders: {
            increment: 1
          }
        }
      });

      //////////////////////////////////////////////////////
      // Create SlotRider record
      //////////////////////////////////////////////////////

      await prisma.slotRider.upsert({
        where: {
          slotId_riderId: {
            slotId: slot.id,
            riderId
          }
        },
        update: {
          status: "BOOKED"
        },
        create: {
          slotId: slot.id,
          riderId,
          status: "BOOKED"
        }
      });

    }

    //////////////////////////////////////////////////////
    // 6. Send FCM notification
    //////////////////////////////////////////////////////

    if (rider.fcmToken) {

      await fcmService.sendToDevice({
        token: rider.fcmToken,
        title: "Slot Booked",
        body:
          createdBookings.length > 1
            ? `${createdBookings.length} slots booked successfully`
            : "Slot booked successfully",
        data: {
          type: "SLOT_BOOKED"
        }
      });

    }

    //////////////////////////////////////////////////////
    // 7. Response (same as Swagger)
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

    res.status(500).json({
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
    // 1. Validate input
    //////////////////////////////////////////////////////

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required"
      });
    }

    //////////////////////////////////////////////////////
    // 2. Find booking
    //////////////////////////////////////////////////////

    const booking = await prisma.slotBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    //////////////////////////////////////////////////////
    // 3. Verify booking belongs to rider
    //////////////////////////////////////////////////////

    if (booking.riderId !== riderId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized cancel attempt"
      });
    }

    //////////////////////////////////////////////////////
    // 4. Prevent cancelling non-booked slot
    //////////////////////////////////////////////////////

    if (booking.status !== "BOOKED") {
      return res.status(400).json({
        success: false,
        message: "Slot already cancelled or completed"
      });
    }

    //////////////////////////////////////////////////////
    // 5. Cancel booking (transaction)
    //////////////////////////////////////////////////////

    const result = await prisma.$transaction(async (tx) => {

      // Update SlotBooking
      const updatedBooking = await tx.slotBooking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED_BY_RIDER",
          cancellationReason: "Rider cancelled"
        }
      });

      // Decrement Slot bookedRiders
      await tx.slot.update({
        where: { id: booking.slotId },
        data: {
          bookedRiders: {
            decrement: 1
          }
        }
      });

      // Update SlotRider status
      await tx.slotRider.updateMany({
        where: {
          slotId: booking.slotId,
          riderId: riderId
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date()
        }
      });

      return updatedBooking;
    });

    //////////////////////////////////////////////////////
    // 6. Send notification
    //////////////////////////////////////////////////////

    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
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
    // 7. Swagger response (same)
    //////////////////////////////////////////////////////

    return res.json({
      success: true,
      message: "Slot cancelled successfully",
      data: result
    });

  } catch (err) {

    console.error("Cancel Slot Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};







exports.getCurrentSlot = async (req, res) => {
  try {

    const riderId = req.rider.id;

    //////////////////////////////////////////////////////
    // 1. Fetch rider location
    //////////////////////////////////////////////////////

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        location: true
      }
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
    // 2. Get IST time
    //////////////////////////////////////////////////////

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const today = now.toISOString().split("T")[0];

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    //////////////////////////////////////////////////////
    // 3. Get today's slots
    //////////////////////////////////////////////////////

    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const slots = await prisma.slot.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: "ACTIVE",
        weeklySlot: {
          city,
          zone
        }
      },
      include: {
        weeklySlot: true
      },
      orderBy: {
        slotStartAt: "asc"
      }
    });

    //////////////////////////////////////////////////////
    // 4. No slots
    //////////////////////////////////////////////////////

    if (!slots.length) {
      return res.json({
        success: true,
        message: "No slots created for today",
        data: null
      });
    }

    //////////////////////////////////////////////////////
    // 5. Find current and next slot
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

    //////////////////////////////////////////////////////
    // 6. No available slot
    //////////////////////////////////////////////////////

    if (!selectedSlot) {
      return res.json({
        success: true,
        message: "No available slots for today",
        data: null
      });
    }

    //////////////////////////////////////////////////////
    // 7. Calculate delay
    //////////////////////////////////////////////////////

    let delayMinutes = 0;

    if (currentSlot) {
      const [sh, sm] = selectedSlot.startTime.split(":").map(Number);
      const slotStartMinutes = sh * 60 + sm;
      delayMinutes = Math.max(0, currentMinutes - slotStartMinutes);
    }

    //////////////////////////////////////////////////////
    // 8. Check booking
    //////////////////////////////////////////////////////

    const booking = await prisma.slotBooking.findUnique({
      where: {
        riderId_date_slotId: {
          riderId,
          date: today,
          slotId: selectedSlot.id
        }
      }
    });

    //////////////////////////////////////////////////////
    // 9. Response (same Swagger format)
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
          slotId: selectedSlot.id,
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

    // Default date = today (IST)
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const date = req.query.date || now.toISOString().split("T")[0];

    // Convert date string to Date object range
    const startOfDay = new Date(date + "T00:00:00.000Z");
    const endOfDay = new Date(date + "T23:59:59.999Z");

    // 🔥 Find Slot
    const slot = await prisma.slot.findFirst({
      where: {
        id: slotId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
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

    const bookedRiders = slot.riderBookings.map(r => r.riderId);

    const bookedRidersCount = bookedRiders.length;

    const availableRiders = Math.max(
      0,
      slot.maxRiders - bookedRidersCount
    );

    return res.json({
      success: true,
      message: "Slot capacity fetched successfully",
      data: {
        slotId: slot.id,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxRiders: slot.maxRiders,

        riders: bookedRiders,

        bookedRidersCount,
        availableRiders,
        isFull: availableRiders === 0,
        canBook: availableRiders > 0
      }
    });

  } catch (err) {
    console.error("Slot Capacity Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


