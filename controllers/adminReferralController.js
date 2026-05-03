const prisma = require("../config/prisma");

exports.createReferralConfig = async (req, res) => {
  try {
    const {
      name,
      description,
      programType,
      trackingType,
      ruleType,
      validFrom,
      validTill,
      validityDays,
      isActive,
      weekStartDay,
      referralConfig,
      targetOrders,
      slabs,
      tasks
    } = req.body;

    if (!name || !programType || !trackingType || !ruleType) {
      return res.status(400).json({
        success: false,
        message: "name, programType, trackingType and ruleType are required"
      });
    }

    if (programType === "REFERRAL") {
      if (!validFrom || !validTill) {
        return res.status(400).json({
          success: false,
          message: "validFrom and validTill are required for referral program"
        });
      }

      const newValidFrom = new Date(validFrom);
      const newValidTill = new Date(validTill);

      const existingProgram = await prisma.program.findFirst({
        where: {
          programType: "REFERRAL",
          isActive: true,
          OR: [
            {
              validFrom: {
                lte: newValidTill
              },
              validTill: {
                gte: newValidFrom
              }
            }
          ]
        }
      });

      if (existingProgram) {
        return res.status(409).json({
          success: false,
          message:
            "Referral program already exists in this period. You can update the existing program within this period.",
          data: {
            existingProgramId: existingProgram.id,
            existingProgramName: existingProgram.name,
            validFrom: existingProgram.validFrom,
            validTill: existingProgram.validTill
          }
        });
      }
    }

    const program = await prisma.program.create({
      data: {
        name,
        description: description || null,

        programType,
        trackingType,
        ruleType,

        applicableWhen:
          programType === "REFERRAL"
            ? "WITH_REFERRAL"
            : "WITHOUT_REFERRAL",

        validFrom: validFrom ? new Date(validFrom) : null,
        validTill: validTill ? new Date(validTill) : null,
        validityDays: validityDays ? Number(validityDays) : null,

        daysOfWeek: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        weekStartDay: weekStartDay || "MON",

        isActive: isActive ?? true,
        priority: 1,

        referralConfig:
          programType === "REFERRAL" && referralConfig
            ? {
                create: {
                  rewardFlow: referralConfig.rewardFlow || "BOTH",
                  maxReferralsPerUser:
                    referralConfig.maxReferralsPerUser !== undefined
                      ? Number(referralConfig.maxReferralsPerUser)
                      : null,
                  maxEarningPerUser:
                    referralConfig.maxEarningPerUser !== undefined
                      ? Number(referralConfig.maxEarningPerUser)
                      : null
                }
              }
            : undefined,

        targets:
          targetOrders !== undefined && targetOrders !== null
            ? {
                create: {
                  targetOrders: Number(targetOrders),
                  rewardAmount: 0
                }
              }
            : undefined,

        slabs:
          Array.isArray(slabs) && slabs.length > 0
            ? {
                create: slabs.map((slab) => ({
                  role: slab.role,
                  minValue: Number(slab.minValue),
                  maxValue:
                    slab.maxValue !== undefined && slab.maxValue !== null
                      ? Number(slab.maxValue)
                      : null,
                  rewardAmount: Number(slab.rewardAmount)
                }))
              }
            : undefined,

        tasks:
          Array.isArray(tasks) && tasks.length > 0
            ? {
                create: tasks.map((task) => ({
                  role: task.role || "REFEREE",
                  dayNumber:
                    task.dayNumber !== undefined && task.dayNumber !== null
                      ? Number(task.dayNumber)
                      : null,
                  minOrders: Number(task.minOrders),
                  rewardAmount: Number(task.rewardAmount)
                }))
              }
            : undefined
      },
      include: {
        referralConfig: true,
        targets: true,
        slabs: true,
        tasks: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Program config created successfully",
      data: program
    });
  } catch (error) {
    console.error("Create program config error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.updateReferralConfig = async (req, res) => {
  try {
    const { programId } = req.params;

    const {
      name,
      description,
      trackingType,
      ruleType,
      validFrom,
      validTill,
      isActive,
      weekStartDay,

      cityId,
      pincodeIds,

      referralConfig,
      targetOrders,
      slabs,
      tasks
    } = req.body;

    const existingProgram = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!existingProgram) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    const today = new Date();

    if (
      existingProgram.validFrom &&
      existingProgram.validTill &&
      today < existingProgram.validFrom
    ) {
      return res.status(400).json({
        success: false,
        message: "You can update only within the active program period"
      });
    }

    if (
      existingProgram.validFrom &&
      existingProgram.validTill &&
      today > existingProgram.validTill
    ) {
      return res.status(400).json({
        success: false,
        message: "Program period expired. You cannot update this program"
      });
    }

    await prisma.program.update({
      where: { id: programId },
      data: {
        name: name || existingProgram.name,
        description: description ?? existingProgram.description,

        trackingType: trackingType || existingProgram.trackingType,
        ruleType: ruleType || existingProgram.ruleType,

        validFrom: validFrom ? new Date(validFrom) : existingProgram.validFrom,
        validTill: validTill ? new Date(validTill) : existingProgram.validTill,

        isActive: isActive ?? existingProgram.isActive,
        weekStartDay: weekStartDay || existingProgram.weekStartDay,

        cityId: Array.isArray(cityId) ? cityId : existingProgram.cityId,
        pincodeIds: Array.isArray(pincodeIds)
          ? pincodeIds
          : existingProgram.pincodeIds,

        referralConfig: referralConfig
          ? {
              update: {
                rewardFlow:
                  referralConfig.rewardFlow ||
                  existingProgram.rewardFlow,

                maxReferralsPerUser:
                  referralConfig.maxReferralsPerUser !== undefined
                    ? Number(referralConfig.maxReferralsPerUser)
                    : undefined,

                maxEarningPerUser:
                  referralConfig.maxEarningPerUser !== undefined
                    ? Number(referralConfig.maxEarningPerUser)
                    : undefined
              }
            }
          : undefined
      }
    });

    if (targetOrders !== undefined) {
      await prisma.programTarget.updateMany({
        where: { programId },
        data: {
          targetOrders: Number(targetOrders)
        }
      });
    }

    if (Array.isArray(slabs)) {
      await prisma.programSlab.deleteMany({
        where: { programId }
      });

      await prisma.programSlab.createMany({
        data: slabs.map((slab) => ({
          programId,
          role: slab.role,
          minValue: Number(slab.minValue),
          maxValue:
            slab.maxValue !== undefined && slab.maxValue !== null
              ? Number(slab.maxValue)
              : null,
          rewardAmount: Number(slab.rewardAmount)
        }))
      });
    }

    if (Array.isArray(tasks)) {
      await prisma.programTask.deleteMany({
        where: { programId }
      });

      await prisma.programTask.createMany({
        data: tasks.map((task) => ({
          programId,
          role: task.role || "REFEREE",
          dayNumber:
            task.dayNumber !== undefined && task.dayNumber !== null
              ? Number(task.dayNumber)
              : null,
          minOrders: Number(task.minOrders),
          rewardAmount: Number(task.rewardAmount)
        }))
      });
    }

    const finalProgram = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        referralConfig: true,
        targets: true,
        slabs: true,
        tasks: true
      }
    });

    return res.status(200).json({
      success: true,
      message: "Referral config updated successfully",
      data: finalProgram
    });
  } catch (error) {
    console.error("Update referral config error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
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
exports.getReferralProgramByRiderPincode = async (req, res) => {
  try {
    const { riderId } = req.params;

    const riderLocation = await prisma.riderLocation.findUnique({
      where: { riderId }
    });

    if (!riderLocation || !riderLocation.pincode) {
      return res.status(404).json({
        success: false,
        message: "Rider pincode not found"
      });
    }

    const riderPincode = String(riderLocation.pincode).trim();
    const today = new Date();

    const allPrograms = await prisma.program.findMany({
      where: {
        programType: "REFERRAL"
      },
      include: {
        referralConfig: true,
        targets: true,
        slabs: true,
        tasks: true
      }
    });

    const matchedPrograms = allPrograms.filter((program) => {
      const programPincodes = Array.isArray(program.pincodeIds)
        ? program.pincodeIds.map((pin) => String(pin).trim())
        : [];

      const isActiveMatched = program.isActive === true;

      const dateMatched =
        program.validFrom &&
        program.validTill &&
        program.validFrom <= today &&
        program.validTill >= today;

      const pincodeMatched = programPincodes.includes(riderPincode);

      return isActiveMatched && dateMatched && pincodeMatched;
    });

    return res.status(200).json({
      success: true,
      message: "Referral programs fetched successfully",
      riderPincode,
      today,
      totalPrograms: matchedPrograms.length,
      debug: allPrograms.map((program) => ({
        programId: program.id,
        name: program.name,
        isActive: program.isActive,
        validFrom: program.validFrom,
        validTill: program.validTill,
        pincodeIds: program.pincodeIds,
        pincodeMatched: program.pincodeIds
          ?.map((pin) => String(pin).trim())
          .includes(riderPincode),
        dateMatched:
          program.validFrom <= today && program.validTill >= today
      })),
      data: matchedPrograms
    });
  } catch (error) {
    console.error("Get referral program error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};