const Order = require("../models/OrderSchema");
const crypto = require("crypto");
const {notifyRider} = require("../webSocket");
const Rider=require('../models/RiderModel')
const axios = require("axios");
const PricingConfig=require("../models/pricingConfigSchema")
const mongoose=require('mongoose')
const { getLatLng } = require("../services/geocodeService");
const Incentive = require("../models/IncentiveSchema");
const RiderIncentiveProgress = require("../models/RiderIncentiveProgressSchema");
const prisma=require('../config/prisma');

// 👉 Dummy transaction generator
function generateTxn() {
  return "TXN_" + crypto.randomBytes(6).toString("hex");
}
function generateOrderId(){

      return "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}


async function createOrder(req, res) {

  try {

    const body = req.body;

    //////////////////////////////////////////////////////
    // 1️⃣ GET LAT LNG
    //////////////////////////////////////////////////////

    const pickupGeo = await getLatLng(
      body.pickupAddress.addressLine
    );

    const deliveryGeo = await getLatLng(
      body.deliveryAddress.addressLine
    );

    //////////////////////////////////////////////////////
    // 2️⃣ PAYMENT LOGIC
    //////////////////////////////////////////////////////

    let paymentData = {
      mode: body.payment.mode,
      status: "PENDING"
    };

    if (body.payment.mode === "ONLINE") {

      paymentData.transactionId = generateTxn();
      paymentData.status = "SUCCESS";

    }

    if (body.payment.mode === "COD") {

      paymentData.codPaymentType =
        body.payment.codPaymentType || "CASH";

    }

    //////////////////////////////////////////////////////
    // 3️⃣ CALCULATE ITEM TOTAL
    //////////////////////////////////////////////////////

    let itemTotal = body.items.reduce(
      (sum, i) => sum + i.total,
      0
    );

    const deliveryFee = 40;
    const tax = 5;
    const platformCommission = 10;

    const totalAmount =
      itemTotal + deliveryFee + tax;

    //////////////////////////////////////////////////////
    // 4️⃣ CREATE ORDER (PRISMA)
    //////////////////////////////////////////////////////


    const order = await prisma.order.create({

  data: {

    orderId: generateOrderId(),

    vendorShopName: body.vendorShopName,

    //////////////////////////////////////////////////
    // ITEMS
    //////////////////////////////////////////////////

    OrderItems: {
      create: body.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
    },

    //////////////////////////////////////////////////
    // PICKUP ADDRESS
    //////////////////////////////////////////////////

    OrderPickupAddress: {
      create: {
        name: body.pickupAddress.name,
        addressLine: body.pickupAddress.addressLine,
        contactNumber: body.pickupAddress.contactNumber,
        latitude: pickupGeo.lat,
        longitude: pickupGeo.lng
      }
    },

    //////////////////////////////////////////////////
    // DELIVERY ADDRESS
    //////////////////////////////////////////////////

    OrderDeliveryAddress: {
      create: {
        name: body.deliveryAddress.name,
        addressLine: body.deliveryAddress.addressLine,
        contactNumber: body.deliveryAddress.contactNumber,
        latitude: deliveryGeo.lat,
        longitude: deliveryGeo.lng
      }
    },

    //////////////////////////////////////////////////
    // PRICING
    //////////////////////////////////////////////////

    OrderPricing: {
      create: {
        itemTotal,
        deliveryFee,
        tax,
        platformCommission,
        totalAmount
      }
    },

    //////////////////////////////////////////////////
    // PAYMENT
    //////////////////////////////////////////////////

    OrderPayment: {
      create: paymentData
    },

    //////////////////////////////////////////////////
    // COD (ONLY IF COD)
    //////////////////////////////////////////////////

    OrderCod:
      body.payment.mode === "COD"
        ? {
            create: {
              amount: totalAmount,
              pendingAmount: totalAmount
            }
          }
        : undefined

  },

  include: {
    OrderPayment: true
  }

});

    //////////////////////////////////////////////////////
    // 5️⃣ RESPONSE (same Swagger)
    //////////////////////////////////////////////////////

    return res.status(201).json({

      success: true,

      message: "Order created successfully",

      orderId: order.orderId,

      payment: order.payment

    });

  }
  catch (err) {

    console.error(err);

    return res.status(500).json({

      success: false,

      message: err.message

    });

  }

}





 
/* ===============================

   GOOGLE DISTANCE + ETA HELPER

================================ */

async function getRouteInfo(pickupAddress, deliveryAddress) {
  if (!pickupAddress || !deliveryAddress) {
    throw new Error("Pickup or Delivery address missing");
  }

  const pickupLat = pickupAddress.latitude;
  const pickupLng = pickupAddress.longitude;

  const dropLat = deliveryAddress.latitude;
  const dropLng = deliveryAddress.longitude;

  if (
    pickupLat == null || pickupLng == null ||
    dropLat == null || dropLng == null
  ) {
    throw new Error("Invalid pickup/delivery coordinates");
  }

  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/directions/json",
    {
      params: {
        origin: `${pickupLat},${pickupLng}`,
        destination: `${dropLat},${dropLng}`,
        key: process.env.GOOGLE_KEY
      }
    }
  );

  if (!response.data.routes?.length) {
    throw new Error("No route found between pickup and drop");
  }

  const leg = response.data.routes[0].legs[0];

  return {
    distanceKm: Number((leg.distance.value / 1000).toFixed(2)),
    etaMinutes: Math.ceil(leg.duration.value / 60)
  };
}













