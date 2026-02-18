const mongoose = require("mongoose");

const RiderDailyStatsSchema = new mongoose.Schema({

  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rider",
    index: true
  },

  date: {
    type: String, // "2026-01-27"
    index: true
  },

  completedOrders: {
    type: Number,
    default: 0
  },

  totalEarnings: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("RiderDailyStats", RiderDailyStatsSchema);
