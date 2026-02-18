const mongoose = require("mongoose");

const { Schema } = mongoose;

const PricingConfigSchema = new Schema(
  {
    baseFare: {
      baseAmount: {
        type: Number,
        required: true,
      },
      baseDistanceKm: {
        type: Number,
        required: true,
      },
    },

    distanceFare: {
      perKmRate: {
        type: Number,
        required: true,
      },
    },

    surges: [
      {
        type: {
          type: String,
          enum: ["PEAK", "RAIN", "ZONE", "NIGHT", "HIGH_DEMAND"],
          required: true,
        },

        multiplierType: {
          type: String,
          enum: ["FIXED", "PER_ORDER"],
          required: true,
        },

        value: {
          type: Number,
          required: true,
        },

        conditions: {
          startTime: String,
          endTime: String,
          zoneIds: [String],
          weather: String,
        },

        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PricingConfig", PricingConfigSchema);
