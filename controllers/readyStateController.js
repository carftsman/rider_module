const prisma=require('../config/prisma');

exports.markOrderStateReady = async (req, res) => {
  try {
    const riderId = req.rider.id; // prisma uses id not _id
     console.log("ready state api : " ,riderId)
    const updatedRider = await prisma.rider.updateMany({
      where: {
        id: riderId,
        NOT: { orderState: "READY" }
      },
      data: {
        orderState: "READY",
        currentOrderId: null
      }
    });
    if (updatedRider.count === 0) {
      return res.status(200).json({
        success: true,
        message: "Order state already READY"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order state changed to READY"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

