const prisma = require("../config/prisma");
exports.getReferralProgress = async (req, res) => {
  try {
    const { riderId } = req.params;

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
        message: "Rider does not have partnerId"
      });
    }

    const targetOrders = 10;
    const rewardAmount = 500;

    const referredRiders = await prisma.rider.findMany({
      where: {
        referredByPartnerId: rider.partnerId
      },
      include: {
        profile: true
      }
    });

    const referrals = referredRiders.map((referee) => {
      const ordersCompleted = referee.totalOrdersCompleted || 0;
      const targetReached = ordersCompleted >= targetOrders;

      return {
        newRiderId: referee.id,
        newRiderName: referee.profile?.fullName || null,
        newRiderPartnerId: referee.partnerId || null,
        usedReferralCode: referee.referredByPartnerId,

        ordersCompleted,
        targetOrders,

        targetStatus: targetReached ? "TARGET_REACHED" : "TARGET_PENDING",
        remainingOrders: targetReached ? 0 : targetOrders - ordersCompleted,

        rewardAmount,
        rewardEarned: targetReached ? rewardAmount : 0
      };
    });

    const targetReachedCount = referrals.filter(
      item => item.targetStatus === "TARGET_REACHED"
    ).length;

    const totalEarnings = referrals.reduce(
      (sum, item) => sum + item.rewardEarned,
      0
    );

    return res.status(200).json({
      success: true,
      message: "Referral progress fetched successfully",

      referrer: {
        riderId: rider.id,
        partnerId: rider.partnerId,
        name: rider.profile?.fullName || null
      },

      summary: {
        totalRidersOnboarded: referrals.length,
        targetReachedRiders: targetReachedCount,
        targetPendingRiders: referrals.length - targetReachedCount,
        totalEarnings
      },

      referredRiders: referrals
    });

  } catch (error) {
    console.error("Referral Progress Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};