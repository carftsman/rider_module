const prisma = require("../config/prisma");

const getRiderHomeBanners = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        bankDetails: true,
        kitAddress: true,
        profile: true
      }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    // ✅ Bank banner condition
    const bankAdded =
      !!rider.bankDetails?.accountNumber &&
      !!rider.bankDetails?.ifscCode;

    const bankVerified =
      rider.bankDetails?.bankVerificationStatus === "VERIFIED";

    const showBankBanner = !bankAdded || !bankVerified;

    // ✅ Kit delivered condition
    const deliveredKitRequests = await prisma.assetRequest.findMany({
      where: {
        riderId,
        status: "COMPLETED",
        Shipment: {
          deliveryStatus: "DELIVERED"
        }
      },
      include: {
        Shipment: true
      }
    });

    const kitDelivered =
      rider.kitAddress?.onboardingKitStatus === true ||
      deliveredKitRequests.length > 0;

    const showKitBanner = !kitDelivered;

    // ✅ Joining bonus only for riders joined with referral code
    const joinedWithReferral = !!rider.referredByPartnerId;

    const joiningBonusPayout = await prisma.programPayout.findFirst({
      where: {
        riderId,
        triggerType: "PROGRAM_COMPLETION"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const joiningBonusCompleted = !!joiningBonusPayout;

    const showJoiningBonusBanner =
      joinedWithReferral && !joiningBonusCompleted;

    const banners = [
      {
        key: "ADD_BANK_DETAILS",
        title: "Add Bank Details",
        description: "Add your bank details to receive payouts directly.",
        imageUrl: null,
        redirectTo: "BANK_DETAILS",
        isEnabled: showBankBanner,
        status: showBankBanner ? "PENDING" : "COMPLETED"
      },
      {
        key: "WELCOME_KIT",
        title: "Welcome Kit",
        description: "Get your joining kit and start delivering.",
        imageUrl: null,
        redirectTo: "WELCOME_KIT",
        isEnabled: showKitBanner,
        status: showKitBanner ? "PENDING" : "COMPLETED"
      },
      {
        key: "JOINING_BONUS",
        title: "Joining Bonus",
        description: "Complete your joining bonus tasks and earn rewards.",
        imageUrl: null,
        redirectTo: "JOINING_BONUS",
        isEnabled: showJoiningBonusBanner,
        status: showJoiningBonusBanner ? "ACTIVE" : "DISABLED"
      },
      {
        key: "REFER_AND_EARN",
        title: "Refer and Earn",
        description: "Refer riders and earn rewards.",
        imageUrl: null,
        redirectTo: "REFER_AND_EARN",
        isEnabled: true,
        status: "ACTIVE"
      }
    ];

    return res.status(200).json({
      success: true,
      message: "Home banners fetched successfully",
      data: {
        riderId,
        checks: {
          bankAdded,
          bankVerified,
          kitDelivered,
          joinedWithReferral,
          joiningBonusCompleted
        },
        banners
      }
    });
  } catch (error) {
    console.error("Get Rider Home Banners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getRiderHomeBanners
};