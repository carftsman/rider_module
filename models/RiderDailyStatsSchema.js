const mongoose = require("mongoose");
const { Schema } = mongoose;

const RiderDailyStatsSchema = new Schema(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
      index: true
    },

    date: {
      type: Date,
      required: true,
      index: true
    },

    // Order & earnings summary
    ordersCompleted: {
      type: Number,
      default: 0
    },

    totalEarnings: {
      type: Number,
      default: 0
    },

    // Slot based breakup (future proof)
    slots: {
      peak: {
        orders: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 },
        completedSlots: { type: Number, default: 0 }
      },
      normal: {
        orders: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 },
        completedSlots: { type: Number, default: 0 }
      }
    },

    // Incentive tracking (optional but very useful)
    incentives: {
      dailyTargetMet: {
        type: Boolean,
        default: false
      },
      weeklyTargetEligible: {
        type: Boolean,
        default: false
      },
      peakSlotEligible: {
        type: Boolean,
        default: false
      }
    },

    // Bonus earned on this day
    bonusEarned: {
      type: Number,
      default: 0
    },

    // Final payout status
    payoutStatus: {
      type: String,
      enum: ["PENDING", "PROCESSED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

/**
 * Unique constraint:
 * One document per rider per day
 */
RiderDailyStatsSchema.index(
  { riderId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("RiderDailyStats", RiderDailyStatsSchema);
