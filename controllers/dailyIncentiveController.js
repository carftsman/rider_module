const Incentive = require("../models/IncentiveSchema");
const Order = require("../models/OrderSchema");
 
/**
* GET /api/incentives/daily-earning
* Fetch day-wise daily incentive earning
*/
exports.getDailyIncentiveEarning = async (req, res) => {
  try {
    const riderId = req.rider._id;
 
    // Start & end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
 
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
 
    // Fetch ACTIVE daily incentive
    const incentive = await Incentive.findOne({
      incentiveType: "DAILY_EARNING",
      status: "ACTIVE"
    });
 
    if (!incentive) {
      return res.status(200).json({
        success: true,
        message: "No active daily incentive",
        data: null
      });
    }
 
    // Count today's delivered orders
    const completedOrders = await Order.countDocuments({
      riderId,
      orderStatus: "DELIVERED",
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
 
    const requiredOrders = incentive.condition?.minOrders || 0;
    const achieved = completedOrders >= requiredOrders;
 
    return res.status(200).json({
      success: true,
      data: {
        date: startOfDay.toISOString().slice(0, 10),
        incentiveId: incentive._id,
        title: incentive.title,
        requiredOrders,
        completedOrders,
        achieved,
        earnedAmount: achieved ? incentive.rewardValue : 0,
        maxRewardPerRider: incentive.maxRewardPerRider
      }
    });
 
  } catch (error) {
    console.error("Daily Incentive Error:", error);
 
    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily incentive earning"
    });
  }
};
