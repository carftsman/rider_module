const mongoose=require('mongoose');
 
const RiderIncentiveProgressSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
 
  incentiveId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
 
  incentiveType: {
    type: String,
    enum: ["PEAK_SLOT", "DAILY_TARGET", "WEEKLY_TARGET"],
    required: false
  },
 
  // 📅 Time Scoping
  date: String,       // YYYY-MM-DD (for PEAK & DAILY)
  week: String,       // YYYY-WW (for WEEKLY)
 
  // 📊 Order Counters
  totalOrders: { type: Number, default: 0 },
  peakOrders: { type: Number, default: 0 },
  normalOrders: { type: Number, default: 0 },
 
  // ⏱️ Slot Tracking (Peak Incentives)
  slotInfo: {
    slotName: String,      // "PEAK_6_10"
    slotStart: String,
    slotEnd: String
  },
 
  // 📆 Weekly Specific
  weeklyProgress: {
    eligibleDays: { type: Number, default: 0 },
    dailyOrderMap: {
      type: Map,
      of: Number // "2026-02-03": 12 orders
    }
  },
 
  // 🎯 Eligibility & Slab
  achievedSlabOrders: { type: Number, default: 0 },
  achievedReward: { type: Number, default: 0 },
 
  eligible: { type: Boolean, default: false },
 
  status: {
    type: String,
    enum: ["IN_PROGRESS", "ACHIEVED", "PAID"],
    default: "IN_PROGRESS"
  }
 
}, { timestamps: true });
 
 module.exports = mongoose.model(
  "RiderIncentiveProgress",
  RiderIncentiveProgressSchema
);
 
 