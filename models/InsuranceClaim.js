// models/InsuranceClaim.js
const mongoose = require("mongoose");

const InsuranceClaimSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
      index: true
    },

    policyId: {
      type: String,
      required: true
    },

    claimId: {
      type: String,
      required: true,
      unique: true
    },

    insuranceType: {
      type: String,
      enum: ["ACCIDENT", "HEALTH", "THIRD_PARTY", "VEHICLE"]
    },

    orderId: String,

    incidentDate: Date,

    status: {
      type: String,
      enum: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "PAID"],
      default: "SUBMITTED"
    },

    claimedAmount: Number,
    approvedAmount: Number,

    rejectionReason: String,
    settledOn: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("InsuranceClaim", InsuranceClaimSchema);