/* ===============================

   CONFIRM ORDER API

================================ */



// async function confirmOrder(req, res) {
//   try {
//     const { orderId } = req.params;

//     //////////////////////////////////////////////////////
//     // 1️⃣ FETCH ORDER
//     //////////////////////////////////////////////////////

//     const order = await prisma.order.findFirst({
//       where: { orderId },
//       include: {
//         OrderPickupAddress: true,
//         OrderDeliveryAddress: true
//       }
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found"
//       });
//     }

//     if (order.orderStatus !== "CREATED") {
//       return res.status(400).json({
//         success: false,
//         message: "Order already processed"
//       });
//     }

//     //////////////////////////////////////////////////////
//     // 2️⃣ FETCH ELIGIBLE RIDERS
//     //////////////////////////////////////////////////////

//     const now = new Date();

//     const riders = await prisma.rider.findMany({
//       where: {
//         orderState: "READY",
//         isOnline: true,
//         slotBookings: {
//           some: {
//             status: "BOOKED",
//             slotEndAt: { gte: now }
//           }
//         }
//       },
//       take: 10,
//       select: { id: true }
//     });

//     if (!riders.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No riders available"
//       });
//     }

//     //////////////////////////////////////////////////////
//     // 3️⃣ UPDATE ORDER STATUS
//     //////////////////////////////////////////////////////

//     await prisma.order.update({
//       where: { orderId:orderId },
//       data: { orderStatus: "CONFIRMED" }
//     });

//     //////////////////////////////////////////////////////
//     // 4️⃣ CREATE ORDER ALLOCATION
//     //////////////////////////////////////////////////////

//     const allocation = await prisma.orderAllocation.create({
//       data: {
//         orderId: order.orderId,
//         expiresAt: new Date(Date.now() + 120 * 1000),
//         OrderCandidateRiders: {
//           create: riders.map(r => ({
//             riderId: r.id,
//             status: "PENDING",
//             notifiedAt: new Date()
//           }))
//         }
//       }
//     });
// console.log(allocation)
//     //////////////////////////////////////////////////////
//     // 5️⃣ DISTANCE + ETA
//     //////////////////////////////////////////////////////

//     const routeInfo = await getRouteInfo(
//       order.OrderPickupAddress,
//       order.OrderDeliveryAddress
//     );

//     //////////////////////////////////////////////////////
//     // 6️⃣ RIDER EARNING CALCULATION (simplified)
//     //////////////////////////////////////////////////////

//     const basePay = 40;
//     const distancePay = routeInfo.distanceKm * 5;
//     const surgePay = 0;

//     const totalEarning = basePay + distancePay + surgePay;

//     //////////////////////////////////////////////////////
//     // 7️⃣ SAVE RIDER EARNING SNAPSHOT
//     //////////////////////////////////////////////////////

//     await prisma.orderRiderEarning.create({
//       data: {
//         orderId: order.orderId,
//         basePay,
//         distancePay,
//         surgePay,
//         totalEarning,
//         credited: false
//       }
//     });

//     console.log(
//        "Riders getting popup:",
//        riders.map(r => r.id.toString())
//      );
//     //////////////////////////////////////////////////////
//     // 8️⃣ SAVE TRACKING SNAPSHOT
//     //////////////////////////////////////////////////////

//     await prisma.orderTracking.create({
//       data: {
//         orderId: order.orderId,
//         distanceInKm: routeInfo.distanceKm,
//         durationInMin: routeInfo.etaMinutes
//       }
//     });

//     //////////////////////////////////////////////////////
//     // 9️⃣ NOTIFY RIDERS (WebSocket)
//     //////////////////////////////////////////////////////

