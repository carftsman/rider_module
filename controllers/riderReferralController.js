const prisma = require("../config/prisma");

exports.getReferralProgress = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    const {
      status = "all", // all | pending | completed
      fromDate,
      toDate
    } = req.query;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

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

    // ✅ Get active referral program created by admin
const now = new Date();

const program = await prisma.program.findFirst({
  where: {
    programType: "REFERRAL",
    isActive: true,

    validFrom: {
      lte: now
    },
    validTill: {
      gte: now
    }
  },
  include: {
    targets: true,
    tasks: true,
    slabs: true,
    referralConfig: true
  },
  orderBy: {
    createdAt: "desc"
  }
});
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "No active referral program found"
      });
    }

    // ✅ Admin decides these values
    const targetOrders =
      program.targets?.[0]?.targetOrders ||
      program.tasks?.[0]?.minOrders ||
      0;

    const rewardAmount =
      program.targets?.[0]?.rewardAmount ||
      program.tasks?.[0]?.rewardAmount ||
      program.slabs?.[0]?.rewardAmount ||
      0;

    if (!targetOrders || !rewardAmount) {
      return res.status(400).json({
        success: false,
        message: "Referral program targetOrders or rewardAmount not configured properly"
      });
    }

    const completedOrderStatuses = ["DELIVERED"];

    const riderWhere = {
      referredByPartnerId: rider.partnerId
    };

    // ✅ Date filter based on referred rider createdAt
    if (fromDate || toDate) {
      riderWhere.createdAt = {};

      if (fromDate) {
        riderWhere.createdAt.gte = new Date(fromDate);
      }

      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        riderWhere.createdAt.lte = endDate;
      }
    }

    const referredRiders = await prisma.rider.findMany({
      where: riderWhere,
      include: {
        profile: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    let referrals = await Promise.all(
      referredRiders.map(async (referee) => {
        const ordersCompleted = await prisma.order.count({
          where: {
            riderId: referee.id,
            orderStatus: {
              in: completedOrderStatuses
            }
          }
        });

        const targetReached = ordersCompleted >= targetOrders;

        const referredAtIST = referee.createdAt.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata"
        });

        return {
          newRiderId: referee.id,
          newRiderName: referee.profile?.fullName || null,
          newRiderPartnerId: referee.partnerId || null,
          usedReferralCode: referee.referredByPartnerId,

          referredAt: referee.createdAt,
          referredDate: referee.createdAt.toISOString().split("T")[0],
          referredAtIST,

          ordersCompleted,
          targetOrders,

          targetStatus: targetReached ? "TARGET_REACHED" : "TARGET_PENDING",
          remainingOrders: targetReached ? 0 : targetOrders - ordersCompleted,

          rewardAmount,
          rewardEarned: targetReached ? rewardAmount : 0
        };
      })
    );

    // ✅ Status filter
    if (status === "pending") {
      referrals = referrals.filter(
        (item) => item.targetStatus === "TARGET_PENDING"
      );
    }

    if (status === "completed") {
      referrals = referrals.filter(
        (item) => item.targetStatus === "TARGET_REACHED"
      );
    }

    const targetReachedCount = referrals.filter(
      (item) => item.targetStatus === "TARGET_REACHED"
    ).length;

    const totalEarnings = referrals.reduce(
      (sum, item) => sum + item.rewardEarned,
      0
    );

    return res.status(200).json({
      success: true,
      message: "Referral progress fetched successfully",

      filters: {
        status,
        fromDate: fromDate || null,
        toDate: toDate || null
      },

      program: {
        programId: program.id,
        programName: program.name,
        validFrom: program.validFrom,
        validTill: program.validTill
      },

      referrer: {
        riderId: rider.id,
        partnerId: rider.partnerId,
        name: rider.profile?.fullName || null
      },

      summary: {
        referralAmountPerRider: rewardAmount,
        targetOrdersPerRider: targetOrders,
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
exports.getReferralRewards = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: riderId
      },
      include: {
        program: {
          include: {
            targets: true,
            slabs: true
          }
        }
      }
    });

    let earned = 0;
    let pending = 0;

    referrals.forEach((referral) => {
      let rewardAmount = 0;

      if (referral.program?.ruleType === "SLAB") {
        const slab = referral.program.slabs.find((item) => {
          const totalOrders = referral.totalOrders || 0;

          return (
            totalOrders >= item.minValue &&
            (item.maxValue === null || totalOrders <= item.maxValue)
          );
        });

        rewardAmount = slab?.rewardAmount || 0;
      } else {
        rewardAmount = referral.program?.targets[0]?.rewardAmount || 0;
      }

      if (referral.rewardGiven) {
        earned += rewardAmount;
      } else if (referral.isCompleted) {
        pending += rewardAmount;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        earned,
        pending
      }
    });
  } catch (error) {
    console.error("Get referral rewards error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
exports.getReferralCampaign = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

    const riderLocation = await prisma.riderLocation.findUnique({
      where: {
        riderId
      }
    });

    if (!riderLocation || !riderLocation.pincode) {
      return res.status(404).json({
        success: false,
        message: "Rider pincode not found"
      });
    }

    const riderPincode = String(riderLocation.pincode).trim();
    const today = new Date();

    const programs = await prisma.program.findMany({
      where: {
        programType: "REFERRAL",
        isActive: true,
        validFrom: {
          lte: today
        },
        validTill: {
          gte: today
        }
      },
      include: {
        referralConfig: true,
        targets: true,
        slabs: true,
        tasks: true
      },
      orderBy: {
        priority: "asc"
      }
    });

    const campaign = programs.find((program) => {
      const pincodeIds = Array.isArray(program.pincodeIds)
        ? program.pincodeIds.map((pin) => String(pin).trim())
        : [];

      return pincodeIds.includes(riderPincode);
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "No active referral campaign found for this rider"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        programId: campaign.id,
        name: campaign.name,
        description: campaign.description,
        ruleType: campaign.ruleType,

        targetOrders: campaign.targets[0]?.targetOrders || 0,

        rewardFlow: campaign.referralConfig?.rewardFlow || null,

        slabs: campaign.slabs.map((slab) => ({
          min: slab.minValue,
          max: slab.maxValue,
          reward: slab.rewardAmount
        })),

        tasks: campaign.tasks.map((task) => ({
          role: task.role,
          dayNumber: task.dayNumber,
          minOrders: task.minOrders,
          reward: task.rewardAmount
        })),

        validFrom: campaign.validFrom,
        validTill: campaign.validTill
      }
    });
  } catch (error) {
    console.error("Get referral campaign error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
// controllers/riderReferralController.js


exports.shareReferralByCode = async (req, res) => {
  try {
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "partnerId is required"
      });
    }

    // 🔍 Validate if referral code exists
    const rider = await prisma.rider.findUnique({
      where: { partnerId },
      include: {
        profile: true
      }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code"
      });
    }

    // 📩 Create share message (you can customize)
    const shareMessage = `🚴 Join our platform using my referral code *${partnerId}* and earn rewards!\n\nDownload app: https://yourapp.link/referral?code=${partnerId}`;

    return res.status(200).json({
      success: true,
      message: "Referral code ready to share",
      data: {
        partnerId,
        riderName: rider.profile?.fullName || null,
        shareMessage,
        shareLink: `https://yourapp.link/referral?code=${partnerId}`
      }
    });

  } catch (error) {
    console.error("Share referral error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
// controllers/riderReferralController.js



// controllers/riderReferralController.js


exports.referRider = async (req, res) => {
  try {
    const referrerId = req.rider?.id;

    if (!referrerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

    const { name, phoneNumber, area } = req.body;

    if (!name || !phoneNumber || !area) {
      return res.status(400).json({
        success: false,
        message: "name, phoneNumber and area are required"
      });
    }

    const referrer = await prisma.rider.findUnique({
      where: { id: referrerId }
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Referrer rider not found"
      });
    }

    if (!referrer.partnerId) {
      return res.status(400).json({
        success: false,
        message: "Referrer partnerId not found"
      });
    }

    const existingRider = await prisma.rider.findUnique({
      where: { phoneNumber }
    });

    if (existingRider) {
      return res.status(400).json({
        success: false,
        message: "Rider already exists with this phone number"
      });
    }

    const newRider = await prisma.rider.create({
      data: {
        phoneNumber,
        referredByPartnerId: referrer.partnerId,
        onboardingStage: "PHONE_VERIFICATION",
        isFullyRegistered: false,

        profile: {
          create: {
            fullName: name
          }
        },

        location: {
          create: {
            area
          }
        }
      },
      include: {
        profile: true,
        location: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Rider referred successfully",
      data: {
        referredRiderId: newRider.id,
        name: newRider.profile?.fullName,
        phoneNumber: newRider.phoneNumber,
        area: newRider.location?.area,
        referredByPartnerId: newRider.referredByPartnerId,
        status: "PENDING_ONBOARDING"
      }
    });

  } catch (error) {
    console.error("Refer rider error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
// controllers/riderReferralController.js



exports.getMyReferralSummary = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

    const referralAmountPerRider = 500;

    const referrer = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        profile: true
      }
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    if (!referrer.partnerId) {
      return res.status(400).json({
        success: false,
        message: "PartnerId not found for this rider"
      });
    }

    const referredRiders = await prisma.rider.findMany({
      where: {
        referredByPartnerId: referrer.partnerId
      },
      include: {
        profile: true,
        location: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const totalReferredRiders = referredRiders.length;

    const eligibleRiders = referredRiders.filter(
      rider => rider.isFullyRegistered === true
    );

    const totalEligibleRiders = eligibleRiders.length;

    const totalEarnings = totalEligibleRiders * referralAmountPerRider;

    return res.status(200).json({
      success: true,
      message: "Referral summary fetched successfully",
      data: {
        referrer: {
          riderId: referrer.id,
          name: referrer.profile?.fullName || null,
          partnerId: referrer.partnerId
        },
        referralAmountPerRider,
        totalReferredRiders,
        totalEligibleRiders,
        totalEarnings,
        referredRiders: referredRiders.map(rider => ({
          riderId: rider.id,
          name: rider.profile?.fullName || null,
          phoneNumber: rider.phoneNumber,
          area: rider.location?.area || null,
          isFullyRegistered: rider.isFullyRegistered,
          earningStatus: rider.isFullyRegistered
            ? "EARNED"
            : "PENDING",
          earningAmount: rider.isFullyRegistered
            ? referralAmountPerRider
            : 0
        }))
      }
    });

  } catch (error) {
    console.error("Referral summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
exports.getReferralProgressByNewRider = async (req, res) => {
  try {
    const { newRiderId } = req.params;

    if (!newRiderId) {
      return res.status(400).json({
        success: false,
        message: "newRiderId is required"
      });
    }

    // ✅ Get active referral program created by admin
    const now = new Date();

    const program = await prisma.program.findFirst({
      where: {
        programType: "REFERRAL",
        isActive: true,
        validFrom: {
          lte: now
        },
        validTill: {
          gte: now
        }
      },
      include: {
        targets: true,
        tasks: true,
        slabs: true,
        referralConfig: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "No active referral program found"
      });
    }

    // ✅ Admin configured values
    const targetOrders =
      program.targets?.[0]?.targetOrders ||
      program.tasks?.[0]?.minOrders ||
      0;

    const rewardAmount =
      program.targets?.[0]?.rewardAmount ||
      program.tasks?.[0]?.rewardAmount ||
      program.slabs?.[0]?.rewardAmount ||
      0;

    if (!targetOrders || !rewardAmount) {
      return res.status(400).json({
        success: false,
        message: "Referral program targetOrders or rewardAmount not configured properly"
      });
    }

    const referee = await prisma.rider.findUnique({
      where: { id: newRiderId },
      include: {
        profile: true
      }
    });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message: "Referred rider not found"
      });
    }

    if (!referee.referredByPartnerId) {
      return res.status(400).json({
        success: false,
        message: "This rider was not referred by anyone"
      });
    }

    const ordersCompleted = await prisma.order.count({
      where: {
        riderId: newRiderId,
        orderStatus: "DELIVERED"
      }
    });

    const targetReached = ordersCompleted >= targetOrders;

    const referredAtIST = referee.createdAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata"
    });

    return res.status(200).json({
      success: true,
      message: "New referred rider details fetched successfully",

      program: {
        programId: program.id,
        programName: program.name,
        validFrom: program.validFrom,
        validTill: program.validTill
      },

      data: {
        newRiderId: referee.id,
        newRiderName: referee.profile?.fullName || null,
        newRiderPartnerId: referee.partnerId || null,
        usedReferralCode: referee.referredByPartnerId,

        referredAt: referee.createdAt,
        referredDate: referee.createdAt.toISOString().split("T")[0],
        referredAtIST,

        ordersCompleted,
        targetOrders,

        targetStatus: targetReached ? "TARGET_REACHED" : "TARGET_PENDING",
        remainingOrders: Math.max(targetOrders - ordersCompleted, 0),

        rewardAmount,
        rewardEarned: targetReached ? rewardAmount : 0
      }
    });

  } catch (error) {
    console.error("Referral Progress By New Rider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};