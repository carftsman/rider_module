const prisma = require("../config/prisma");

// helper
function getWeekKey(date = new Date()) {
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const week = Math.ceil(
    (((date - oneJan) / 86400000) + oneJan.getDay() + 1) / 7
  );
  return `${year}-W${week}`;
}

// ================= MAIN API =================

exports.processOrderIncentive = async (req, res) => {
  try {
    const { riderId, orderId } = req.body;

    if (!riderId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "riderId and orderId are required"
      });
    }

    ////////////////////////////////////////////////////////
    // 1️⃣ Prevent duplicate processing
    ////////////////////////////////////////////////////////
    const existing = await prisma.processedOrder.findUnique({
      where: { orderId }
    });

    if (existing) {
      return res.json({
        success: true,
        message: "Order already processed"
      });
    }

    ////////////////////////////////////////////////////////
    // 2️⃣ Validate order
    ////////////////////////////////////////////////////////
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.status !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Invalid or undelivered order"
      });
    }

    ////////////////////////////////////////////////////////
    // 3️⃣ Rider location
    ////////////////////////////////////////////////////////
    const riderLocation = await prisma.riderLocation.findUnique({
      where: { riderId }
    });

    if (!riderLocation?.pincode) {
      return res.json({ success: true, message: "No pincode found" });
    }

    ////////////////////////////////////////////////////////
    // 4️⃣ Active programs
    ////////////////////////////////////////////////////////
    const today = new Date();

    const programs = await prisma.program.findMany({
      where: {
        programType: "INCENTIVE",
        trackingType: "WEEKLY",
        isActive: true,
        pincodeIds: {
          has: riderLocation.pincode
        },
        validFrom: { lte: today },
        validTill: { gte: today }
      },
      include: {
        slabs: true,
        targets: true,
        rules: true,
        consistency: true
      }
    });

    const week = getWeekKey();

    ////////////////////////////////////////////////////////
    // 5️⃣ PROCESS PROGRAMS
    ////////////////////////////////////////////////////////
    for (const program of programs) {

      // 🔹 get or create progress
      let progress = await prisma.programProgress.findFirst({
        where: {
          riderId,
          programId: program.id,
          week
        }
      });

      if (!progress) {
        progress = await prisma.programProgress.create({
          data: {
            riderId,
            programId: program.id,
            week,
            totalOrders: 0,
            totalEarnings: 0,
            achieved: false,
            rewardAmount: 0
          }
        });
      }

      // 🔹 update progress
      progress = await prisma.programProgress.update({
        where: { id: progress.id },
        data: {
          totalOrders: { increment: 1 },
          totalEarnings: { increment: order.amount }
        }
      });

      ////////////////////////////////////////////////////
      // 6️⃣ CHECK ELIGIBILITY
      ////////////////////////////////////////////////////
      let reward = 0;

      // SLAB
      if (program.ruleType === "SLAB") {
        const slab = program.slabs.find(s =>
          progress.totalOrders >= s.minValue &&
          progress.totalOrders <= s.maxValue
        );
        if (slab) reward = slab.rewardAmount;
      }

      // FIXED TARGET
      if (program.ruleType === "FIXED_TARGET") {
        const t = program.targets?.[0];
        if (t && progress.totalOrders >= t.targetOrders) {
          reward = t.rewardAmount;
        }
      }

      // HYBRID
      if (program.ruleType === "HYBRID") {
        const r = program.rules?.[0];
        if (
          r &&
          progress.totalOrders >= r.minOrders &&
          progress.totalEarnings >= r.minEarnings
        ) {
          reward = program.maxPayoutPerWeek || 0;
        }
      }

      ////////////////////////////////////////////////////
      // 7️⃣ UNLOCK REWARD
      ////////////////////////////////////////////////////
      if (reward > 0 && !progress.achieved) {

        await prisma.programProgress.update({
          where: { id: progress.id },
          data: {
            achieved: true,
            rewardAmount: reward
          }
        });

        //////////////////////////////////////////////////
        // 8️⃣ CREDIT WALLET
        //////////////////////////////////////////////////
        await prisma.wallet.create({
          data: {
            riderId,
            amount: reward,
            type: "INCENTIVE",
            referenceId: program.id
          }
        });
      }
    }

    ////////////////////////////////////////////////////////
    // MARK ORDER PROCESSED
    ////////////////////////////////////////////////////////
    await prisma.processedOrder.create({
      data: { orderId }
    });

    return res.json({
      success: true,
      message: "Incentive processed successfully"
    });

  } catch (error) {
    console.error("Process incentive error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process incentive"
    });
  }
};