//     riders.forEach(rider => {
//     console.log(
//        "Riders getting popup:",
//        riders.map(r => r.id.toString())
//      );
//       notifyRider(rider.id, {
//         type: "ORDER_POPUP",
//         orderId: order.orderId,
//         vendorShopName: order.vendorShopName,
//         pickupLocation: order.OrderPickupAddress,
//         dropLocation: order.OrderDeliveryAddress,
//         distanceKm: routeInfo.distanceKm,
//         etaMinutes: routeInfo.etaMinutes,
//         estimatedEarning: totalEarning
//       });
//     });

//     //////////////////////////////////////////////////////
//     // 🔟 RESPONSE
//     //////////////////////////////////////////////////////

//     return res.status(200).json({
//       success: true,
//       message: "Order confirmed and sent to riders",
//       estimatedEarning: totalEarning,
//       notifiedRiders: riders.length
//     });

//   } catch (err) {
//     console.error("Confirm order error:", err);
//     return res.status(500).json({
//       success: false,
//       message: err.message || "Failed to confirm order"
//     });
//   }
// }
async function confirmOrder(req, res) {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { orderId },
      include: {
        OrderPickupAddress: true,
        OrderDeliveryAddress: true
      }
    });

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.orderStatus !== "CREATED")
      return res.status(400).json({ success: false, message: "Order already processed" });

    const now = new Date();

    const riders = await prisma.rider.findMany({
      where: {
        orderState: "READY",
        isOnline: true,
        slotBookings: {
          some: {
            status: "BOOKED",
            slotEndAt: { gte: now }
          }
        }
      },
      take: 10,
      select: { id: true }
    });

    if (!riders.length)
      return res.status(400).json({ success: false, message: "No riders available" });

    const routeInfo = await getRouteInfo(
      order.OrderPickupAddress,
      order.OrderDeliveryAddress
    );

    const basePay = 40;
    const distancePay = routeInfo.distanceKm * 5;
    const surgePay = 0;
    const totalEarning = basePay + distancePay + surgePay;

    await prisma.$transaction(async (tx) => {

      // ✅ Update order
      await tx.order.update({
        where: { id: order.id },   // use UUID
        data: { orderStatus: "CONFIRMED" }
      });

      // ✅ Create allocation
      await tx.orderAllocation.create({
        data: {
          orderId: order.orderId,   // use UUID
          expiresAt: new Date(Date.now() + 120000),
          OrderCandidateRiders: {
            create: riders.map(r => ({
              riderId: r.id,
              status: "PENDING",
              notifiedAt: new Date()
            }))
          }
        }
      });

      // ✅ Create earning snapshot
      await tx.orderRiderEarning.create({
        data: {
          orderId: order.orderId,
          basePay,
          distancePay,
          surgePay,
          totalEarning,
          credited: false
        }
      });

      // ✅ Create tracking snapshot
      await tx.orderTracking.create({
        data: {
          orderId: order.orderId,
          distanceInKm: routeInfo.distanceKm,
          durationInMin: routeInfo.etaMinutes
        }
      });

    });

    // Notify AFTER transaction commits
    riders.forEach(rider => {
      notifyRider(rider.id, {
        type: "ORDER_POPUP",
        orderId: order.orderId, // send formatted ID to frontend
        vendorShopName: order.vendorShopName,
        pickupLocation: order.OrderPickupAddress,
        dropLocation: order.OrderDeliveryAddress,
        distanceKm: routeInfo.distanceKm,
        etaMinutes: routeInfo.etaMinutes,
        estimatedEarning: totalEarning
      });
    });

    return res.status(200).json({
      success: true,
      message: "Order confirmed and sent to riders",
      estimatedEarning: totalEarning,
      notifiedRiders: riders.length
    });

  } catch (err) {
    console.error("Confirm order error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to confirm order"
    });
  }
}
// async function acceptOrder(req, res) {
//   try {
//     const { orderId } = req.params;
//     const riderId = req.rider.id;

//     // 1️⃣ Find order with allocation
//     const order = await prisma.order.findUnique({
//       where: { orderId },
//       include: {
//         OrderAllocation: true
//       }
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found"
//       });
//     }
//     console.log("Allocation:", order.OrderAllocation);
//     if (!order.OrderAllocation) {
//       return res.status(400).json({
//         success: false,
//         message: "Order not allocated"
//       });
//     }

//     if (order.orderStatus !== "CONFIRMED") {
//       return res.status(400).json({
//         success: false,
//         message: "Order not available"
//       });
//     }

//     await prisma.$transaction(async (tx) => {

