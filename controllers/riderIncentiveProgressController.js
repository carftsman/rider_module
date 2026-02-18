const RiderIncentiveProgress = require(
  "../models/RiderIncentiveProgressSchema"
);

const zero = (type) => ({
  incentiveType: type,
  totalOrders: 0,
  normalOrders: 0,
  peakOrders: 0,
  achievedSlabOrders: 0,
  achievedReward: 0,
  eligible: false,
  status: "IN_PROGRESS"
});

/**
 * DAY
 */
exports.getDayIncentive = async (req, res) => {
  try {
    const riderId = req.rider._id;
    console.log(riderId)
    const today = new Date().toISOString().slice(0, 10);

    const data = await RiderIncentiveProgress.findOne({
      riderId,
      incentiveType: "DAILY_TARGET",
      date: today
    }).lean();

    return res.json({
      success: true,
      data: data || zero("DAILY_TARGET")
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
};

/**
 * PEAK
 */
exports.getPeakIncentive = async (req, res) => {
  try {
    const riderId = req.rider._id;
    const today = new Date().toISOString().slice(0, 10);

    const data = await RiderIncentiveProgress.findOne({
      riderId,
      incentiveType: "PEAK_TARGET",
      date: today
    }).lean();

    return res.json({
      success: true,
      data: data || zero("PEAK_TARGET")
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
};

/**
 * WEEK
 */
exports.getWeekIncentive = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(
      (((now - start) / 86400000) + start.getDay() + 1) / 7
    );
    const weekKey = `${now.getFullYear()}-W${week}`;

    const data = await RiderIncentiveProgress.findOne({
      riderId,
      incentiveType: "WEEKLY_TARGET",
      week: weekKey
    }).lean();

    return res.json({
      success: true,
      data: data || zero("WEEKLY_TARGET")
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
};
