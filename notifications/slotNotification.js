const SlotBooking = require("../models/SlotBookingModel");
const Rider = require("../models/RiderModel");
const fcmService = require("../helpers/fcmService");

// SLOT START REMINDER (10–15 mins before)

const sendSlotStartReminder = async () => {
  const now = new Date();
  const reminderTime = new Date(now.getTime() + 10 * 60 * 1000); // +10 mins

  const bookings = await SlotBooking.find({
    status: "BOOKED",
    reminderSent: false,
    slotStartAt: { $lte: reminderTime, $gt: now }
  }).populate("riderId");

  for (const booking of bookings) {
    const rider = booking.riderId;
    if (!rider?.fcmToken) continue;

    try {
      await fcmService.sendToDevice({
        token: rider.fcmToken,
        title: "Slot Starting Soon",
        body: `Your slot ${booking.startTime}-${booking.endTime} starts in 10 minutes`,
        data: {
          type: "SLOT_START_REMINDER",
          bookingId: booking._id.toString(),
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime
        }
      });

      booking.reminderSent = true;
      await booking.save();
    } catch (err) {
      console.error("Reminder FCM failed:", err.message);
    }
  }
};



// SLOT STARTED NOTIFICATION


const sendSlotStartedNotification = async () => {
  const now = new Date();

  const bookings = await SlotBooking.find({
    status: "BOOKED",
    startedNotificationSent: false,
    slotStartAt: { $lte: now }
  }).populate("riderId");

  for (const booking of bookings) {
    const rider = booking.riderId;
    if (!rider?.fcmToken) continue;

    try {
      await fcmService.sendToDevice({
        token: rider.fcmToken,
        title: "Slot Started",
        body: `Your slot ${booking.startTime}-${booking.endTime} has started`,
        data: {
          type: "SLOT_STARTED",
          bookingId: booking._id.toString(),
          date: booking.date
        }
      });

      booking.startedNotificationSent = true;
      await booking.save();
    } catch (err) {
      console.error("Slot started FCM failed:", err.message);
    }
  }
};


// MISSED SLOT NOTIFICATION (15 mins after slot start)


const sendMissedSlotNotification = async () => {
  const MISSED_GRACE_MINUTES = 15;
  const now = new Date();
  const graceTime = new Date(now.getTime() - MISSED_GRACE_MINUTES * 60 * 1000);

  const bookings = await SlotBooking.find({
    status: "BOOKED",
    missedNotificationSent: false,
    slotStartAt: { $lte: graceTime }
  }).populate("riderId");

  for (const booking of bookings) {
    const rider = booking.riderId;
    if (!rider || rider.isOnline) continue;
    if (!rider.fcmToken) continue;

    try {
      await fcmService.sendToDevice({
        token: rider.fcmToken,
        title: "Missed Slot",
        body: `You missed your slot ${booking.startTime}-${booking.endTime} on ${booking.date}`,
        data: {
          type: "SLOT_MISSED",
          bookingId: booking._id.toString(),
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime
        }
      });

      booking.missedNotificationSent = true;
      booking.missedAt = new Date();
      await booking.save();
    } catch (err) {
      console.error("Missed slot FCM failed:", err.message);
    }
  }
};







module.exports = {sendSlotStartReminder ,sendSlotStartedNotification , sendMissedSlotNotification};
