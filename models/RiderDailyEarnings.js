const mongoose = require("mongoose");
const { Schema } = mongoose;

const RiderDailyEarningsSchema = new Schema(
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

    ordersCount: {
      type: Number,
      default: 0
    },

    baseEarnings: {
      type: Number,
      default: 0
    },

    incentiveEarnings: {
      type: Number,
      default: 0
    },

    tips: {
      type: Number,
      default: 0
    },

    totalEarnings: {
      type: Number,
      default: 0
    },

    payoutStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

// One record per rider per day
RiderDailyEarningsSchema.index(
  { riderId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "RiderDailyEarnings",
  RiderDailyEarningsSchema
);
