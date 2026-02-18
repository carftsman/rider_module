const Rider = require("../models/RiderModel");
const { generatePartnerId } = require("../utils/generatePartnerId");

exports.ensurePartnerId = async (riderId) => {
  const rider = await Rider.findById(riderId);

  if (!rider) return null;

  const kycCompleted =
    rider?.onboardingProgress?.kycCompleted === true;

  console.log("ensurePartnerId → kycCompleted:", kycCompleted);
  console.log("ensurePartnerId → existing partnerId:", rider.partnerId);

  if (kycCompleted && !rider.partnerId) {
    rider.partnerId = generatePartnerId(); // PIDxxxxx
    rider.isPartnerActive = true;

    await rider.save(); // 🔥 THIS SAVES TO DB

    console.log("partnerId generated:", rider.partnerId);
  }

  return rider;
};