//       // Assign order
//       await tx.order.update({
//         where: { id: order.id },
//         data: {
//           riderId: riderId,
//           orderStatus: "ASSIGNED"
//         }
//       });

//       // Accept this rider
//       await tx.orderCandidateRider.updateMany({
//         where: {
//           allocationId: order.OrderAllocation.id,
//           riderId: riderId,
//           status: "PENDING"
//         },
//         data: {
//           status: "ACCEPTED"
//         }
//       });

//       // Reject others
//       await tx.orderCandidateRider.updateMany({
//         where: {
//           allocationId: order.OrderAllocation.id,
//           riderId: { not: riderId },
//           status: "PENDING"
//         },
//         data: {
//           status: "REJECTED"
//         }
//       });

//       // Mark allocation assigned time
//       await tx.orderAllocation.update({
//         where: { id: order.OrderAllocation.id },
//         data: {
//           assignedAt: new Date()
//         }
//       });

//       // Make rider busy
//       await tx.rider.update({
//         where: { id: riderId },
//         data: {
//           orderState: "BUSY",
//           currentOrderId: order.id
//         }
//       });

//     });

//     return res.json({
//       success: true,
//       message: "Order accepted successfully"
//     });

//   } catch (err) {
//     console.error("Accept order error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to accept order"
//     });
//   }
// }
async function acceptOrder(req, res) {
  try {
    const { orderId } = req.params;
    const riderId = req.rider.id;

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { OrderAllocation: true }
    });

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (!order.OrderAllocation)
      return res.status(400).json({ success: false, message: "Order not allocated" });

    await prisma.$transaction(async (tx) => {

      // ✅ ATOMIC STATUS UPDATE (prevents race condition)
      const updated = await tx.order.updateMany({
        where: {
          orderId:orderId,
          orderStatus: "CONFIRMED"
        },
        data: {
          riderId: riderId,
          orderStatus: "ASSIGNED"
        }
      });

      if (updated.count === 0) {
        throw new Error("Order already accepted");
      }

      // Accept this rider
      await tx.orderCandidateRider.updateMany({
        where: {
          allocationId: order.OrderAllocation.id,
          riderId: riderId,
          status: "PENDING"
        },
        data: { status: "ACCEPTED" }
      });

      // Reject others
      await tx.orderCandidateRider.updateMany({
        where: {
          allocationId: order.OrderAllocation.id,
          riderId: { not: riderId },
          status: "PENDING"
        },
        data: { status: "REJECTED" }
      });

      // Mark allocation assigned
      await tx.orderAllocation.update({
        where: { id: order.OrderAllocation.id },
        data: { assignedAt: new Date() }
      });

      // Make rider busy
      await tx.rider.update({
        where: { id: riderId },
        data: {
          orderState: "BUSY",
          currentOrderId: order.id
        }
      });

    });

    return res.json({
      success: true,
      message: "Order accepted successfully"
    });

  } catch (err) {
    console.error("Accept order error:", err);

    return res.status(400).json({
      success: false,
      message: err.message || "Failed to accept order"
    });
  }
}
 

async function rejectOrder(req, res) {
  try {
    const { orderId } = req.params;
    const riderId = req.rider.id;

    // 1️⃣ Find order with allocation
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        OrderAllocation: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!order.OrderAllocation) {
      return res.status(400).json({
        success: false,
        message: "Order not allocated"
      });
    }

    // 2️⃣ Reject rider inside allocation
    const result = await prisma.orderCandidateRider.updateMany({
      where: {
        allocationId: order.OrderAllocation.id,
        riderId: riderId,
        status: "PENDING"
      },
      data: {
        status: "REJECTED"
      }
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Order already handled or not assigned to this rider"
      });
    }

    return res.json({
      success: true,
      message: "Order rejected successfully"
    });

  } catch (err) {
    console.error("Reject order error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reject order"
    });
  }
}


