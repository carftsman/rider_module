const mongoose = require("mongoose");

const earningSummarySchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      required: true
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EarningSummary", earningSummarySchema);
