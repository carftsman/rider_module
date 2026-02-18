// const mongoose = require("mongoose");

// const SlotSchema = new mongoose.Schema(
//   {
//     weekNumber: {
//       type: Number,
//       required: true,
//       min: 1,
//       max: 53
//     },

//     year: {
//       type: Number,
//       required: true
//     },

//     city: {
//       type: String,
//       required: true
//     },

//     zone: {
//       type: String,
//       required: true
//     },

//     slots: [
//       {
//         slotKey: {
//           type: String,
//           required: true // "MON_06_08"
//         },

//         dayOfWeek: {
//           type: String,
//           enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
//           required: true
//         },

//         dayNumber: {
//           type: Number,
//           min: 1,
//           max: 7,
//           required: true
//         },

//         startTime: {
//           type: String,
//           required: true
//         },

//         endTime: {
//           type: String,
//           required: true
//         },

//         durationInMinutes: {
//           type: Number,
//           required: true
//         },

//         breakInMinutes: {
//           type: Number,
//           default: 10
//         },

//         maxRiders: {
//           type: Number,
//           required: true,
//           min: 1
//         },

//         bookedRiders: {
//           type: Number,
//           default: 0,
//           min: 0
//         },

//         isAvailable: {
//           type: Boolean,
//           default: true
//         },

//         isVisible: {
//           type: Boolean,
//           default: true
//         },

//         isLocked: {
//           type: Boolean,
//           default: false // admin lock
//         },

//         autoLocked: {
//           type: Boolean,
//           default: false // system lock
//         },

//         isPeakSlot: {
//           type: Boolean,
//           default: false
//         },

//         incentiveText: {
//           type: String,
//           default: ""
//         },

//         incentiveAmount: {
//           type: Number,
//           default: 0
//         },

//         priority: {
//           type: Number,
//           default: 0
//         },

//         status: {
//           type: String,
//           enum: ["ACTIVE", "INACTIVE"],
//           default: "ACTIVE"
//         }
//       }
//     ],

//     isDeleted: {
//       type: Boolean,
//       default: false
//     }
//   },
//   { timestamps: true }
// );

// SlotSchema.index({ weekNumber: 1, year: 1, city: 1, zone: 1 });

// module.exports = mongoose.model("WeeklySlots", SlotSchema);


const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 53
    },

    year: {
      type: Number,
      required: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    zone: {
      type: String,
      required: true,
      trim: true
    },

    /* ------- ALL 7 DAY SLOTS INSIDE HERE ------- */
    slots: [
      {
        _id: false,               // We generate slotId manually
        slotId: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId()
        },

        date: {
          type: Date,
          required: true
        },

        slotKey: {
          type: String,
          required: true,        // "MON_06_08"
          index: true
        },

        dayOfWeek: {
          type: String,
          enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
          required: true
        },

        dayNumber: {
          type: Number,
          min: 1,
          max: 7,
          required: true
        },

        startTime: {
          type: String,
          required: true         // "06:00"
        },

        endTime: {
          type: String,
          required: true         // "08:00"
        },

        durationInMinutes: {
          type: Number,
          required: true         // 120
        },

        /* ------------ COMPUTED DATES ------------ */
        slotStartAt: {
          type: Date,
          required: true,
          index: true
        },

        slotEndAt: {
          type: Date,
          required: true
        },

        breakInMinutes: {
          type: Number,
          default: 10
        },

        maxRiders: {
          type: Number,
          required: true,
          min: 1
        },

        bookedRiders: {
          type: Number,
          default: 0,
          min: 0
        },

        riders: [
          {
            riderId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Rider",
              
            },

            status: {
              type: String,
              enum: ["BOOKED", "CANCELLED", "NO_SHOW", "COMPLETED"],
            },

            bookedAt: {
              type: Date,
              default: Date.now
            },

            cancelledAt: Date,
            noShowAt: Date
          }
        ],



        /* ------------ ADMIN & SYSTEM FLAGS ------------ */
        isAvailable: {
          type: Boolean,
          default: true
        },

        isVisible: {
          type: Boolean,
          default: true
        },

        isLocked: {
          type: Boolean,
          default: false       // Admin lock
        },

        autoLocked: {
          type: Boolean,
          default: false       // System auto-lock
        },

        isPeakSlot: {
          type: Boolean,
          default: false
        },

        incentiveText: {
          type: String,
          default: ""
        },

        incentiveAmount: {
          type: Number,
          default: 0
        },

        priority: {
          type: Number,
          default: 0           // Sorting priority
        },

        status: {
          type: String,
          enum: ["ACTIVE", "INACTIVE"],
          default: "ACTIVE"
        }
      }
    ],

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

/* Composite Index for Fast Weekly Fetch */
SlotSchema.index(
  { weekNumber: 1, year: 1, city: 1, zone: 1 },
  { unique: true }
);

/* Search inside sub-slots fast */
SlotSchema.index({ "slots.slotKey": 1 });
SlotSchema.index({ "slots.slotId": 1 });

module.exports = mongoose.model("WeeklySlots", SlotSchema);
