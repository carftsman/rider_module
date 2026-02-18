const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
      index: true
    },

    issueType: {
      type: String,
      required: true,
      enum: [
        "CUSTOMER_NOT_RESPONDING",
        "WRONG_ADDRESS",
        "UNSAFE_LOCATION",
        "STORE_DELAY",
        "ORDER_NOT_AVAILABLE",
        "PAYMENT_ISSUE",
        "OTHER"
      ]
    },

    notes: {
      type: String,
      default: ""
    },

    // Attach order or slot if issue belongs to them
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SlotBooking",
      default: null
    },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", IssueSchema);
