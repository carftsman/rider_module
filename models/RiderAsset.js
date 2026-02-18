const mongoose = require("mongoose");
const { Schema } = mongoose;

const RiderAssetsSchema = new Schema(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
      unique: true,
    },

    assets: [
      {
        assetType: {
          type: String,
          enum: ["T_SHIRT", "BAG", "HELMET", "JACKET", "ID_CARD", "OTHER"],
          required: true,
        },
        assetName: String,
        quantity: { type: Number, default: 1 },
        issuedDate: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["ISSUED", "RETURNED", "LOST"],
          default: "ISSUED",
        },
  

    condition: {
      type: String,
      enum: ["GOOD", "BAD"],
      default: "GOOD",
    },

    returnedDate: Date,
  },
],


    /** 🔴 NEW: Issues raised by rider */
    issues: [
      {
        assetType: {
          type: String,
          enum: ["T_SHIRT", "BAG", "HELMET", "JACKET", "ID_CARD", "OTHER"],
          required: true,
        },
        assetName: String,

        issueType: {
          type: String,
          enum: ["DAMAGED", "LOST", "WRONG_SIZE", "OTHER"],
          default: "OTHER",
        },

        description: String,

        status: {
          type: String,
          enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
          default: "OPEN",
        },

        raisedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },

    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("RiderAssets", RiderAssetsSchema);
