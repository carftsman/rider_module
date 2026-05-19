const { generatePartnerId } = require("../utils/generatePartnerId");
const prisma = require("../config/prisma"); // adjust path

exports.ensurePartnerId = async (riderId) => {
  // Get rider with onboarding relation
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: {
      onboarding: true
    }
  });

  if (!rider) return null;

  const kycCompleted = rider?.onboarding?.kycCompleted === true;

  console.log("ensurePartnerId → kycCompleted:", kycCompleted);
  console.log("ensurePartnerId → existing partnerId:", rider.partnerId);

  // If KYC done and no partnerId → generate
  if (kycCompleted && !rider.partnerId) {

    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        partnerId: generatePartnerId(), // PIDxxxxx
        isPartnerActive: true
      }
    });

    console.log("partnerId generated:", updatedRider.partnerId);
    return updatedRider;
  }

  return rider;
};
