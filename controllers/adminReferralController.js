const prisma = require("../config/prisma");

exports.createReferralConfig = async (req, res) => {
  try {
    const {
      title,
      description,
      referralRewardAmount,
      joiningBonusAmount,
      targetOrderCount,
      rewardFlow,
      validFrom,
      validTill
    } = req.body;

    const program = await prisma.program.create({
      data: {
        name: title,
        description,

        programType: "REFERRAL",
        applicableWhen: "WITH_REFERRAL",
        trackingType: "MONTHLY",
        ruleType: "FIXED_TARGET",

        validFrom: new Date(validFrom),
        validTill: new Date(validTill),

        daysOfWeek: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],

        isActive: true,
        priority: 1,

        referralConfig: {
          create: {
            rewardFlow: rewardFlow || "BOTH"
          }
        },

        targets: {
          create: {
            targetOrders: Number(targetOrderCount),
            rewardAmount: Number(referralRewardAmount)
          }
        },

        tasks: {
          create: {
            role: "REFEREE",
            minOrders: Number(targetOrderCount),
            rewardAmount: Number(joiningBonusAmount)
          }
        }
      },
      include: {
        referralConfig: true,
        targets: true,
        tasks: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Referral config created successfully",
      data: {
        programId: program.id,
        referralConfigId: program.referralConfig.id,
        title: program.name,
        description: program.description,
        referralRewardAmount: program.targets[0].rewardAmount,
        joiningBonusAmount: program.tasks[0].rewardAmount,
        targetOrderCount: program.targets[0].targetOrders,
        rewardFlow: program.referralConfig.rewardFlow,
        validFrom: program.validFrom,
        validTill: program.validTill,
        isActive: program.isActive
      }
    });
  } catch (error) {
    console.error("Create referral config error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// controllers/adminReferralController.js

exports.getAllReferralConfigs = async (req, res) => {
  try {
    const programs = await prisma.program.findMany({
      where: {
        programType: "REFERRAL"
      },
      include: {
        referralConfig: true,
        targets: true,
        tasks: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      data: programs.map((program) => ({
        id: program.referralConfig?.id,
        programId: program.id,
        title: program.name,
        description: program.description,
        targetOrderCount: program.targets[0]?.targetOrders || 0,
        referralRewardAmount: program.targets[0]?.rewardAmount || 0,
        joiningBonusAmount: program.tasks[0]?.rewardAmount || 0,
        rewardFlow: program.referralConfig?.rewardFlow,
        validFrom: program.validFrom,
        validTill: program.validTill,
        isActive: program.isActive
      }))
    });
  } catch (error) {
    console.error("Get referral configs error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// controllers/adminReferralController.js

exports.updateReferralConfigStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false"
      });
    }

    const existingConfig = await prisma.referralConfig.findUnique({
      where: { id },
      include: {
        program: true
      }
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Referral config not found"
      });
    }

    await prisma.program.update({
      where: {
        id: existingConfig.programId
      },
      data: {
        isActive: isActive
      }
    });

    return res.status(200).json({
      success: true,
      message: "Referral config status updated successfully"
    });
  } catch (error) {
    console.error("Update referral config status error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// controllers/adminReferralController.js

exports.getAllReferrals = async (req, res) => {
  try {
    const { status } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const referrals = await prisma.referral.findMany({
      skip,
      take: limit,
      include: {
        program: {
          include: {
            targets: true,
            tasks: true
          }
        },
        referrer: {
          select: {
            id: true,
            partnerId: true,
            phoneNumber: true
          }
        },
        referee: {
          select: {
            id: true,
            phoneNumber: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const formattedData = referrals.map((referral) => {
      let referralStatus = "TARGET_IN_PROGRESS";

      if (referral.isCompleted && !referral.rewardGiven) {
        referralStatus = "TARGET_ACHIEVED";
      }

      if (referral.rewardGiven) {
        referralStatus = "REWARD_CREDITED";
      }

      return {
        id: referral.id,
        referrerRiderId: referral.referrerId,
        referredRiderId: referral.refereeId,
        referralCode: referral.referralCode,

        completedOrderCount: referral.totalOrders,
        targetOrderCount: referral.targetOrders,

        referralRewardAmount: referral.program.targets[0]?.rewardAmount || 0,
        joiningBonusAmount: referral.program.tasks[0]?.rewardAmount || 0,

        status: referralStatus
      };
    });

    const filteredData = status
      ? formattedData.filter((item) => item.status === status)
      : formattedData;

    const totalCount = filteredData.length;

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalCount,
      data: filteredData
    });
  } catch (error) {
    console.error("Get all referrals error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// controllers/adminReferralController.js

exports.creditReferralReward = async (req, res) => {
    
  try {
    const { id } = req.params;

    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        program: {
          include: {
            targets: true
          }
        }
      }
    });
    console.log(referral);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral record not found"
      });
    }

    if (referral.rewardGiven) {
      return res.status(400).json({
        success: false,
        message: "Referral reward already credited"
      });
    }

    const rewardAmount =
      referral.program.targets[0]?.rewardAmount || 0;

    if (rewardAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid reward amount"
      });
    }

    await prisma.$transaction(async (tx) => {
      // wallet create if not exists
      const wallet = await tx.riderWallet.upsert({
        where: {
          riderId: referral.referrerId
        },
        update: {
          balance: { increment: rewardAmount },
          totalEarned: { increment: rewardAmount }
        },
        create: {
          riderId: referral.referrerId,
          balance: rewardAmount,
          totalEarned: rewardAmount,
          totalWithdrawn: 0
        }
      });

      // payout history
      await tx.programPayout.create({
        data: {
          riderId: referral.referrerId,
          programId: referral.programId,
          amount: rewardAmount,
          status: "CREDITED",
          creditedAt: new Date()
        }
      });

      // referral update
      await tx.referral.update({
        where: { id },
        data: {
          rewardGiven: true,
          rewardGivenAt: new Date(),
          isCompleted: true,
          completedAt: new Date()
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: "Referral reward credited successfully",
      data: {
        creditedToRiderId: referral.referrerId,
        amount: rewardAmount,
        status: "REWARD_CREDITED"
      }
    });
  } catch (error) {
    console.error("Credit referral reward error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};