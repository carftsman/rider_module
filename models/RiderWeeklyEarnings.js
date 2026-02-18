const mongoose = require("mongoose");
const { Schema } = mongoose;

const RiderWeeklyEarningsSchema = new Schema(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "Rider",
      index: true
    },

    weekStart: Date,
    weekEnd: Date,

    totalOrders: Number,
    totalEarnings: Number,
    weeklyBonus: Number,

    payoutStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "RiderWeeklyEarnings",
  RiderWeeklyEarningsSchema
);
