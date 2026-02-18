const mongoose = require("mongoose");

const offlineStoreSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    completeAddress: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 250,
    },

    pincode: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/,
    },

    // city: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },

    // landmark: {
    //   type: String,
    //   trim: true,
    // },

    // contactNumber: {
    //   type: String,
    //   match: /^[0-9]{10}$/,
    // },

    // googleMapLink: {
    //   type: String,
    //   trim: true,
    // },

    // workingHours: {
    //   open: { type: String },  // e.g. "09:00 AM"
    //   close: { type: String }, // e.g. "06:00 PM"
    // },

    isActive: {
      type: Boolean,
      default: true,
    },

    // // Optional: Stock status for rider kit
    // kitAvailable: {
    //   type: Boolean,
    //   default: true,
    // },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OfflineStore", offlineStoreSchema);
