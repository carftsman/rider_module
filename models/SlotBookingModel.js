// // const mongoose = require("mongoose");

// // const SlotBookingSchema = new mongoose.Schema(
// //   {
// //     riderId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Rider",
// //       required: true,
// //       index: true
// //     },

// //     weeklySlotId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "WeeklySlots",
// //       required: true
// //     },

// //     slotKey: {
// //       type: String,
// //       required: true // "TUE_08_10"
// //     },

// //     date: {
// //       type: Date,
// //       required: true,
// //       index: true
// //     },

// //     dayOfWeek: {
// //       type: String,
// //       enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
// //       required: true
// //     },

// //     dayNumber: {
// //       type: Number,
// //       min: 1,
// //       max: 7,
// //       required: true
// //     },

// //     weekNumber: {
// //       type: Number,
// //       required: true
// //     },

// //     year: {
// //       type: Number,
// //       required: true
// //     },

// //     city: {
// //       type: String,
// //       required: true
// //     },

// //     zone: {
// //       type: String,
// //       required: true
// //     },

// //     startTime: {
// //       type: String,
// //       required: true // "08:00"
// //     },

// //     endTime: {
// //       type: String,
// //       required: true // "10:00"
// //     },

// //     /* CRITICAL FIELDS */
// //     slotStartAt: {
// //       type: Date,
// //       required: true,
// //       index: true
// //     },

// //     slotEndAt: {
// //       type: Date,
// //       required: true
// //     },

// //     totalMinutes: {
// //       type: Number,
// //       required: true
// //     },

// //     isPeakSlot: {
// //       type: Boolean,
// //       default: false
// //     },

// //     incentiveText: {
// //       type: String,
// //       default: ""
// //     },

// //     status: {
// //       type: String,
// //       enum: [
// //         "BOOKED",
// //         "CANCELLED_BY_RIDER",
// //         "CANCELLED_BY_SYSTEM",
// //         "COMPLETED",
// //         "NO_SHOW"
// //       ],
// //       default: "BOOKED",
// //       index: true
// //     },

// //     bookedFrom: {
// //       type: String,
// //       enum: ["APP", "ADMIN"],
// //       default: "APP"
// //     }
// //   },
// //   { timestamps: true }
// // );


// // // Prevent same rider booking same slot again

// // SlotBookingSchema.index(
// //   { riderId: 1, date: 1, slotKey: 1 },
// //   { unique: true }
// // );

// // module.exports = mongoose.model("SlotBooking", SlotBookingSchema);


// Lachi don't change this code please

const mongoose = require("mongoose");

const SlotBookingSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
      index: true
    },

    // NEW: reference to the daily slot document
    daySlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true
    },

    // NEW: reference to the nested slot inside slots[]
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    // Optional but useful
    slotKey: { type: String },

    date: {
      type: String, // stored as "2025-12-01"
      index: true
    },

    dayOfWeek: {
      type: String,
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    },

    dayNumber: {
      type: Number,
      min: 1,
      max: 7
    },

    weekNumber: {
      type: Number,

    },

    year: {
      type: Number,
    },

    city: { type: String,  },
    zone: { type: String,  },

    startTime: { type: String, },
    endTime: { type: String, },

    slotStartAt: { type: Date, index: true },
    slotEndAt: { type: Date,  },

    totalMinutes: { type: Number, },

    isPeakSlot: { type: Boolean, default: false },
    incentiveText: { type: String, default: "" },

    status: {
      type: String,
      enum: [
        "BOOKED",
        "CANCELLED_BY_RIDER",
        "CANCELLED_BY_SYSTEM",
        "COMPLETED",
        "NO_SHOW"
      ],
      default: "BOOKED",
      index: true
    },
    progress: {
        type: String,
        enum: ["UPCOMING", "RUNNING", "COMPLETED", "MISSED"],
        default: "UPCOMING",
        index: true
    },
    bookedFrom: {
      type: String,
      enum: ["APP", "ADMIN"],
      default: "APP"
    },

    cancellationReason: { type: String, default: "" }
  },
  { timestamps: true }
);

// UNIQUE BOOKING: rider cannot book same slot twice
SlotBookingSchema.index(
  { riderId: 1, date: 1, slotId: 1 },
  { unique: true }
);

module.exports = mongoose.model("SlotBooking", SlotBookingSchema);

















// const mongoose = require("mongoose");

// const SlotBookingSchema = new mongoose.Schema(
//   {
//     /* =========================
//        CORE REFERENCES
//     ========================== */
//     riderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Rider",
//       required: true,
//       index: true
//     },

//     weeklySlotId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "WeeklySlots",
//       required: true
//     },

//     slotId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true
//     },

//     slotKey: {
//       type: String, // "MON_06_08"
//       required: true
//     },

//     /* =========================
//        DATE & TIME
//     ========================== */
//     date: {
//       type: Date, // ALWAYS store Date, not string
//       required: true,
//       index: true
//     },

//     slotStartAt: {
//       type: Date,
//       required: true,
//       index: true
//     },

//     slotEndAt: {
//       type: Date,
//       required: true,
//       index: true
//     },

//     startTime: {
//       type: String, // "06:00"
//       required: true
//     },

//     endTime: {
//       type: String, // "08:00"
//       required: true
//     },

//     totalMinutes: {
//       type: Number,
//       required: true
//     },

//     /* =========================
//        LOCATION (CRITICAL)
//     ========================== */
//     city: {
//       type: String,
//       required: true,
//       index: true,
//       trim: true
//     },

//     zone: {
//       type: String,
//       required: true,
//       index: true,
//       trim: true
//     },

//     /* =========================
//        STATUS & PROGRESS
//     ========================== */
//     status: {
//       type: String,
//       enum: [
//         "BOOKED",
//         "CANCELLED_BY_RIDER",
//         "CANCELLED_BY_SYSTEM"
//       ],
//       default: "BOOKED",
//       index: true
//     },

//     progress: {
//       type: String,
//       enum: ["UPCOMING", "RUNNING", "COMPLETED"],
//       default: "UPCOMING",
//       index: true
//     },

//     /* =========================
//        INCENTIVES
//     ========================== */
//     isPeakSlot: {
//       type: Boolean,
//       default: false
//     },

//     incentiveText: {
//       type: String,
//       default: ""
//     },

//     /* =========================
//        META
//     ========================== */
//     bookedFrom: {
//       type: String,
//       enum: ["APP", "ADMIN"],
//       default: "APP"
//     },
//     // Notification tracking
    
//     reminderSent: {
//         type: Boolean,
//         default: false
//     },
//     startedNotificationSent: {
//         type: Boolean,
//         default: false
//     },
//     missedNotificationSent: {
//     type: Boolean,
//     default: false
//     },

//     cancellationReason: {
//       type: String,
//       default: ""
//     }
//   },
//   { timestamps: true }
// );

// /* =========================
//    INDEXES (IMPORTANT)
// ========================== */

// // Prevent same rider booking same slot again
// SlotBookingSchema.index(
//   { riderId: 1, slotId: 1, date: 1 },
//   { unique: true }
// );

// // Fast confirmOrder lookup
// SlotBookingSchema.index({
//   status: 1,
//   progress: 1,
//   slotStartAt: 1,
//   slotEndAt: 1,
//   city: 1,
//   zone: 1
// });

// module.exports = mongoose.model("SlotBooking", SlotBookingSchema);
