// models/RawPayload.js
const mongoose = require("mongoose");

const RawPayloadSchema = new mongoose.Schema(
  {},
  {
    strict: false,      // 🔥 allows ANY keys
    timestamps: true
  }
);

module.exports = mongoose.model("RawPayload", RawPayloadSchema);
