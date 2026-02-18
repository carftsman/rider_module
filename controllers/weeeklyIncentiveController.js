const Incentive = require("../models/IncentiveSchema");
const Order = require("../models/OrderSchema");
 
/**
* GET /api/incentives/weekly-earning
* Fetch week-wise incentive earning
*/
exports.getWeeklyIncentiveEarning = async (req, res) => {
  try {
    const riderId = req.rider._id;
 
    // Start of week (Monday)
    const startOfWeek = new Date();
    const day = startOfWeek.getDay(); // 0 = Sunday
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
 
    // End of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
 
    // Fetch ACTIVE weekly incentive
    const incentive = await Incentive.findOne({
      incentiveType: "WEEKLY_EARNING",
      status: "ACTIVE"
    });
 
    if (!incentive) {
      return res.status(200).json({
        success: true,
        message: "No active weekly incentive",
        data: null
      });
    }
 
    // Count delivered orders for the week
    const completedOrders = await Order.countDocuments({
      riderId,
      orderStatus: "DELIVERED",
      createdAt: { $gte: startOfWeek, $lte: endOfWeek }
    });
 
    const requiredOrders = incentive.condition?.minOrders 
    const achieved = completedOrders >= requiredOrders;
 
    return res.status(200).json({
      success: true,
      data: {
        weekStart: startOfWeek.toISOString().slice(0, 10),
        weekEnd: endOfWeek.toISOString().slice(0, 10),
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
    console.error("Weekly Incentive Error:", error);
 
    return res.status(500).json({
      success: false,
      message: "Failed to fetch weekly incentive earning"
    });
  }
};