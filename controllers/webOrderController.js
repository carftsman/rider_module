const { emitOrderStatus } = require("../socket/socket");
const Order = require("../models/Order");

exports.updateOrderStatus = async (req, res) => {

  const { orderId, status } = req.body;

  const order = await Order.findOneAndUpdate(
    { orderId },
    { status },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // 🔥 LIVE UPDATE TO USER
  emitOrderStatus(orderId, {

    type: "ORDER_STATUS_UPDATE",

    orderId,

    status,

    message: getStatusMessage(status),

    time: new Date()

  });

  res.json({
    success: true,
    status
  });

};
