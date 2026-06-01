const referralService =
  require("../services/referral.service");

exports.getReferralPrograms =
async (req, res) => {

  try {

    const riderId =
      req.rider?.id;

    const data =
      await referralService
        .getReferralPrograms(
          riderId
        );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.getReferralProgramsProgress =
async (req, res) => {

  try {

    const riderId =
      req.rider?.id;

    const data =
      await referralService
        .getReferralProgramsProgress(
          riderId
        );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.getReferrerList = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

    const REFERRAL_AMOUNT = 500;

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        profile: true
      }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    if (!rider.partnerId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID not found"
      });
    }

    const referredRiders = await prisma.rider.findMany({
      where: {
        referredByPartnerId: rider.partnerId
      },
      include: {
        profile: true,
        location: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const referredCount = referredRiders.length;

    const eligibleCount = referredRiders.filter(
      rider => rider.isFullyRegistered
    ).length;

    const totalEarnings = eligibleCount * REFERRAL_AMOUNT;

    return res.status(200).json({
      success: true,
      message: "Referral list fetched successfully",
      data: {
        partnerId: rider.partnerId,
        referralAmountPerRider: REFERRAL_AMOUNT,
        referredCount,
        eligibleCount,
        totalEarnings,
        referredRiders: referredRiders.map(ref => ({
          riderId: ref.id,
          name: ref.profile?.fullName || null,
          phoneNumber: ref.phoneNumber,
          area: ref.location?.area || null,
          isFullyRegistered: ref.isFullyRegistered,
          earningStatus: ref.isFullyRegistered
            ? "EARNED"
            : "PENDING",
          earningAmount: ref.isFullyRegistered
            ? REFERRAL_AMOUNT
            : 0,
          joinedAt: ref.createdAt
        }))
      }
    });

  } catch (error) {
    console.error("Referral List Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};