// models/InsurancePolicy.js
const mongoose = require("mongoose");

const CoverageSchema = new mongoose.Schema(
  {
    covered: { type: Boolean, default: false },
    amount: { type: Number } // optional for some coverages
  },
  { _id: false }
);

const InsurancePolicySchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
      index: true
    },

    policyStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "EXPIRED"],
      default: "ACTIVE"
    },

    policyId: {
      type: String,
      required: true,
      unique: true
    },

    policyProvider: {
      name: String,
      helpline: String,
      email: String
    },

    policyDuration: {
      startDate: Date,
      endDate: Date
    },

    coveragePeriod: {
      type: String,
      enum: ["ON_DUTY_ONLY", "24X7"],
      default: "ON_DUTY_ONLY"
    },

    insuranceType: {
      type: String,
      enum: ["ACCIDENT", "HEALTH", "THIRD_PARTY", "VEHICLE"],
      required: true
    },

    coverages: {
      accidentalDeath: CoverageSchema,
      permanentDisability: CoverageSchema,
      temporaryDisability: CoverageSchema,
      hospitalization: CoverageSchema
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InsurancePolicy", InsurancePolicySchema);
