const IncentivePayoutSchema = new Schema(
  {
    incentiveId: { type: Schema.Types.ObjectId, ref: "Incentive" },
    riderId: { type: Schema.Types.ObjectId, ref: "Rider" },
 
    earnedAmount: Number,
 
    payoutStatus: {
      type: String,
      enum: ["PENDING", "CREDITED"]
    },
 
    creditedAt: Date
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("IncentivePayout", IncentivePayoutSchema);