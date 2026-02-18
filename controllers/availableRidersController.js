const Rider = require("../models/RiderModel");
const SlotBooking = require("../models/SlotBookingModel");

// exports.getAvailableRiders = async (req, res) => {
exports.getAvailableRiders = async (req, res) => {
  try {
    const now = new Date();

    const riders = await SlotBooking.aggregate([
      {
        $match: {
          status: "BOOKED",
          slotEndAt: { $gte: now }
        }
      },
      {
        $group: {
          _id: "$riderId"
        }
      },
      {
        $lookup: {
          from: "riders",
          localField: "_id",
          foreignField: "_id",
          as: "rider"
        }
      },
      {
        $unwind: "$rider"
      },
      {
        $project: {
          _id: "$rider._id",
          name: "$rider.name",
          mobile: "$rider.mobile",
          isOnline: "$rider.riderStatus.isOnline"
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: riders.length,
      data: riders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
