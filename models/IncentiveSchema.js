const mongoose=require('mongoose');

const {Schema}=mongoose;


// const IncentiveSchema = new Schema(
//   {
//     title: String,
//     description: String,
 
//     incentiveType: {
//       type: String,
//       enum: ["PEAK_HOUR", "DAILY_EARNING", "WEEKLY_EARNING"]
//     },
 
//     rewardType: {
//       type: String,
//       enum: ["FIXED_AMOUNT", "PER_ORDER", "PERCENTAGE"]
//     },
 
//     rewardValue: Number,
 
//     condition: {
//       minOrders: Number,
//       minEarning: Number,
//       startTime: String,
//       endTime: String
//     },
 
//     maxRewardPerRider: Number,
 
//     status: { type: String, enum: ["ACTIVE", "INACTIVE"] }
//   },
//   { timestamps: true }
// );
 
// module.exports = mongoose.model("Incentive", IncentiveSchema);


const IncentiveSchema = new Schema(

{

  title: String,

  description: String,
 
  incentiveType: {

    type: String,

    enum: ["PEAK_SLOT", "DAILY_TARGET", "WEEKLY_TARGET"],

    required: true

  },
 
  applicableSlots: {

    peak: { type: Boolean, default: false },

    normal: { type: Boolean, default: false }

  },
 
  slotRules: {

    minPeakSlots: Number,      // eg: 2

    minNormalSlots: Number     // eg: 3

  },
 
  slabs: [

    {

      // minOrders: Number,       // eg: 10

      // maxOrders: Number,       // eg: 12

      // rewardAmount: Number     // eg: 100
peak: [
      {
        minOrders: { type: Number, required: true },
        maxOrders: { type: Number, required: true },
        rewardAmount: { type: Number, required: true }
      }
    ],

    normal: [
      {
        minOrders: { type: Number, required: true },
        maxOrders: { type: Number, required: true },
        rewardAmount: { type: Number, required: true }
      }
    ]
    }

  ],
 
  payoutTiming: {

    type: String,

    enum: ["INSTANT", "POST_SLOT", "DAILY", "WEEKLY"],

    default: "POST_SLOT"

  },
 
  maxRewardPerDay: Number,

  maxRewardPerWeek: Number,
  
  weeklyRules: {
    totalDaysInWeek: {
      type: Number,
      default: 7
    },
    minOrdersPerDay: {
      type: Number // eg: 10
    },
    allowPartialDays: {
      type: Boolean,
      default: true
    }
  },
 
  status: {

    type: String,

    enum: ["ACTIVE", "INACTIVE"],

    default: "ACTIVE"

  }
 
},

{ timestamps: true }

);
 
module.exports = mongoose.model("Incentive", IncentiveSchema);

 