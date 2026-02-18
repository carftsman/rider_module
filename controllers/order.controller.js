// const mongoose = require("mongoose");
// const Order = require("../models/OrderSchema");
// const { emitRiderDashboard } = require("../sockets/socket");

// exports.markOrderDelivered = async (req, res) => {

//   try {

//     const id = req.params.id;

//     console.log("DELIVER API RECEIVED ID:", id);

//     let order;

//     // If Mongo ObjectId
//     if (mongoose.Types.ObjectId.isValid(id)) {

//       order = await Order.findById(id);

//     } else {

//       // If custom orderId like ORD-GURU-001
//       order = await Order.findOne({ orderId: id });

//     }

//     console.log("ORDER FOUND:", order);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     if (order.orderStatus === "DELIVERED") {
//       return res.status(400).json({ message: "Already delivered" });
//     }

//     // Mark delivered
//     order.orderStatus = "DELIVERED";
//     await order.save();

//     const riderId = order.riderId;

//     // Start of today
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);

//     // Count delivered orders
//     const totalOrders = await Order.countDocuments({
//       riderId,
//       orderStatus: "DELIVERED",
//       updatedAt: { $gte: startOfDay }
//     });

//     // Sum earnings
//     const earningsResult = await Order.aggregate([

//       {
//         $match: {
//           riderId,
//           orderStatus: "DELIVERED",
//           updatedAt: { $gte: startOfDay }
//         }
//       },

//       {
//         $group: {
//           _id: null,
//           totalEarnings: { $sum: "$riderEarning.totalEarning" }
//         }
//       }

//     ]);

//     const totalEarnings =
//       earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0;

//     // Emit dashboard update
//     emitRiderDashboard(riderId.toString(), {

//       type: "DASHBOARD_UPDATE",

//       daily: {
//         totalOrders,
//         totalEarnings
//       },

//       message: "Order delivered successfully"

//     });

//     res.json({
//       success: true,
//       message: "Order delivered & dashboard updated"
//     });

//   } catch (error) {

//     console.error("DELIVERY ERROR:", error);

//     res.status(500).json({
//       message: "Server error",
//       error: error.message
//     });

//   }

// };
const mongoose = require("mongoose");
const Order = require("../models/OrderSchema");
const { emitRiderDashboard } = require("../sockets/socket");
const { getCurrentSlot } = require("../utils/slot.helper");

exports.markOrderDelivered = async (req, res) => {

  try {

    const id = req.params.id;

    let order;

    if (mongoose.Types.ObjectId.isValid(id)) {

      order = await Order.findById(id);

    } else {

      order = await Order.findOne({ orderId: id });

    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus === "DELIVERED") {
      return res.status(400).json({ message: "Already delivered" });
    }

    // ---------------- MARK DELIVERED ----------------
     
    order.orderStatus = "DELIVERED";
    await order.save();

    const riderId = order.riderId;

    // ---------------- DATE RANGE ----------------

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // ---------------- SLOT INFO ----------------

    const slot = getCurrentSlot();

    // ---------------- DAILY ORDER COUNT ----------------

    const dailyOrders = await Order.countDocuments({

      riderId,
      orderStatus: "DELIVERED",
      updatedAt: { $gte: startOfDay }

    });

    // ---------------- DAILY EARNINGS ----------------

    const earningsAgg = await Order.aggregate([

      {
        $match: {
          riderId,
          orderStatus: "DELIVERED",
          updatedAt: { $gte: startOfDay }
        }
      },

      {
        $group: {
          _id: null,
          total: { $sum: "$riderEarning.totalEarning" }
        }
      }

    ]);

    const dailyEarnings = earningsAgg[0]?.total || 0;

    // ---------------- SLOT COMPLETED ORDERS ----------------

    // Example: same day slot filter
    const slotOrders = await Order.countDocuments({

      riderId,
      orderStatus: "DELIVERED",
      updatedAt: { $gte: startOfDay },

    });

    // ---------------- SLOT TARGET LOGIC ----------------

    const remaining = Math.max(slot.target - slotOrders, 0);

    let slotMessage = "Keep going!";

    if (remaining === 0) {
      slotMessage = "🎉 Slot target achieved!";
    }
    else if (remaining <= 2) {
      slotMessage = `🔥 Almost there! Only ${remaining} orders left`;
    }

    // ---------------- EMIT WS DASHBOARD ----------------

    emitRiderDashboard(riderId.toString(), {

      type: "RIDER_PROGRESS_UPDATE",

      daily: {

        totalOrders: dailyOrders,

        totalEarnings: dailyEarnings

      },

      slot: {

        slotType: slot.slotName,

        completed: slotOrders,

        target: slot.target,

        remaining

      },

      message: slotMessage

    });

    // ---------------- API RESPONSE ----------------

    res.json({

      success: true,

      message: "Order delivered & rider progress updated"

    });

  } catch (error) {

    console.error("DELIVERY ERROR:", error);

    res.status(500).json({

      message: "Server error",

      error: error.message

    });

  }

};