async function getOrderDetails(req, res) {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { orderId },
      include: {
        OrderItems: true,
        OrderPickupAddress: true,
        OrderDeliveryAddress: true,
        OrderPricing: true,
        OrderRiderEarning: {
          include: {
            OrderSurges: true
          }
        },
        OrderPayment: true,
        OrderAllocation: {
          include: {
            OrderCandidateRiders: true
          }
        },
        OrderSettlement: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    
    const formattedOrder = {
      _id: order.id, 
      orderId: order.orderId,
      vendorShopName: order.vendorShopName,
      orderStatus: order.orderStatus,

      items: order.OrderItems.map(item => ({
        _id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),

      pickupAddress: order.OrderPickupAddress
        ? {
            name: order.OrderPickupAddress.name,
            addressLine: order.OrderPickupAddress.addressLine,
            contactNumber: order.OrderPickupAddress.contactNumber,
            lat: order.OrderPickupAddress.latitude,
            lng: order.OrderPickupAddress.longitude
          }
        : null,

      deliveryAddress: order.OrderDeliveryAddress
        ? {
            name: order.OrderDeliveryAddress.name,
            addressLine: order.OrderDeliveryAddress.addressLine,
            contactNumber: order.OrderDeliveryAddress.contactNumber,
            lat: order.OrderDeliveryAddress.latitude,
            lng: order.OrderDeliveryAddress.longitude
          }
        : null,

      pricing: order.OrderPricing
        ? {
            itemTotal: order.OrderPricing.itemTotal,
            deliveryFee: order.OrderPricing.deliveryFee,
            tax: order.OrderPricing.tax,
            platformCommission: order.OrderPricing.platformCommission,
            totalAmount: order.OrderPricing.totalAmount
          }
        : null,

      riderEarning: order.OrderRiderEarning
        ? {
            basePay: order.OrderRiderEarning.basePay,
            distancePay: order.OrderRiderEarning.distancePay,
            surgePay: order.OrderRiderEarning.surgePay,
            tips: order.OrderRiderEarning.tips,
            totalEarning: order.OrderRiderEarning.totalEarning,
            credited: order.OrderRiderEarning.credited
          }
        : null,

      payment: order.OrderPayment
        ? {
            mode: order.OrderPayment.mode,
            status: order.OrderPayment.status
          }
        : null,

      allocation: order.OrderAllocation
        ? {
            expiresAt: order.OrderAllocation.expiresAt,
            candidateRiders:
              order.OrderAllocation.OrderCandidateRiders.map(r => ({
                _id: r.id,
                riderId: r.riderId,
                status: r.status,
                notifiedAt: r.notifiedAt
              }))
          }
        : null,

      settlement: order.OrderSettlement
        ? {
            riderEarningAdded: order.OrderSettlement.riderEarningAdded,
            vendorSettled: order.OrderSettlement.vendorSettled
          }
        : null,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      riderId: order.riderId
    };

    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      orderStatus: order.orderStatus,
      order: formattedOrder
    });

  } catch (err) {
    console.error("Get order details error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details"
    });
  }
}


async function pickupOrder(req, res) {
  try {
    const { orderId } = req.params;
    const riderId  = req.rider.id;

    const order = await prisma.Order.findUnique({
      where: { orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

 
    if (order.orderStatus !== "ASSIGNED") {
      return res.status(400).json({
        success: false,
        message: "Order is not ready for pickup"
      });
    }


    if (!order.riderId || order.riderId !== riderId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order"
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { orderId },
        data: {
          orderStatus: "PICKED_UP"
        }
      });

      await tx.orderTracking.updateMany({
        where: { orderId: order.id },
        data: {
          durationInMin: null
        }
      });
    });

    notifyRider(riderId.toString(), {
      type: "ORDER_PICKED_UP",
      orderId: order.orderId
    });

    return res.status(200).json({
      success: true,
      message: "Order picked up successfully",
      orderStatus: "PICKED_UP"
    });

  } catch (err) {
    console.error("Pickup order error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to pickup order"
    });
  }
}

/* ===============================

   HELPER FUNCTIONS

=============================== */

const getDateKey = (date = new Date()) =>

  date.toISOString().split("T")[0]; // YYYY-MM-DD
 
const getWeekKey = (date = new Date()) => {

  const d = new Date(date);

  const year = d.getFullYear();

  const week = Math.ceil(

    ((d - new Date(year, 0, 1)) / 86400000 +

      new Date(year, 0, 1).getDay() +

      1) / 7

  );

  return `${year}-W${week}`;

};
 
const isPeakSlot = (date) => {

  const hour = new Date(date).getHours();

  return hour >= 6 && hour < 10; // example peak slot

};
 
/* ===============================

   DELIVER ORDER API

=============================== */

// async function deliverOrder(req, res) {
//   try {
//     const { orderId } = req.params;
//     const riderId = req.rider?.id;

//     if (!riderId) {
//       return res.status(400).json({
//         success: false,
//         message: "riderId required"
//       });
//     }

//     /* 1️⃣ FETCH ORDER */
//     const order = await prisma.order.findUnique({
//       where: { orderId }
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found"
//       });
//     }

//     /* 2️⃣ VALIDATE STATUS */
//     if (order.orderStatus !== "PICKED_UP") {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid status: ${order.orderStatus}`
//       });
//     }

