
const Incentive = require("../models/IncentiveSchema");

exports.createWeeklyBonus = async (req, res) => {
  try {
    const { title, description, weeklyRules, maxRewardPerWeek } = req.body;

    if (!weeklyRules?.minOrdersPerDay || weeklyRules.minOrdersPerDay <= 0) {
      return res.status(400).json({
        message: "Minimum orders per day is required"
      });
    }

    if (!maxRewardPerWeek || maxRewardPerWeek <= 0) {
      return res.status(400).json({
        message: "Max weekly reward must be greater than 0"
      });
    }

    const incentive = await Incentive.create({
      title,
      description,
      incentiveType: "WEEKLY_TARGET",

      weeklyRules,
      maxRewardPerWeek,

      payoutTiming: "WEEKLY",
      status: "ACTIVE"
    });

    res.status(201).json({
      success: true,
      message: "Weekly bonus rule created successfully",
      data: incentive
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// ========================================
// ADMIN UPSERT INCENTIVE
// ========================================

exports.upsertIncentive = async (req, res) => {
  try {

    const {
      title,
      description,
      incentiveType,
      slotRules,
      slabs,
      totalRewardAmount,
      status
    } = req.body;

    // -----------------------------
    // Mandatory Validation
    // -----------------------------

    if (
      !title ||
      !description ||
      !incentiveType ||
      !slotRules ||
      !slabs ||
      totalRewardAmount === undefined ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields including totalRewardAmount are mandatory"
      });
    }

    // -----------------------------
    // Slot Rules Validation
    // -----------------------------

    if (
      slotRules.minPeakSlots === undefined ||
      slotRules.minNormalSlots === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "slotRules.minPeakSlots and minNormalSlots required"
      });
    }

    // -----------------------------
    // Slabs Validation
    // -----------------------------

    if (!slabs.peak || !slabs.normal) {
      return res.status(400).json({
        success: false,
        message: "Peak and Normal slabs required"
      });
    }

    // -----------------------------
    // AUTO SPLIT TOTAL REWARD
    // -----------------------------

    const peakReward = Math.floor(Number(totalRewardAmount) / 2);
    const normalReward = Number(totalRewardAmount) - peakReward;

    // -----------------------------
    // ATTACH REWARD INTERNALLY
    // -----------------------------

    const mappedSlabs = {
      peak: slabs.peak.map(s => ({
        minOrders: s.minOrders,
        maxOrders: s.maxOrders,
        rewardAmount: peakReward
      })),

      normal: slabs.normal.map(s => ({
        minOrders: s.minOrders,
        maxOrders: s.maxOrders,
        rewardAmount: normalReward
      }))
    };

    // -----------------------------
    // INCENTIVE PAYLOAD
    // -----------------------------

    const incentivePayload = {
      title,
      description,
      incentiveType,

      applicableSlots: {
        peak: true,
        normal: true
      },

      slotRules,
      slabs: [mappedSlabs],
      status
    };

    // -----------------------------
    // UPSERT (ALWAYS ALLOW UPDATE)
    // -----------------------------

    const incentive = await Incentive.findOneAndUpdate(
      { incentiveType },
      incentivePayload,
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "Incentive saved successfully",
      totalRewardAmount,
      data: incentive
    });

  } catch (error) {

    console.error("Admin Incentive Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save incentive"
    });
  }
};


exports.adminIncentiveController = async (req, res) => {
  try {

    /**
     * ===========================
     * GET PEAK SLOT INCENTIVE
     * ===========================
     */
    if (req.method === "GET") {
      const incentive = await Incentive.findOne({
        incentiveType: "PEAK_SLOT",
        status: "ACTIVE"
      }).lean();

      if (!incentive || !incentive.slabs || incentive.slabs.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No peak slot incentive found",
          data: null
        });
      }

      // ✅ CORRECT ACCESS
      const slabBlock = incentive.slabs[0];
      const peakSlabs = slabBlock.peak || [];

      const minPeak = incentive.slotRules?.minPeakSlots || 0;
      const minNormal = incentive.slotRules?.minNormalSlots || 0;
      const totalMinSlots = minPeak + minNormal;

      const maxOrders = peakSlabs.length
        ? Math.max(...peakSlabs.map(s => s.maxOrders))
        : null;

      const slotRule =
        totalMinSlots && maxOrders
          ? `${totalMinSlots} - ${maxOrders} hrs`
          : null;

      return res.status(200).json({
        success: true,
        message: "Peak slot incentive fetched successfully",
        data: {
          title: incentive.title,
          slotRule,
          slabs: peakSlabs.map(s => ({
            orders: s.minOrders,
            rewardAmount: s.rewardAmount
          })),
          payoutTiming: incentive.payoutTiming
        }
      });
    }

    /**
     * ===========================
     * POST PEAK SLOT INCENTIVE
     * ===========================
     */
    if (req.method === "POST") {
      const {
        title,
        description,
        minPeakSlots,
        minNormalSlots,
        slabs,
        status
      } = req.body;

      if (!slabs?.peak || slabs.peak.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Peak slabs are required"
        });
      }

      await Incentive.findOneAndUpdate(
        { incentiveType: "PEAK_SLOT" },
        {
          title,
          description,
          incentiveType: "PEAK_SLOT",
          applicableSlots: { peak: true, normal: true },
          slotRules: {
            minPeakSlots,
            minNormalSlots
          },
          slabs: [
            {
              peak: slabs.peak,
              normal: slabs.normal || []
            }
          ],
          payoutTiming: "POST_SLOT",
          status
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Peak slot incentive saved successfully"
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });

  } catch (error) {
    console.error("Peak Incentive Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
