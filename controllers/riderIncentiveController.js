const Incentive = require("../models/IncentiveSchema");
const RiderDailyStats = require("../models/RiderDailyStatsSchema");

const Order = require("../models/OrderSchema");

exports.getWeeklyIncentiveForRider = async (req, res) => {
  try {
    const riderId = req.rider._id; // from  middleware
    // console.log("Rider ID:", riderId);
    // 1. Get active weekly incentive
const incentive = await Incentive.findOne({
  incentiveType: "WEEKLY_TARGET",
  status: "ACTIVE"
}).sort({ createdAt: -1 });
    console.log("Incentive found:", incentive);
    if (!incentive) {
      return res.status(200).json({
        success: true,
        message: "No weekly incentive available",
        data: null
      });
    }

    // 2. Calculate current week range
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 3. Fetch rider daily stats for the week
    const stats = await RiderDailyStats.find({
      riderId,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    // 4. Calculate progress
    const minOrders = incentive.weeklyRules.minOrdersPerDay;

    let eligibleDays = 0;
    let totalOrders = 0;

    stats.forEach(day => {
      totalOrders += day.ordersCompleted;
      if (day.ordersCompleted >= minOrders) {
        eligibleDays++;
      }
    });

    const totalDaysRequired = incentive.weeklyRules.totalDaysInWeek;

    const isEligible = incentive.weeklyRules.allowPartialDays
      ? eligibleDays >= 1
      : eligibleDays >= totalDaysRequired;

    // 5. Final response for UI
    res.status(200).json({
      success: true,
      data: {
        incentiveId: incentive._id,
        title: incentive.incentiveType,
        description: incentive.description,

        weeklyRules: incentive.weeklyRules,
        maxRewardPerWeek: incentive.maxRewardPerWeek,

        progress: {
          eligibleDays,
          totalDaysRequired,
          totalOrders,
          isEligible
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// ========================================
// RIDER DAILY INCENTIVE API
// ========================================

const mongoose = require("mongoose");

exports.getDailyIncentive = async (req, res) => {
  try {

    // -----------------------------
    // AUTH SAFETY
    // -----------------------------

    const riderId = req.rider?._id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

    const riderObjectId = new mongoose.Types.ObjectId(riderId);

    // -----------------------------
    // TODAY RANGE
    // -----------------------------

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // -----------------------------
    // FETCH DELIVERED ORDERS
    // -----------------------------

    const orders = await Order.find({
      $and: [
        {
          $or: [
            { rider: riderObjectId },
            { riderId: riderObjectId },
            { assignedRider: riderObjectId },
            { deliveryPartner: riderObjectId }
          ]
        },
        {
          orderStatus: { $regex: /^DELIVERED$/i }
        },
        {
          $or: [
            { deliveredAt: { $gte: startOfDay, $lte: endOfDay } },
            { updatedAt: { $gte: startOfDay, $lte: endOfDay } }
          ]
        }
      ]
    });

    // -----------------------------
    // ORDER STATS
    // -----------------------------

    let totalOrders = orders.length;
    let peakOrders = 0;
    let normalOrders = 0;

    orders.forEach(order => {
      const slot = order.slotType?.toUpperCase();
      if (slot === "PEAK") peakOrders++;
      if (slot === "NORMAL") normalOrders++;
    });

    // -----------------------------
    // FETCH INCENTIVE CONFIG
    // -----------------------------

    const incentive = await Incentive.findOne({
      incentiveType: "DAILY_TARGET",
      status: "ACTIVE"
    });

let incentiveAmount = 0;
let potentialRewardAmount = 0;

if (incentive && incentive.slabs?.length) {

  const slabBlock = incentive.slabs[0];

  const minPeakSlots = Number(incentive.slotRules?.minPeakSlots || 0);
  const minNormalSlots = Number(incentive.slotRules?.minNormalSlots || 0);

  // -------------------------
  // CALCULATE POTENTIAL REWARD (FROM CONFIG)
  // -------------------------

  let maxPeakReward = 0;
  let maxNormalReward = 0;

  slabBlock.peak?.forEach(slab => {
    maxPeakReward = Math.max(
      maxPeakReward,
      Number(slab.rewardAmount || 0)
    );
  });

  slabBlock.normal?.forEach(slab => {
    maxNormalReward = Math.max(
      maxNormalReward,
      Number(slab.rewardAmount || 0)
    );
  });

  potentialRewardAmount = maxPeakReward + maxNormalReward;

  // -------------------------
  // ACTUAL ELIGIBILITY CHECK
  // -------------------------

  const peakEligible =
    incentive.applicableSlots?.peak
      ? peakOrders >= minPeakSlots
      : true;

  const normalEligible =
    incentive.applicableSlots?.normal
      ? normalOrders >= minNormalSlots
      : true;

  let peakReward = 0;
  let normalReward = 0;

  // PEAK MATCH
  slabBlock.peak?.forEach(slab => {
    if (
      peakOrders >= slab.minOrders &&
      peakOrders <= slab.maxOrders
    ) {
      peakReward = Number(slab.rewardAmount);
    }
  });

  // NORMAL MATCH
  slabBlock.normal?.forEach(slab => {
    if (
      normalOrders >= slab.minOrders &&
      normalOrders <= slab.maxOrders
    ) {
      normalReward = Number(slab.rewardAmount);
    }
  });

  // BOTH SLOTS REQUIRED
  if (
    peakEligible &&
    normalEligible &&
    peakReward > 0 &&
    normalReward > 0
  ) {
    incentiveAmount = peakReward + normalReward;
  }

  // DAILY CAP
  if (
    incentive.maxRewardPerDay &&
    incentiveAmount > Number(incentive.maxRewardPerDay)
  ) {
    incentiveAmount = Number(incentive.maxRewardPerDay);
  }
}
    // -----------------------------
    // RESPONSE
    // -----------------------------

    const slabBlock = incentive?.slabs?.[0] || {};

    return res.status(200).json({
      success: true,

      title: incentive?.title || null,
      description: incentive?.description || null,
      incentiveType: incentive?.incentiveType || null,

      completedOrders: totalOrders,
      peakCompleted: peakOrders,
      normalCompleted: normalOrders,

      slotRules: {
        minPeakSlots: incentive?.slotRules?.minPeakSlots || 0,
        minNormalSlots: incentive?.slotRules?.minNormalSlots || 0
      },

      slabs: {
        peak: slabBlock.peak?.map(s => ({
          minOrders: s.minOrders,
          maxOrders: s.maxOrders
        })) || [],

        normal: slabBlock.normal?.map(s => ({
          minOrders: s.minOrders,
          maxOrders: s.maxOrders
        })) || []
      },

      totalRewardAmount: incentiveAmount,
      potentialRewardAmount: potentialRewardAmount,

      eligible: incentiveAmount > 0,
      status: incentive?.status || null
    });

  } catch (error) {

    console.error("Daily Incentive Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate incentive"
    });
  }
};