//     /* 3️⃣ VALIDATE RIDER */
//     if (order.riderId !== riderId) {
//       return res.status(403).json({
//         success: false,
//         message: "Not assigned to this order"
//       });
//     }

//     let earning = 0;
//     let codCollected = 0;

//     /* =========================
//        TRANSACTION
//     ========================= */
//     await prisma.$transaction(async (tx) => {

//       const rider = await tx.rider.findUnique({
//         where: { id: riderId }
//       });

//       if (!rider) {
//         throw new Error("Rider not found");
//       }

//       /* 4️⃣ CREDIT RIDER EARNING */
//       if (!order.riderEarningCredited) {

//         earning = Number(order.riderEarningTotal || 0);

//         await tx.rider.update({
//           where: { id: riderId },
//           data: {
//             walletBalance: { increment: earning },
//             walletTotalEarned: { increment: earning }
//           }
//         });

//         await tx.order.update({
//           where: { id: order.id },
//           data: {
//             riderEarningCredited: true,
//             riderEarningCreditedAt: new Date(),
//             riderEarningAdded: true
//           }
//         });
//       }

//       /* 5️⃣ HANDLE COD */
//       if (order.paymentMode === "COD") {

//         codCollected = Number(order.totalAmount || 0);

//         if (rider.cashInHandBalance + codCollected > rider.cashInHandLimit) {

//           await tx.rider.update({
//             where: { id: riderId },
//             data: {
//               deliveryActive: false,
//               inactiveReason: "COD_LIMIT_EXCEEDED"
//             }
//           });

//           throw new Error("COD limit exceeded");
//         }

//         await tx.rider.update({
//           where: { id: riderId },
//           data: {
//             cashInHandBalance: { increment: codCollected },
//             cashInHandUpdatedAt: new Date()
//           }
//         });
//       }

//       /* 6️⃣ UPDATE ORDER */
//       await tx.order.update({
//         where: { id: order.id },
//         data: {
//           orderStatus: "DELIVERED",
//           paymentStatus: "SUCCESS",
//           deliveredAt: new Date()
//         }
//       });

//       /* 7️⃣ RESET RIDER STATE */
//       await tx.rider.update({
//         where: { id: riderId },
//         data: {
//           orderState: "READY",
//           currentOrderId: null
//         }
//       });

//       /* ===============================
//          8️⃣ INCENTIVE UPDATE
//       =============================== */

//       const incentives = await tx.incentive.findMany({
//         where: { status: "ACTIVE" }
//       });

//       const dateKey = getDateKey();
//       const weekKey = getWeekKey();
//       const peak = isPeakSlot(new Date());

//       for (const incentive of incentives) {

//         /* PEAK SLOT */
//         if (incentive.incentiveType === "PEAK_SLOT" && peak) {

//           const progress = await tx.riderIncentiveProgress.upsert({
//             where: {
//               riderId_incentiveId_date: {
//                 riderId,
//                 incentiveId: incentive.id,
//                 date: dateKey
//               }
//             },
//             update: {
//               totalOrders: { increment: 1 },
//               peakOrders: { increment: 1 }
//             },
//             create: {
//               riderId,
//               incentiveId: incentive.id,
//               date: dateKey,
//               incentiveType: incentive.incentiveType,
//               totalOrders: 1,
//               peakOrders: 1
//             }
//           });

//           const peakSlabs = incentive.slabs?.[0]?.peak || [];

//           const slab = peakSlabs.find(s =>
//             progress.peakOrders >= s.minOrders &&
//             progress.peakOrders <= s.maxOrders
//           );

//           if (slab) {
//             await tx.riderIncentiveProgress.update({
//               where: { id: progress.id },
//               data: {
//                 eligible: true,
//                 achievedReward: slab.rewardAmount
//               }
//             });
//           }
//         }

//         /* DAILY TARGET */
//         if (incentive.incentiveType === "DAILY_TARGET") {

//           const progress = await tx.riderIncentiveProgress.upsert({
//             where: {
//               riderId_incentiveId_date: {
//                 riderId,
//                 incentiveId: incentive.id,
//                 date: dateKey
//               }
//             },
//             update: {
//               totalOrders: { increment: 1 },
//               peakOrders: { increment: peak ? 1 : 0 },
//               normalOrders: { increment: peak ? 0 : 1 }
//             },
//             create: {
//               riderId,
//               incentiveId: incentive.id,
//               date: dateKey,
//               incentiveType: incentive.incentiveType,
//               totalOrders: 1,
//               peakOrders: peak ? 1 : 0,
//               normalOrders: peak ? 0 : 1
//             }
//           });

