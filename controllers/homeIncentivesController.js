// const Incentive = require("../models/IncentiveSchema");
 
// exports.getHomeIncentives = async (req, res) => {
//   try {
//     const incentives = await Incentive.find({ status: "ACTIVE" });
 
//     return res.status(200).json({
//       success: true,
//       count: incentives.length,
//       incentives
//     });
//   } catch (error) {
//     console.error("Home Incentives Error:", error);
 
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch incentives"
//     });
//   }
// };

const Incentive = require("../models/IncentiveSchema");

/**
 * GET /api/home/incentives
 * Fetch ONLY peak hour incentives for home dashboard
 */
exports.getHomeIncentives = async (req, res) => {
  try {
    const incentives = await Incentive.find({
      status: "ACTIVE",
      incentiveType: "PEAK_HOUR"
    });

    return res.status(200).json({
      success: true,
      count: incentives.length,
      incentives
    });
  } catch (error) {
    console.error("Home Incentives Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch incentives"
    });
  }
};
