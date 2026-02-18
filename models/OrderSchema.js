// const mongoose = require("mongoose");

// const { Schema } = mongoose;
 
// const OrderSchema = new Schema(

//   {

//     // 🔹 Order identity

//     orderId: {

//       type: String,

//       required: true,

//       index: true

//     },
 
//     // 🔹 Relations

//     riderId: {

//       type: Schema.Types.ObjectId,

//       ref: "Rider",

//       index: true

//     },
 
//     vendorShopName: {

//       type: String,

//       required: true

//     },
 
//     // 🔹 Items

//     items: [

//       {

//         itemName: { type: String, required: true },

//         quantity: { type: Number, required: true },

//         price: { type: Number, required: true },

//         total: { type: Number, required: true }

//       }

//     ],
 
//     // 🔹 Pickup Location

//     pickupAddress: {

//       name: String,

//       addressLine: String,

//       contactNumber: String,

//       location: {

//         type: { type: String, enum: ["Point"], default: "Point" },

//         coordinates: {

//           type: [Number], // [lng, lat]

//           index: "2dsphere"

//         }

//       }

//     },
 
//     // 🔹 Delivery Location

//     deliveryAddress: {

//       name: String,

//       addressLine: String,

//       contactNumber: String,

//       location: {

//         type: { type: String, enum: ["Point"], default: "Point" },

//         coordinates: {

//           type: [Number], // [lng, lat]

//           index: "2dsphere"

//         }

//       }

//     },
 
//     // 🔹 Pricing (Customer side)

//     pricing: {

//       itemTotal: { type: Number, default: 0 },

//       deliveryFee: { type: Number, default: 0 },

//       tax: { type: Number, default: 0 },

//       platformCommission: { type: Number, default: 0 },

//       totalAmount: { type: Number, default: 0 }

//     },
 
//     // 🔹 Slot snapshot

//     slotInfo: {

//       slotBookingId: {

//         type: Schema.Types.ObjectId,

//         ref: "SlotBooking"

//       },

//       slotId: Schema.Types.ObjectId,

//       isSlotBooked: { type: Boolean, default: false },

//       isPeakSlot: Boolean,

//       slotStartAt: Date,

//       slotEndAt: Date

//     },
 
//     // 🔹 Assigned rider snapshot

//     assignedRider: {

//       riderId: {

//         type: Schema.Types.ObjectId,

//         ref: "Rider"

//       },

//       acceptedAt: Date

//     },
 
//     // 🔹 Rider Earning snapshot

//     riderEarning: {

//       basePay: { type: Number, default: 0 },

//       distancePay: { type: Number, default: 0 },

//       surgePay: { type: Number, default: 0 },
 
//       appliedSurges: [

//         {

//           type: {

//             type: String,

//             enum: ["PEAK", "RAIN", "ZONE", "NIGHT", "HIGH_DEMAND"]

//           },

//           multiplierType: {

//             type: String,

//             enum: ["FIXED", "PER_ORDER"]

//           },

//           value: Number

//         }

//       ],
 
//       tips: { type: Number, default: 0 },

//       totalEarning: { type: Number, default: 0 },

//       credited: { type: Boolean, default: false },

//       creditedAt: Date

//     },
 
//     pricingVersion: Number,
 
//     // 🔹 Order Status

//     orderStatus: {

//       type: String,

//       enum: [

//         "CREATED",

//         "CONFIRMED",

//         "ASSIGNED",

//         "PICKED_UP",

//         "DELIVERED",

//         "CANCELLED"

//       ],

//       default: "CREATED",

//       index: true

//     },
 
//     // 🔹 Cancellation

//     cancelIssue: {

//       cancelledBy: {

//         type: String,

//         enum: ["CUSTOMER", "RIDER", "VENDOR", "ADMIN"]

//       },

//       stage: {

//         type: String,

//         enum: ["BEFORE_ASSIGN", "AFTER_ASSIGN", "AFTER_PICKUP"]

//       },

//       reasonCode: String,

//       reasonText: String

//     },
 
//     // 🔹 Payment

//     payment: {

//       mode: {

//         type: String,

//         enum: ["ONLINE", "COD"]

//       },

//       status: {

//         type: String,

//         enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"]

//       },

//       transactionId: String

//     },
 
//     // 🔹 COD Cash tracking

//     cashCollection: {

//       isCOD: { type: Boolean, default: false },

//       orderAmount: Number,

//       collectedByRider: { type: Boolean, default: false },

//       collectedAt: Date,

//       settledToAdmin: { type: Boolean, default: false }