//           if (
//             progress.peakOrders >= incentive.minPeakSlots &&
//             progress.normalOrders >= incentive.minNormalSlots
//           ) {
//             await tx.riderIncentiveProgress.update({
//               where: { id: progress.id },
//               data: { eligible: true }
//             });
//           }
//         }

//         /* WEEKLY TARGET */
//         if (incentive.incentiveType === "WEEKLY_TARGET") {

//           const progress = await tx.riderIncentiveProgress.upsert({
//             where: {
//               riderId_incentiveId_week: {
//                 riderId,
//                 incentiveId: incentive.id,
//                 week: weekKey
//               }
//             },
//             update: {},
//             create: {
//               riderId,
//               incentiveId: incentive.id,
//               week: weekKey,
//               incentiveType: incentive.incentiveType,
//               dailyOrders: {}
//             }
//           });

//           let dailyOrders = progress.dailyOrders || {};
//           const todayCount = dailyOrders[dateKey] || 0;
//           dailyOrders[dateKey] = todayCount + 1;

//           let eligibleDays = progress.eligibleDays || 0;

//           if (todayCount + 1 >= incentive.minOrdersPerDay) {
//             eligibleDays += 1;
//           }

//           let eligible = false;
//           let achievedReward = null;

//           if (eligibleDays >= incentive.totalDaysInWeek) {
//             eligible = true;
//             achievedReward = incentive.maxRewardPerWeek;
//           }

//           await tx.riderIncentiveProgress.update({
//             where: { id: progress.id },
//             data: {
//               dailyOrders,
//               eligibleDays,
//               eligible,
//               achievedReward
//             }
//           });
//         }
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Order delivered successfully",
//       orderId,
//       earningCredited: earning,
//       codCollected
//     });

//   } catch (err) {

//     console.error("Deliver order error:", err);

//     return res.status(500).json({
//       success: false,
//       message: err.message || "Failed to deliver order"
//     });
//   }
// }

