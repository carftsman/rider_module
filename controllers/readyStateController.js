const Rider = require("../models/RiderModel");




exports.markOrderStateReady = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const updatedRider = await Rider.findOneAndUpdate(
      {
        _id: riderId,
        orderState: { $ne: "READY" } // only update if NOT READY
      },
      {
        $set: {
          orderState: "READY",
          currentOrderId: null
        }
      },
      { new: true }
    );

    // If null → already READY or rider not found
    if (!updatedRider) {
      return res.status(200).json({
        success: true,
        message: "Order state already READY"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order state changed to READY",
      orderState: updatedRider.orderState
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


