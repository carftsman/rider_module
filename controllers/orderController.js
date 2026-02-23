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


// async function createOrder(req, res) {
//   try {
//     const {
//       vendorShopName,
//       items,
//       pickupAddress,
//       deliveryAddress,
//       payment
//     } = req.body;
 
//     if (!vendorShopName) {
//       return res.status(400).json({
//         success: false,
//         message: "vendorShopName is required"
//       });
//     }
 
//     if (!items || !items.length) {
//       return res.status(400).json({
//         success: false,
//         message: "Items are required"
//       });
//     }
 
//     // 🔹 Calculate item totals ONLY
//     let itemTotal = 0;
//     const formattedItems = items.map(item => {
//       const total = item.quantity * item.price;
//       itemTotal += total;
//       return {
//         itemName: item.itemName,
//         quantity: item.quantity,
//         price: item.price,
//         total
//       };
//     });
 
//     // 🔹 Generate Order ID
//     const orderId =
//       "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
 
//     // 🔹 Create Order (NO dynamic data)
//     const order = await Order.create({
//   orderId,
//   vendorShopName,
//   items: formattedItems,

//   pickupAddress: {
//     name: pickupAddress.name,
//     addressLine: pickupAddress.addressLine,
//     contactNumber: pickupAddress.contactNumber,
//     location: {
//       type: "Point",
//       coordinates: [pickupAddress.lng, pickupAddress.lat]
//     }
//   },

//   deliveryAddress: {
//     name: deliveryAddress.name,
//     addressLine: deliveryAddress.addressLine,
//     contactNumber: deliveryAddress.contactNumber,
//     location: {
//       type: "Point",
//       coordinates: [deliveryAddress.lng, deliveryAddress.lat]
//     }
//   },

//   pricing: {
//     itemTotal,
//     deliveryFee: 0,
//     tax: 0,
//     platformCommission: 0,
//     totalAmount: itemTotal
//   },

//   riderEarning: {
//     basePay: 0,
//     distancePay: 0,
//     surgePay: 0,
//     tips: 0,
//     totalEarning: 0,
//     credited: false
//   },

//   payment: {
//     mode: payment.mode,
//     status: payment.mode === "COD" ? "PENDING" : "SUCCESS"
//   },

//   orderStatus: "CREATED"
// });

 
//     return res.status(201).json({
//       success: true,
//       orderId: order.orderId,
//       mongoId: order._id
//     });
 
//   } catch (error) {
//     console.error("Create order error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Order creation failed"
//     });
//   }
// }
 
 
// async function confirmOrder(req, res) {
//   try {
//     const { orderId } = req.params;
 
//     // 1️⃣ Find order
//     const order = await Order.findOne({ orderId });
 
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
 
//     // 2️⃣ Fetch 5 eligible riders
//     const riders = await Rider.find({
//       "deliveryStatus.isActive": true,
//       orderState: "READY",
//       "riderStatus.isOnline": true
//     })
//       .limit(5)
//       .select("_id");
 
//     if (!riders.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No riders available"
//       });
//     }
 
//     // 3️⃣ Update order
//     order.orderStatus = "CONFIRMED";
//     order.allocation = {
//       candidateRiders: riders.map(r => ({
//         riderId: r._id,
//         status: "PENDING",
//         notifiedAt: new Date()
//       })),
//       expiresAt: new Date(Date.now() + 30 * 1000) // 30 sec window
//     };
 
//     await order.save();
 
//     // 4️⃣ Notify riders via WebSocket
//     riders.forEach(rider => {
//       notifyRider(rider._id.toString(), {
//         type: "ORDER_POPUP",
//         orderId: order.orderId,
//         vendorShopName: order.vendorShopName
//       });
//     });
 
//     return res.json({
//       success: true,
//       message: "Order confirmed and sent to riders",
//       notifiedRiders: riders.length
//     });
 
//   } catch (err) {
//     console.error("Confirm order error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to confirm order"
//     });
//   }
// }





// async function createOrder(req, res) {

//   try {

//     const body = req.body;

//     // ===============================
//     // 1️⃣ ADDRESS → LAT LNG
//     // ===============================

//     const pickupGeo = await getLatLng(
//       body.pickupAddress.addressLine
//     );

//     const deliveryGeo = await getLatLng(
//       body.deliveryAddress.addressLine
//     );


//     // ===============================
//     // 2️⃣ PAYMENT LOGIC
//     // ===============================

//     let paymentData = {
//       mode: body.payment.mode,
//       status: "PENDING"
//     };

//     // 👉 ONLINE → create dummy txn
//     if (body.payment.mode === "ONLINE") {

//       paymentData.transactionId = generateTxn();
//       paymentData.status = "SUCCESS";
//       paymentData.paidAt = new Date();

//     }

//     // 👉 COD
//     if (body.payment.mode === "COD") {

//       paymentData.codPaymentType =
//         body.payment.codPaymentType || "CASH";

//     }


//     // ===============================
//     // 3️⃣ CALCULATE ITEM TOTAL
//     // ===============================

//     let itemTotal = body.items.reduce(
//       (sum, i) => sum + i.total,
//       0
//     );


//     // ===============================
//     // 4️⃣ CREATE ORDER OBJECT
//     // ===============================