async function deliverOrder(req, res) {
  try {
    const { orderId } = req.params;
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "riderId required",
      });
    }

    // 🔹 Fetch order outside transaction
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        OrderRiderEarning: true,
        OrderPayment: true,
        OrderPricing: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus !== "PICKED_UP") {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${order.orderStatus}`,
      });
    }

    if (order.riderId !== riderId) {
      return res.status(403).json({
        success: false,
        message: "Not assigned to this order",
      });
    }

    // 🚨 IMPORTANT: Ensure payment record exists BEFORE transaction
    if (!order.OrderPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment record not found for this order",
      });
    }

    const earning = Number(order.OrderRiderEarning?.totalEarning || 0);
    let codCollected = 0;

    await prisma.$transaction(
      async (tx) => {

        // ✅ Ensure wallet exists
        await tx.riderWallet.upsert({
          where: { riderId },
          update: {},
          create: { riderId },
        });

        // ✅ Credit earning safely
        if (!order.OrderRiderEarning?.credited && earning > 0) {
          await tx.riderWallet.update({
            where: { riderId },
            data: {
              balance: { increment: earning },
              totalEarned: { increment: earning },
            },
          });

          await tx.orderRiderEarning.update({
            where: { orderId },
            data: {
              credited: true,
              creditedAt: new Date(),
            },
          });

          await tx.orderSettlement.upsert({
            where: { orderId },
            update: { riderEarningAdded: true },
            create: {
              orderId,
              riderEarningAdded: true,
            },
          });
        }

        // ✅ Handle COD
        if (order.OrderPayment.mode === "COD") {
          codCollected = Number(order.OrderPricing?.totalAmount || 0);

          const cash = await tx.riderCashInHand.upsert({
            where: { riderId },
            update: {},
            create: { riderId },
          });

          if (cash.balance + codCollected > cash.limit) {
            throw "COD_LIMIT_EXCEEDED";
          }

          await tx.riderCashInHand.update({
            where: { riderId },
            data: {
              balance: { increment: codCollected },
              lastUpdatedAt: new Date(),
            },
          });
        }

        // ✅ Update order
        await tx.order.update({
          where: { orderId },
          data: { orderStatus: "DELIVERED" },
        });

        // ✅ SAFER: use updateMany instead of update
        await tx.orderPayment.updateMany({
          where: { orderId },
          data: { status: "SUCCESS" },
        });

        // ✅ Reset rider state
        await tx.rider.update({
          where: { id: riderId },
          data: {
            orderState: "READY",
            currentOrderId: null,
          },
        });
      },
      { timeout: 10000 }
    );

    return res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      orderId,
      earningCredited: earning,
      codCollected,
    });

  } catch (err) {

    if (err === "COD_LIMIT_EXCEEDED") {
      return res.status(400).json({
        success: false,
        message: "COD limit exceeded",
      });
    }

    console.error("Deliver order error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to deliver order",
    });
  }
}
 

 
async function cancelOrder(req, res) {
  try {
    const { orderId } = req.params;
    const riderId = req.rider.id;
    const { reasonCode, reasonText } = req.body;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "riderId is required"
      });
    }

    /* ===============================
       1️⃣ FETCH ORDER
    =============================== */
    const order = await prisma.order.findUnique({
      where: { orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    /* ===============================
       2️⃣ VALIDATE STATE
    =============================== */
    if (["DELIVERED", "CANCELLED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled"
      });
    }

    if (!order.riderId) {
      return res.status(400).json({
        success: false,
        message: "Order has no assigned rider"
      });
    }

    /* ===============================
       3️⃣ VALIDATE RIDER ASSIGNMENT
    =============================== */


    if (order.riderId !== riderId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order"
      });
    }

   const result = await prisma.$transaction(async (tx) => {
  const updatedOrder = await tx.order.update({
    where: { orderId },
    data: { orderStatus: "CANCELLED" }
  });

  await tx.rider.updateMany({
    where: {
      id: riderId,
      currentOrderId: order.id
    },
    data: {
      orderState: "READY",
      currentOrderId: null
    }
  });

  await tx.orderCancelIssue.upsert({
    where: { orderId: order.id }, // ✅ FIX
    update: {
      cancelledBy: "RIDER",
      reasonCode,
      reasonText
    },
    create: {
      orderId: order.id, // ✅ FIX
      cancelledBy: "RIDER",
      reasonCode,
      reasonText
    }
  });

  return updatedOrder;
});


    /* ===============================
       6️⃣ WS NOTIFICATION
    =============================== */
    notifyRider(riderId, {
      type: "ORDER_CANCELLED",
      orderId,
      reason: reasonCode
    });

    /* ===============================
       7️⃣ RESPONSE
    =============================== */
    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      orderStatus: result.orderStatus,

      cancelIssue: {
        cancelledBy: "RIDER",
        reasonCode,
        reasonText
      }
    });

  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to cancel order"
    });
  }
}





async function getOrdersByRider(req, res) {
  try {
    const riderId  = req.rider._id;

    const riderObjectId = new mongoose.Types.ObjectId(riderId);

    const orders = await Order.aggregate([
      {
        $match: {
          $or: [
            { riderId: riderObjectId },
            { "allocation.candidateRiders.riderId": riderObjectId }
          ]
        }
      },

      // Extract this rider's candidate object
      {
        $addFields: {
          riderCandidate: {
            $first: {
              $filter: {
                input: "$allocation.candidateRiders",
                as: "cr",
                cond: { $eq: ["$$cr.riderId", riderObjectId] }
              }
            }
          }
        }
      },

      // Decide rider relation with order
      {
        $addFields: {
          riderRelation: {
            $cond: [
              { $eq: ["$riderId", riderObjectId] },
              "ACCEPTED",
              {
                $cond: [
                  { $eq: ["$riderCandidate.status", "REJECTED"] },
                  "REJECTED",
                  {
                    $cond: [
                      { $eq: ["$riderCandidate.status", "TIMEOUT"] },
                      "TIMEOUT",
                      "NOTIFIED"
                    ]
                  }
                ]
              }
            ]
          }
        }
      },

      // Sorting latest first
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      riderId,
      totalOrders: orders.length,
      orders
    });

  } catch (err) {
    console.error("Full rider order activity error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rider order activity"
    });
  }
}


async function getDeliveredOrdersByRider(req, res) {
  try {
    const  riderId  = req.rider._id;

    const orders = await Order.find({
      riderId,
      orderStatus: "DELIVERED"
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      riderId,
      totalDeliveredOrders: orders.length,
      orders
    });

  } catch (err) {
    console.error("Delivered orders error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivered orders"
    });
  }
}



async function getCancelledOrdersByRider(req, res) {
  try {
    const riderId = req.rider._id;

    const orders = await Order.find({
      riderId,
      orderStatus: "CANCELLED"
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      riderId,
      totalCancelledOrders: orders.length,
      orders
    });

  } catch (err) {
    console.error("Cancelled orders error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cancelled orders"
    });
  }
}

 

 

 
 
 
module.exports = { createOrder,confirmOrder,acceptOrder,rejectOrder,getOrderDetails,pickupOrder,deliverOrder, cancelOrder,getOrdersByRider,getDeliveredOrdersByRider,getCancelledOrdersByRider};
 
 