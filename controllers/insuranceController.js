// controllers/insuranceController.js
const InsurancePolicy = require("../models/InsurancePolicy");
const InsuranceClaim = require("../models/InsuranceClaim");

exports.getInsuranceDetails = async (req, res) => {
  try {
    const riderId = req.rider._id; // from auth middleware

    // 1️⃣ Fetch active policy
    const policy = await InsurancePolicy.findOne({
      riderId,
      policyStatus: "ACTIVE"
    }).lean();

    if (!policy) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    // 2️⃣ Fetch claim history
    const claims = await InsuranceClaim.find({
      riderId,
      policyId: policy.policyId
    })
      .sort({ createdAt: -1 })
      .lean();

    // 3️⃣ Format claims for response
    const formattedClaims = claims.map(c => ({
      claimId: c.claimId,
      insuranceType: c.insuranceType,
      incidentDate: c.incidentDate,
      orderId: c.orderId,
      status: c.status,
      claimedAmount: c.claimedAmount,
      approvedAmount: c.approvedAmount,
      rejectionReason: c.rejectionReason,
      settledOn: c.settledOn
    }));

    // 4️⃣ Final response
    return res.status(200).json({
      success: true,
      data: {
        policyStatus: policy.policyStatus,
        policyId: policy.policyId,

        policyProvider: policy.policyProvider,

        policyDuration: {
          startDate: policy.policyDuration?.startDate,
          endDate: policy.policyDuration?.endDate
        },

        coveragePeriod: policy.coveragePeriod,
        insuranceType: policy.insuranceType,
        coverages: policy.coverages,

        claimHistory: {
          hasPreviousClaims: formattedClaims.length > 0,
          totalClaims: formattedClaims.length,
          claims: formattedClaims
        }
      }
    });

  } catch (error) {
    console.error("Insurance Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch insurance details"
    });
  }
};