//     const order = new Order({

//       orderId: generateOrderId(),

//       vendorShopName: body.vendorShopName,

//       items: body.items,


//       // 👉 PICKUP WITH GEO
//       pickupAddress: {
//         name: body.pickupAddress.name,
//         addressLine: body.pickupAddress.addressLine,
//         contactNumber: body.pickupAddress.contactNumber,

//         location: {
//           type: "Point",
//           coordinates: [
//             pickupGeo.lng,
//             pickupGeo.lat
//           ]
//         }
//       },


//       // 👉 DELIVERY WITH GEO
//       deliveryAddress: {
//         name: body.deliveryAddress.name,
//         addressLine: body.deliveryAddress.addressLine,
//         contactNumber: body.deliveryAddress.contactNumber,

//         location: {
//           type: "Point",
//           coordinates: [
//             deliveryGeo.lng,
//             deliveryGeo.lat
//           ]
//         }
//       },


//       // 👉 PRICING (basic dummy)
//       pricing: {
//         itemTotal: itemTotal,
//         deliveryFee: 40,
//         tax: 5,
//         platformCommission: 10,
//         totalAmount: itemTotal + 45
//       },


//       // 👉 PAYMENT
//       payment: paymentData,


//       // 👉 COD AMOUNT IF COD
//       cod:
//         body.payment.mode === "COD"
//           ? {
//               amount: itemTotal + 45,
//               pendingAmount: itemTotal + 45
//             }
//           : undefined

//     });


//     await order.save();


//     // ===============================
//     // 5️⃣ RESPONSE
//     // ===============================

//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       orderId: order.orderId,
//       payment: order.payment
//     });


//   } catch (err) {

//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });

