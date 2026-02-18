const mongoose = require("mongoose");
const { Schema } = mongoose;

const RiderOrderEarningsSchema = new Schema(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
      index: true
    },

    orderId: {
      type: String,
      required: true,
      index: true
    },
    orderRef: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true
    },

    storeName: String,

    slotType: {
      type: String,
      enum: ["PEAK", "NORMAL"]
    },

    basePay: {
      type: Number,
      default: 0
    },

    peakBonus: {
      type: Number,
      default: 0
    },

    incentiveAmount: {
      type: Number,
      default: 0
    },

    taxOrFees: {
      type: Number,
      default: 0
    },

    totalAmount: {
      type: Number,
      default: 0
    },

    completedAt: {
      type: Date,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "RiderOrderEarnings",
  RiderOrderEarningsSchema
);