//     },
 
//     // 🔹 Tracking summary

//     tracking: {

//       distanceInKm: Number,

//       durationInMin: Number

//     },
 
//     // 🔹 Settlement flags

//     settlement: {

//       riderEarningAdded: { type: Boolean, default: false },

//       vendorSettled: { type: Boolean, default: false },

//       codSettled: { type: Boolean, default: false }

//     }

//   },

//   { timestamps: true }

// );
 
// module.exports = mongoose.model("Order", OrderSchema, "order");

 
const mongoose=require('mongoose')
const {Schema}=mongoose;

const OrderSchema = new Schema(
{
    orderId: { type: String, index: true },
 
    // Relations 
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "Rider",
      index: true
    },
 
    vendorShopName: {
      type: String,
      required: true
    },
 
    // Grocery Items
    items: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },   // per unit
        total: { type: Number, required: true }    // quantity * price
      }
    ],
 
   pickupAddress: {
      name: String,
      addressLine: String,
      contactNumber: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }
      }
   },

   deliveryAddress: {
      name: String,
      addressLine: String,
      contactNumber: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }
      }
   },

    // Pricing
    pricing: {
      itemTotal: Number,
      deliveryFee: Number,
      tax: Number,
      platformCommission: Number,
      totalAmount: Number
    },
 
    // Rider Earning
    riderEarning: {
      basePay: { type: Number, default: 0 },
      distancePay: { type: Number, default: 0 },
      surgePay: { type: Number, default: 0 },
 
      appliedSurges: [
        {
          type: {
            type: String,
            enum: ["PEAK", "RAIN", "ZONE", "NIGHT", "HIGH_DEMAND"]
          },
          multiplierType: {
            type: String,
            enum: ["FIXED", "PER_ORDER"]
          },
          value: Number
        }
      ],
 
      tips: { type: Number, default: 0 },
      totalEarning: { type: Number, default: 0 },
      credited: { type: Boolean, default: false }
    },
 
    // Order Status
    orderStatus: {
      type: String,
      enum: [
        "CREATED",
        "CONFIRMED",
        "ASSIGNED",
        "PICKED_UP",
        "DELIVERED",
        "CANCELLED"
      ],
      default: "CREATED",
      index: true
    },
 
    // Cancellation
    cancelIssue: {
      cancelledBy: {
        type: String,
        enum: ["CUSTOMER", "RIDER", "VENDOR", "ADMIN"]
      },
      reasonCode: String,
      reasonText: String
    },
 
    // ================= PAYMENT (ONLY UPDATED PART) =================
    payment: {
      mode: {
        type: String,
        enum: ["ONLINE", "COD"]
      },

      // ✅ ONLY ADDED FIELD
      codPaymentType: {
        type: String,
        enum: ["CASH", "UPI", "BANK_TRANSFER"],
        default: "CASH"
      },

      status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"]
      },
      transactionId: String
    },
  //     cod: {
  //   amount: {
  //     type: Number,
  //     default: 0
  //   },
  //     pendingAmount: {
  //   type: Number,
  //   default: 0
  // },

      status: {
        type: String,
        enum: ["PENDING", "DEPOSITED"],
        default: "PENDING",
        index: true
      },

  //   status: {
  //     type: String,
  //     enum: ["PENDING", "DEPOSITED","PARTIAL_DEPOSITED"],
  //     default: "PENDING",
  //     index: true
  //   },

  //   collectedAt: {
  //     type: Date
  //   },

  //   depositedAt: {
  //     type: Date
  //   }
  // },
cod: {
    amount: { type: Number, default: 0 },
    depositedAmount: { type: Number, default: 0 },    // NEW
    pendingAmount: { type: Number, default: 0 },      // NEW
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL_DEPOSITED", "DEPOSITED"],
      default: "PENDING",
      index: true
    },
    collectedAt: Date,
    depositedAt: Date
  },

    // Tracking summary
    tracking: {
      distanceInKm: Number,
      durationInMin: Number
    },
 
    allocation: {
      candidateRiders: [
        {
          riderId: { type: Schema.Types.ObjectId, ref: "Rider" },
          status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED", "TIMEOUT"],
            default: "PENDING"
          },
          notifiedAt: Date
        }
      ],
      assignedAt: Date,
      expiresAt: Date
    },
 
    // Settlement flags
    settlement: {
      riderEarningAdded: { type: Boolean, default: false },
      vendorSettled: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);
 
 
module.exports = mongoose.model(
  "Order",
  OrderSchema,
  "order"
);