//   }
// }





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

    OrderItem: {
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

// async function getRouteInfo(pickupAddress, deliveryAddress) {
//   // 🛡️ Safety checks
//   if (!pickupAddress || !deliveryAddress) {
//     throw new Error("Pickup or Delivery address missing");
//   }

//   const { lat: pickupLat, lng: pickupLng } = pickupAddress;
//   const { lat: dropLat, lng: dropLng } = deliveryAddress;

//   if (
//     pickupLat == null ||
//     pickupLng == null ||
//     dropLat == null ||
//     dropLng == null
//   ) {
//     throw new Error("Invalid pickup/delivery coordinates");
//   }

//   const url = "https://maps.googleapis.com/maps/api/directions/json";

//   const response = await axios.get(url, {
//     params: {
//       origin: `${pickupLat},${pickupLng}`,
//       destination: `${dropLat},${dropLng}`,
//       key: process.env.GOOGLE_KEY,
//     },
//   });

//   if (!response.data.routes || response.data.routes.length === 0) {
//     throw new Error("No route found between pickup and drop");
//   }

//   const leg = response.data.routes[0].legs[0];

//   return {
//     distanceKm: Number((leg.distance.value / 1000).toFixed(2)),
//     etaMinutes: Math.ceil(leg.duration.value / 60),
//   };
// }

// async function getRouteInfo(pickupAddress, deliveryAddress) {
//   console.log("Pickup:99", order.pickupAddress);
// console.log("Delivery:99", order.deliveryAddress);

//   const pickupCoords = pickupAddress?.location?.coordinates;
//   const dropCoords = deliveryAddress?.location?.coordinates;

//   if (
//     !Array.isArray(pickupCoords) || pickupCoords.length !== 2 ||
//     !Array.isArray(dropCoords) || dropCoords.length !== 2
//   ) {
//     throw new Error("Invalid pickup/delivery coordinates");
//   }

//   const [pickupLng, pickupLat] = pickupCoords;
//   const [dropLng, dropLat] = dropCoords;

//   const response = await axios.get(
//     "https://maps.googleapis.com/maps/api/directions/json",
//     {
//       params: {
//         origin: `${pickupLat},${pickupLng}`,
//         destination: `${dropLat},${dropLng}`,
//         key: process.env.GOOGLE_KEY
//       }
//     }
//   );

//   if (!response.data.routes?.length) {
//     throw new Error("No route found");
//   }

//   const leg = response.data.routes[0].legs[0];

//   return {
//     distanceKm: +(leg.distance.value / 1000).toFixed(2),
//     etaMinutes: Math.ceil(leg.duration.value / 60)
//   };
// }
//2nd line is new

async function getRouteInfo(pickupAddress, deliveryAddress) {
  if (!pickupAddress || !deliveryAddress) {
    throw new Error("Pickup or Delivery address missing");
  }

  const pickupCoords = pickupAddress.location?.coordinates;
  const dropCoords = deliveryAddress.location?.coordinates;

  if (
    !Array.isArray(pickupCoords) || pickupCoords.length !== 2 ||
    !Array.isArray(dropCoords) || dropCoords.length !== 2
  ) {
    throw new Error("Invalid pickup/delivery coordinates");
  }

  const [pickupLng, pickupLat] = pickupCoords;
  const [dropLng, dropLat] = dropCoords;

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

  if (!response.data.routes || response.data.routes.length === 0) {
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

//     /* ===============================
//        1️⃣ FETCH ORDER
//     =============================== */
//     const order = await Order.findOne({ orderId });

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

//     /* ===============================
//        2️⃣ FETCH ELIGIBLE RIDERS
//     =============================== */
//     // const riders = await Rider.find({
//     //   // "deliveryStatus.isActive": true,
//     //   orderState: "READY",
//     //   "riderStatus.isOnline": true
//     // })
//     //   .limit(10)
//     //   .select("_id");
//      const now = new Date();

// const riders = await Rider.aggregate([
//   {
//     $match: {
//       orderState: "READY",
//       "riderStatus.isOnline": true
//     }
//   },
//   {
//     $lookup: {
//       from: "slotbookings",
//       let: { riderId: "$_id" },
//       pipeline: [
//         {
//           $match: {
//             $expr: {
//               $and: [
//                 { $eq: ["$riderId", "$$riderId"] },
//                 { $eq: ["$status", "BOOKED"] },
//                 { $gte: ["$slotEndAt", now] } // active + upcoming
//               ]
//             }
//           }
//         }
//       ],
//       as: "validSlots"
//     }
//   },
//   {
//     $match: {
//       "validSlots.0": { $exists: true }
//     }
//   },
//   {
//     $limit: 10
//   },
//   {
//     $project: { _id: 1 }
//   }
// ]);

//     // const riders = await Rider.find({}).limit(10);


//     if (!riders.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No riders available"
//       });
//     }

//     /* ===============================
//        3️⃣ UPDATE ORDER STATUS + ALLOCATION
//     =============================== */
//     order.orderStatus = "CONFIRMED";
//     order.allocation = {
//       candidateRiders: riders.map(r => ({
//         riderId: r._id,
//         status: "PENDING",
//         notifiedAt: new Date()
//       })),
//       expiresAt: new Date(Date.now() + 120 * 1000)
//     };

//     await order.save();

//     /* ===============================
//        4️⃣ DISTANCE + ETA
//     =============================== */
//     const routeInfo = await getRouteInfo(
//       order.pickupAddress,
//       order.deliveryAddress
//     );

//     /* ===============================
//        5️⃣ FETCH PRICING CONFIG
//     =============================== */
//     const pricingConfig = await PricingConfig.findOne({ isActive: true });
//     if (!pricingConfig) {
//       throw new Error("Pricing config not found");
//     }

//     /* ===============================
//        6️⃣ RIDER EARNING CALCULATION
//     =============================== */
//     let basePay = pricingConfig.baseFare.baseAmount;
//     let distancePay = 0;
//     let surgePay = 0;
//     let appliedSurges = [];

//     const distanceKm = routeInfo.distanceKm;

//     // Distance pay
//     if (distanceKm > pricingConfig.baseFare.baseDistanceKm) {
//       const extraKm =
//         distanceKm - pricingConfig.baseFare.baseDistanceKm;

//       distancePay =
//         extraKm * pricingConfig.distanceFare.perKmRate;
//     }

//     // Surge logic
//     const currentTime = new Date().toTimeString().slice(0, 5);
//     const isRaining = order.weather === "RAIN";

//     pricingConfig.surges.forEach(surge => {
//       if (!surge.isActive) return;

//       let apply = false;

//       if (
//         surge.type === "PEAK" &&
//         currentTime >= surge.conditions.startTime &&
//         currentTime <= surge.conditions.endTime
//       ) apply = true;

//       if (surge.type === "RAIN" && isRaining) apply = true;

//       if (
//         surge.type === "ZONE" &&
//         surge.conditions.zoneIds?.includes(order.zoneId)
//       ) apply = true;

//       if (apply) {
//         surgePay += surge.value;

//         appliedSurges.push({
//           type: surge.type,
//           multiplierType: surge.multiplierType || "FIXED",
//           value: surge.value
//         });
//       }
//     });

//     const totalEarning = basePay + distancePay + surgePay;

//     /* ===============================
//        7️⃣ SAVE SNAPSHOT INTO ORDER
//     =============================== */
//     order.riderEarning = {
//       basePay,
//       distancePay,
//       surgePay,
//       appliedSurges,
//       tips: 0,
//       totalEarning,
//       credited: false
//     };

//     order.tracking = {
//       distanceInKm: routeInfo.distanceKm,
//       durationInMin: routeInfo.etaMinutes
//     };

//     await order.save();

//     console.log(
//   "Riders getting popup:",
//   riders.map(r => r._id.toString())
// );


//     /* ===============================
//        8️⃣ WEBSOCKET NOTIFICATION
//     =============================== */
//     riders.forEach(rider => {
//       notifyRider(rider._id.toString(), {
//         type: "ORDER_POPUP",
//         orderId: order.orderId,
//         vendorShopName: order.vendorShopName,
//         pickupLocation: order.pickupAddress,
//         dropLocation: order.deliveryAddress,
//         distanceKm: routeInfo.distanceKm,
//         etaMinutes: routeInfo.etaMinutes,
//         estimatedEarning: totalEarning
//       });
//     });

//     /* ===============================
//        9️⃣ RESPONSE
//     =============================== */
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

    //////////////////////////////////////////////////////
    // 1️⃣ FETCH ORDER
    //////////////////////////////////////////////////////

    const order = await prisma.order.findFirst({
      where: { orderId },
      include: {
        OrderPickupAddress: true,
        OrderDeliveryAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.orderStatus !== "CREATED") {
      return res.status(400).json({
        success: false,
        message: "Order already processed"
      });
    }

    //////////////////////////////////////////////////////
    // 2️⃣ FETCH ELIGIBLE RIDERS
    //////////////////////////////////////////////////////

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

    if (!riders.length) {
      return res.status(400).json({
        success: false,
        message: "No riders available"
      });
    }

    //////////////////////////////////////////////////////
    // 3️⃣ UPDATE ORDER STATUS
    //////////////////////////////////////////////////////

    await prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: "CONFIRMED" }
    });

    //////////////////////////////////////////////////////
    // 4️⃣ CREATE ORDER ALLOCATION
    //////////////////////////////////////////////////////

    const allocation = await prisma.orderAllocation.create({
      data: {
        orderId: order.id,
        expiresAt: new Date(Date.now() + 120 * 1000),
        OrderCandidateRider: {
          create: riders.map(r => ({
            riderId: r.id,
            status: "PENDING",
            notifiedAt: new Date()
          }))
        }
      }
    });

    //////////////////////////////////////////////////////
    // 5️⃣ DISTANCE + ETA
    //////////////////////////////////////////////////////

    const routeInfo = await getRouteInfo(
      order.OrderPickupAddress,
      order.OrderDeliveryAddress
    );

    //////////////////////////////////////////////////////
    // 6️⃣ RIDER EARNING CALCULATION (simplified)
    //////////////////////////////////////////////////////

    const basePay = 40;
    const distancePay = routeInfo.distanceKm * 5;
    const surgePay = 0;

    const totalEarning = basePay + distancePay + surgePay;

    //////////////////////////////////////////////////////
    // 7️⃣ SAVE RIDER EARNING SNAPSHOT
    //////////////////////////////////////////////////////

    await prisma.orderRiderEarning.create({
      data: {
        orderId: order.id,
        basePay,
        distancePay,
        surgePay,
        totalEarning,
        credited: false
      }
    });

    //////////////////////////////////////////////////////
    // 8️⃣ SAVE TRACKING SNAPSHOT
    //////////////////////////////////////////////////////

    await prisma.orderTracking.create({
      data: {
        orderId: order.id,
        distanceInKm: routeInfo.distanceKm,
        durationInMin: routeInfo.etaMinutes
      }
    });

    //////////////////////////////////////////////////////
    // 9️⃣ NOTIFY RIDERS (WebSocket)
    //////////////////////////////////////////////////////

    riders.forEach(rider => {
      notifyRider(rider.id, {
        type: "ORDER_POPUP",
        orderId: order.orderId,
        vendorShopName: order.vendorShopName,
        pickupLocation: order.OrderPickupAddress,
        dropLocation: order.OrderDeliveryAddress,
        distanceKm: routeInfo.distanceKm,
        etaMinutes: routeInfo.etaMinutes,
        estimatedEarning: totalEarning
      });
    });

    //////////////////////////////////////////////////////
    // 🔟 RESPONSE
    //////////////////////////////////////////////////////

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

//     const riderId  = req.rider._id;
 
//     const now = new Date();
 
//     const order = await Order.findOneAndUpdate(

//       {

//         orderId,

//         orderStatus: "CONFIRMED",

//         riderId: null,

//         "allocation.expiresAt": { $gt: now },

//         "allocation.candidateRiders": {

//           $elemMatch: {

//             riderId,

//             status: "PENDING"

//           }

//         }

//       },

//       {

//         $set: {

//           riderId,

//           orderStatus: "ASSIGNED",

//           "allocation.assignedAt": now,

//           "allocation.candidateRiders.$[r].status": "ACCEPTED"

//         }

//       },

//       {

//         new: true,

//         arrayFilters: [{ "r.riderId": riderId }]

//       }

//     );
 
//     if (!order) {

//       return res.status(409).json({

//         success: false,

//         message: "Order already assigned or expired"

//       });

//     }
 
//     // Mark others as REJECTED

//     await Order.updateOne(

//       { orderId },

//       {

//         $set: {

//           "allocation.candidateRiders.$[r].status": "REJECTED"

//         }

//       },

//       {

//         arrayFilters: [

//           { "r.riderId": { $ne: riderId }, "r.status": "PENDING" }

//         ]

//       }

//     );
 
//     return res.json({

//       success: true,

//       message: "Order assigned successfully",

//       orderId: order.orderId

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

  const session = await mongoose.startSession();
 
  try {

    const { orderId } = req.params;

    const riderId = req.rider._id;

    const now = new Date();
 
    // 🚫 Rider already busy

    if (req.rider.orderState === "BUSY") {

      return res.status(409).json({

        success: false,

        message: "Rider already busy"

      });

    }
 
    session.startTransaction();
 
    /* ============================

       1️⃣ ASSIGN ORDER

    ============================ */

    const order = await Order.findOneAndUpdate(

      {

        orderId,

        orderStatus: "CONFIRMED",

        riderId: null,

        "allocation.expiresAt": { $gt: now },

        "allocation.candidateRiders": {

          $elemMatch: {

            riderId,

            status: "PENDING"

          }

        }

      },

      {

        $set: {

          riderId,

          orderStatus: "ASSIGNED",

          "allocation.assignedAt": now,

          "allocation.candidateRiders.$[r].status": "ACCEPTED"

        }

      },

      {

        new: true,

        session,

        arrayFilters: [{ "r.riderId": riderId }]

      }

    );
 
    if (!order) {

      await session.abortTransaction();

      return res.status(409).json({

        success: false,

        message: "Order already assigned or expired"

      });

    }
 
    /* ============================

       2️⃣ MARK OTHER RIDERS REJECTED

    ============================ */

    await Order.updateOne(

      { orderId },

      {

        $set: {

          "allocation.candidateRiders.$[r].status": "REJECTED"

        }

      },

      {

        session,

        arrayFilters: [

          { "r.riderId": { $ne: riderId }, "r.status": "PENDING" }

        ]

      }

    );
 
    /* ============================

       3️⃣ UPDATE RIDER → BUSY

    ============================ */

    await Rider.updateOne(

      {

        _id: riderId,

        orderState: "READY" // 🔒 safety check

      },

      {

        $set: {

          orderState: "BUSY",

          currentOrderId: order._id

        }

      },

      { session }

    );
 
    await session.commitTransaction();
 
    return res.json({

      success: true,

      message: "Order accepted, rider is now busy",

      orderId: order.orderId,
      orderStatus:order.orderStatus

    });
 
  } catch (err) {

    await session.abortTransaction();

    console.error("Accept order error:", err);
 
    return res.status(500).json({

      success: false,

      message: "Failed to accept order"

    });

  } finally {

    session.endSession();

  }

}

 

async function rejectOrder(req, res) {
  try {
    const { orderId } = req.params;
    const riderId = req.rider._id
   
 
    const result = await Order.findOneAndUpdate(
      {
        orderId,
        orderStatus: "CONFIRMED",
        riderId: null,
        "allocation.candidateRiders": {
          $elemMatch: {
            riderId,
            status: "PENDING"
          }
        }
      },
      {
        $set: {
          "allocation.candidateRiders.$[r].status": "REJECTED",
          "allocation.candidateRiders.$[r].rejectedAt": new Date(),
        
        }
      },
      {
        new: true,
        arrayFilters: [
          { "r.riderId": riderId, "r.status": "PENDING" }
        ]
      }
    );
 
    if (!result) {
      return res.status(409).json({
        success: false,
        message: "Order already assigned or cannot be rejected"
      });
    }
 
    const pendingCount = result.allocation.candidateRiders.filter(
      r => r.status === "PENDING"
    ).length;
 
    return res.json({
      success: true,
      message: "Order rejected successfully",
      pendingRiders: pendingCount
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
    const order = await prisma.Order.findFirst({
      where: { orderId },
      include: {
        Rider: {
          select: {
              id: true,
              phoneNumber: true
            }
          },
          OrderItem: true,
          OrderPickupAddress: true,
          OrderDeliveryAddress: true,
          OrderPricing: true
        }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
     const filteredOrder = {
      id: order.id,
      orderId: order.orderId,
      vendorShopName: order.vendorShopName,
      items: order.OrderItem,
      pickupAddress: order.OrderPickupAddress,
      deliveryAddress: order.OrderDeliveryAddress,
      pricing: order.OrderPricing
    };


    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      orderStatus:order.orderStatus,
      order

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

    const order = await prisma.Order.findFirst({
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
        where: { id: order.id },
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




// async function deliverOrder(req, res) {

//   try {
//     const { orderId } = req.params;
//     const riderId  = req.rider._id; // ✅ FIXED
 
//     if (!riderId) {
//       return res.status(400).json({
//         success: false,
//         message: "riderId is required"
//       });
//     }
 
//     /* ===============================
//        1️⃣ FETCH ORDER
//     =============================== */
//     const order = await Order.findOne({ orderId });
 
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found"
//       });
//     }
 
//     /* ===============================
//        2️⃣ VALIDATE ORDER STATUS
//     =============================== */
//     if (order.orderStatus !== "PICKED_UP") {
//       return res.status(400).json({
//         success: false,
//         message: `Order cannot be delivered. Current status: ${order.orderStatus}`
//       });
//     }
 
//     /* ===============================
//        3️⃣ VALIDATE RIDER ASSIGNMENT
//     =============================== */
//     if (!order.riderId) {
//       return res.status(400).json({
//         success: false,
//         message: "Order has no assigned rider"
//       });
//     }
 
//     const assignedRiderId =
//       order.riderId._id
//         ? order.riderId._id.toString()
//         : order.riderId.toString();
 
//     if (assignedRiderId !== riderId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not assigned to this order"
//       });
//     }
 
//     /* ===============================
//        4️⃣ FETCH RIDER
//     =============================== */
//     const rider = await Rider.findById(riderId);
 
//     if (!rider) {
//       return res.status(404).json({
//         success: false,
//         message: "Rider not found"
//       });
//     }
 
//     /* ===============================
//        5️⃣ CREDIT RIDER EARNING (ONCE)
//     =============================== */
//     if (!order.riderEarning.credited) {
//       const earning = Number(order.riderEarning.totalEarning || 0);
 
//       rider.wallet.balance += earning;
//       rider.wallet.totalEarned += earning;
 
//       order.riderEarning.credited = true;
//       order.riderEarning.creditedAt = new Date();
//       order.settlement.riderEarningAdded = true;
//     }
 
//     /* ===============================
//        6️⃣ HANDLE CASH ON DELIVERY
//     =============================== */
//     let codCollected = 0;
 
//     if (order.payment.mode === "COD") {
//       codCollected = Number(order.pricing.totalAmount || 0);
 
//       if (rider.cashInHand.balance + codCollected > rider.cashInHand.limit) {
//         rider.deliveryStatus.isActive = false;
//         rider.deliveryStatus.inactiveReason = "COD_LIMIT_EXCEEDED";
 
//         await rider.save();
 
//         return res.status(400).json({
//           success: false,
//           message: "COD limit exceeded. Please settle cash."
//         });
//       }
 
//       rider.cashInHand.balance += codCollected;
//       rider.cashInHand.lastUpdatedAt = new Date();
//     }
 
//     /* ===============================
//        7️⃣ UPDATE ORDER
//     =============================== */
//     order.orderStatus = "DELIVERED";
//     order.payment.status = "SUCCESS";
//     order.tracking.deliveredAt = new Date();
 
//     /* ===============================
//        8️⃣ UPDATE RIDER STATE
//     =============================== */
//     rider.orderState = "READY";
//     rider.currentOrderId = null;
 
//     /* ===============================
//        9️⃣ SAVE
//     =============================== */
//     await Promise.all([order.save(), rider.save()]);
 
//     /* ===============================
//        🔟 RESPONSE
//     =============================== */
//     return res.status(200).json({
//       success: true,
//       message: "Order delivered successfully",
//       orderId: order.orderId,
//       earningCredited: order.riderEarning.totalEarning,
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

//

//

//2nd latest


// async function deliverOrder(req, res) {
//   try {
//     const { orderId } = req.params;
//     const riderId = req.rider._id;
 
//     if (!riderId) {
//       return res.status(400).json({
//         success: false,
//         message: "riderId is required"
//       });
//     }
 
//     /* ===============================
//        1️⃣ FETCH ORDER
//     =============================== */
//     const order = await Order.findOne({ orderId });
 
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found"
//       });
//     }
 
//     /* ===============================
//        2️⃣ VALIDATE ORDER STATUS
//     =============================== */
//     if (order.orderStatus !== "PICKED_UP") {
//       return res.status(400).json({
//         success: false,
//         message: `Order cannot be delivered. Current status: ${order.orderStatus}`
//       });
//     }
 
//     /* ===============================
//        3️⃣ VALIDATE RIDER ASSIGNMENT
//     =============================== */
//     if (!order.riderId) {
//       return res.status(400).json({
//         success: false,
//         message: "Order has no assigned rider"
//       });
//     }
 
//     const assignedRiderId =
//       order.riderId._id
//         ? order.riderId._id.toString()
//         : order.riderId.toString();
 
//     if (assignedRiderId !== riderId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not assigned to this order"
//       });
//     }
 
//     /* ===============================
//        4️⃣ FETCH RIDER
//     =============================== */
//     const rider = await Rider.findById(riderId);
 
//     if (!rider) {
//       return res.status(404).json({
//         success: false,
//         message: "Rider not found"
//       });
//     }
 
//     /* ===============================
//        5️⃣ CREDIT RIDER EARNING (ONCE)
//     =============================== */
//     if (!order.riderEarning.credited) {
//       const earning = Number(order.riderEarning.totalEarning || 0);
 
//       rider.wallet.balance += earning;
//       rider.wallet.totalEarned += earning;
 
//       order.riderEarning.credited = true;
//       order.riderEarning.creditedAt = new Date();
//       order.settlement.riderEarningAdded = true;
//     }
 
//     /* ===============================
//        6️⃣ HANDLE COD
//     =============================== */
//     let codCollected = 0;
 
//     if (order.payment.mode === "COD") {
//       codCollected = Number(order.pricing.totalAmount || 0);
 
//       if (rider.cashInHand.balance + codCollected > rider.cashInHand.limit) {
//         rider.deliveryStatus.isActive = false;
//         rider.deliveryStatus.inactiveReason = "COD_LIMIT_EXCEEDED";
//         await rider.save();
 
//         return res.status(400).json({
//           success: false,
//           message: "COD limit exceeded. Please settle cash."
//         });
//       }
 
//       rider.cashInHand.balance += codCollected;
//       rider.cashInHand.lastUpdatedAt = new Date();
//     }
 
//     /* ===============================
//        7️⃣ UPDATE ORDER
//     =============================== */
//     order.orderStatus = "DELIVERED";
//     order.payment.status = "SUCCESS";
//     order.tracking.deliveredAt = new Date();
 
//     /* ===============================
//        8️⃣ RESET RIDER STATE → READY
//     =============================== */
//     rider.orderState = "READY";
//     rider.currentOrderId = null;
 
//     /* ===============================
//        9️⃣ SAVE
//     =============================== */
//     await Promise.all([order.save(), rider.save()]);
 
//     /* ===============================
//        🔟 RESPONSE
//     =============================== */
//     return res.status(200).json({
//       success: true,
//       message: "Order delivered successfully",
//       orderStatus:order.orderStatus,
//       orderId: order.orderId,
//       earningCredited: order.riderEarning.totalEarning,
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

async function deliverOrder(req, res) {

  try {

    const { orderId } = req.params;

    const riderId = req.rider._id;
 
    if (!riderId) {

      return res.status(400).json({ success: false, message: "riderId required" });

    }
 
    /* 1️⃣ FETCH ORDER */

    const order = await Order.findOne({ orderId });

    if (!order) {

      return res.status(404).json({ success: false, message: "Order not found" });

    }
 
    /* 2️⃣ VALIDATE STATUS */

    if (order.orderStatus !== "PICKED_UP") {

      return res.status(400).json({

        success: false,

        message: `Invalid status: ${order.orderStatus}`

      });

    }
 
    /* 3️⃣ VALIDATE RIDER */

    const assignedRiderId = order.riderId._id

      ? order.riderId._id.toString()

      : order.riderId.toString();
 
    if (assignedRiderId !== riderId.toString()) {

      return res.status(403).json({

        success: false,

        message: "Not assigned to this order"

      });

    }
 
    const rider = await Rider.findById(riderId);

    if (!rider) {

      return res.status(404).json({ success: false, message: "Rider not found" });

    }
 
    /* 4️⃣ CREDIT RIDER EARNING */

    if (!order.riderEarning.credited) {

      const earning = Number(order.riderEarning.totalEarning || 0);

      rider.wallet.balance += earning;

      rider.wallet.totalEarned += earning;
 
      order.riderEarning.credited = true;

      order.riderEarning.creditedAt = new Date();

      order.settlement.riderEarningAdded = true;

    }
 
    /* 5️⃣ HANDLE COD */

    let codCollected = 0;

    if (order.payment.mode === "COD") {

      codCollected = Number(order.pricing.totalAmount || 0);
 
      if (rider.cashInHand.balance + codCollected > rider.cashInHand.limit) {

        rider.deliveryStatus.isActive = false;

        rider.deliveryStatus.inactiveReason = "COD_LIMIT_EXCEEDED";

        await rider.save();
 
        return res.status(400).json({

          success: false,

          message: "COD limit exceeded"

        });

      }
 
      rider.cashInHand.balance += codCollected;

      rider.cashInHand.lastUpdatedAt = new Date();

    }
 
    /* 6️⃣ UPDATE ORDER */

    order.orderStatus = "DELIVERED";

    order.payment.status = "SUCCESS";

    order.tracking.deliveredAt = new Date();
 
    /* 7️⃣ RESET RIDER STATE */

    rider.orderState = "READY";

    rider.currentOrderId = null;
 
    await Promise.all([order.save(), rider.save()]);
 
    /* ===============================

       8️⃣ INCENTIVE PROGRESS UPDATE

    =============================== */

    /* ===============================
   8️⃣ INCENTIVE PROGRESS UPDATE
=============================== */

const incentives = await Incentive.find({ status: "ACTIVE" });

const dateKey = getDateKey();
const weekKey = getWeekKey();
const peak = isPeakSlot(order.tracking.deliveredAt);

for (const incentive of incentives) {

  /* 🔥 PEAK SLOT INCENTIVE */
  if (incentive.incentiveType === "PEAK_SLOT" && peak) {

    const progress = await RiderIncentiveProgress.findOneAndUpdate(
      { riderId, incentiveId: incentive._id, date: dateKey },

      {
        $inc: { totalOrders: 1, peakOrders: 1 },

        $setOnInsert: {
          incentiveType: incentive.incentiveType
        }
      },

      { upsert: true, new: true, runValidators: true }
    );

    const peakSlabs = incentive.slabs?.[0]?.peak || [];

    const slab = peakSlabs.find(s =>
      progress.peakOrders >= s.minOrders &&
      progress.peakOrders <= s.maxOrders
    );

    if (slab) {
      progress.eligible = true;
      progress.achievedReward = slab.rewardAmount;
      await progress.save();
    }
  }

  /* 🔥 DAILY TARGET INCENTIVE */
  if (incentive.incentiveType === "DAILY_TARGET") {

    const progress = await RiderIncentiveProgress.findOneAndUpdate(
      { riderId, incentiveId: incentive._id, date: dateKey },

      {
        $inc: {
          totalOrders: 1,
          peakOrders: peak ? 1 : 0,
          normalOrders: peak ? 0 : 1
        },

        $setOnInsert: {
          incentiveType: incentive.incentiveType
        }
      },

      { upsert: true, new: true, runValidators: true }
    );

    if (
      progress.peakOrders >= incentive.slotRules.minPeakSlots &&
      progress.normalOrders >= incentive.slotRules.minNormalSlots
    ) {
      progress.eligible = true;
      await progress.save();
    }
  }

  /* 🔥 WEEKLY TARGET INCENTIVE */
  if (incentive.incentiveType === "WEEKLY_TARGET") {

    const progress = await RiderIncentiveProgress.findOneAndUpdate(
      { riderId, incentiveId: incentive._id, week: weekKey },

      {
        $setOnInsert: {
          incentiveType: incentive.incentiveType
        }
      },

      { upsert: true, new: true, runValidators: true }
    );

    if (!progress.dailyOrders) {
      progress.dailyOrders = new Map();
    }

    progress.eligibleDays = progress.eligibleDays || 0;

    const todayCount = progress.dailyOrders.get(dateKey) || 0;
    progress.dailyOrders.set(dateKey, todayCount + 1);

    if (todayCount + 1 >= incentive.weeklyRules.minOrdersPerDay) {
      progress.eligibleDays += 1;
    }

    if (progress.eligibleDays >= incentive.weeklyRules.totalDaysInWeek) {
      progress.eligible = true;
      progress.achievedReward = incentive.maxRewardPerWeek;
    }

    await progress.save();
  }
}
 
    /* 9️⃣ RESPONSE */

    return res.status(200).json({

      success: true,

      message: "Order delivered successfully",

      orderId: order.orderId,

      earningCredited: order.riderEarning.totalEarning,

      codCollected

    });
 
  } catch (err) {

    console.error("Deliver order error:", err);

    return res.status(500).json({

      success: false,

      message: err.message || "Failed to deliver order"

    });

  }

}
 


 



 




// async function cancelOrder(req, res) {

//   try {

//     const { orderId } = req.params;
//     const riderId= req.rider._id;
//     const {  reasonCode, reasonText } = req.body; // ✅ FIXED
 
//     if (!riderId) {

//       return res.status(400).json({

//         success: false,

//         message: "riderId is required"

//       });

//     }
 
//     /* ===============================

//        1️⃣ FETCH ORDER

//     =============================== */

//     const order = await Order.findOne({ orderId });
 
//     if (!order) {

//       return res.status(404).json({

//         success: false,

//         message: "Order not found"

//       });

//     }
 
//     /* ===============================

//        2️⃣ VALIDATE STATE

//     =============================== */

//     if (["DELIVERED", "CANCELLED"].includes(order.orderStatus)) {

//       return res.status(400).json({

//         success: false,

//         message: "Order cannot be cancelled"

//       });

//     }
 
//     if (!order.riderId) {

//       return res.status(400).json({

//         success: false,

//         message: "Order has no assigned rider"

//       });

//     }
 
//     /* ===============================

//        3️⃣ VALIDATE RIDER ASSIGNMENT

//     =============================== */

//     const assignedRiderId =

//       order.riderId._id

//         ? order.riderId._id.toString()

//         : order.riderId.toString();
 
//     if (assignedRiderId !== riderId.toString()) {

//       return res.status(403).json({

//         success: false,

//         message: "You are not assigned to this order"

//       });

//     }
 
//     /* ===============================

//        4️⃣ UPDATE ORDER

//     =============================== */

//     order.orderStatus = "CANCELLED";

//     order.cancelIssue = {

//       cancelledBy: "RIDER",

//       reasonCode,

//       reasonText,

//       cancelledAt: new Date()

//     };
 
//     /* ===============================

//        5️⃣ RESET RIDER STATE

//     =============================== */

//     await Rider.findByIdAndUpdate(riderId, {

//       $set: {

//         orderState: "READY",

//         currentOrderId: null

//       }

//     });
 
//     await order.save();
 
//     /* ===============================

//        6️⃣ WS NOTIFICATION

//     =============================== */

//     notifyRider(riderId.toString(), {

//       type: "ORDER_CANCELLED",

//       orderId: order.orderId,

//       reason: reasonCode

//     });
 
//     /* ===============================

//        7️⃣ RESPONSE

//     =============================== */

//     return res.status(200).json({

//       success: true,

//       message: "Order cancelled successfully",

//       cancelIssue: order.cancelIssue

//     });
 
//   } catch (err) {

//     console.error("Cancel order error:", err);

//     return res.status(500).json({

//       success: false,

//       message: err.message || "Failed to cancel order"

//     });

//   }

// }

async function cancelOrder(req, res) {
  try {
    const { orderId } = req.params;
    const riderId = req.rider._id;
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
    const order = await Order.findOne({ orderId });
 
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
    const assignedRiderId =
      order.riderId._id
        ? order.riderId._id.toString()
        : order.riderId.toString();
 
    if (assignedRiderId !== riderId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order"
      });
    }
 
    /* ===============================
       4️⃣ UPDATE ORDER
    =============================== */
    order.orderStatus = "CANCELLED";
    order.cancelIssue = {
      cancelledBy: "RIDER",
      reasonCode,
      reasonText,
      cancelledAt: new Date()
    };
 
    /* ===============================
       5️⃣ RESET RIDER STATE → READY
    =============================== */
    await Rider.findOneAndUpdate(
      { _id: riderId, currentOrderId: order._id },
      {
        $set: {
          orderState: "READY",
          currentOrderId: null
        }
      }
    );
 
    await order.save();
 
    /* ===============================
       6️⃣ WS NOTIFICATION
    =============================== */
    notifyRider(riderId.toString(), {
      type: "ORDER_CANCELLED",
      orderId: order.orderId,
      reason: reasonCode
    });
 
    /* ===============================
       7️⃣ RESPONSE
    =============================== */
    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      orderStatus:order.orderStatus,

      cancelIssue: order.cancelIssue
    });
 
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to cancel order"
    });
  }
}


/*
=============================


=============================
*/

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
 
 