const prisma = require("../config/prisma");

function getDateKey(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function getWeekKey(date = new Date()) {
  const year = date.getFullYear();

  const oneJan = new Date(year, 0, 1);

  const week = Math.ceil(
    (((date - oneJan) / 86400000) +
      oneJan.getDay() +
      1) / 7
  );

  return `${year}-W${week}`;
}




exports.processOrderIncentive = async (req, res) => {

  try {

    const { riderId, orderId } = req.body;

    if (!riderId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "riderId and orderId are required"
      });
    }


    const existingProcessed =
      await prisma.processedOrder.findUnique({
        where: { orderId }
      });

    if (existingProcessed) {
      return res.json({
        success: true,
        message: "Order already processed"
      });
    }

    const order = await prisma.order.findUnique({
      where: { orderId },

      include: {
        OrderPricing: true,
        OrderPickupAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }


    if (order.orderStatus !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Order not delivered"
      });
    }


    const riderLocation =
      await prisma.riderLocation.findUnique({
        where: { riderId }
      });

    if (!riderLocation?.pincode) {
      return res.json({
        success: true,
        message: "Rider pincode not found"
      });
    }

const now = new Date();
const currentDay = now
  .toLocaleDateString("en-US", {
    weekday: "short"
  })
  .toUpperCase()
  .slice(0, 3);
const today = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate()
);
    const weekKey = getWeekKey(today);


    const orderAmount =
      order.OrderPricing?.totalAmount || 0;


    const programs = await prisma.program.findMany({
      where: {
        isActive: true,

        validFrom: {
          lte: today
        },

        validTill: {
          gte: today
        },

        OR: [
          {
            pincodeIds: {
              has: riderLocation.pincode
            }
          },

          {
            pincodeIds: {
              isEmpty: true
            }
          }
        ]
      },

      include: {
        slabs: true,
        targets: true,
        rules: true,

        slots: {
          include: {
            slabs: true
          }
        },

        consistency: true,
        referralConfig: true
      }
    });


    for (const program of programs) {
if (
  program.daysOfWeek.length > 0 &&
  !program.daysOfWeek.includes(currentDay)
) {
  continue;
}


    if (
  (
    program.programType === "DAILY_TARGET" &&
    program.trackingType === "DAILY"
  ) ||
  (
    program.programType === "WEEKLY_TARGET" &&
    program.trackingType === "WEEKLY"
  )
)
 {


        const progressWhere = {
          riderId,
          programId: program.id
        };

        if (program.trackingType === "DAILY") {
          progressWhere.date = {
  gte: today,
  lt: new Date(today.getTime() + 86400000)
};
        }

        if (program.trackingType === "WEEKLY") {
          progressWhere.week = weekKey;
        }


        let progress =
          await prisma.programProgress.findFirst({
            where: progressWhere
          });

        if (!progress) {

          const createData = {
            riderId,
            programId: program.id,
            totalOrders: 0,
            totalEarnings: 0,
            achieved: false,
            rewardAmount: 0
          };

          if (program.trackingType === "DAILY") {
            createData.date = today;
          }

          if (program.trackingType === "WEEKLY") {
            createData.week = weekKey;
          }

          progress =
            await prisma.programProgress.create({
              data: createData
            });
        }

        progress =
          await prisma.programProgress.update({
            where: {
              id: progress.id
            },

    data: {
      totalOrders: {
        increment: 1
      },

      totalEarnings: {
        increment: orderAmount
      }
    }
  });


progress =
  await prisma.programProgress.findUnique({
    where: {
      id: progress.id
    }
  });

    

        let reward = 0;


        if (program.ruleType === "SLAB") {

          const updatedOrders =
  Number(progress.totalOrders);
          const slab = program.slabs.find(s =>
            updatedOrders >= s.minValue &&
            updatedOrders <= s.maxValue
          );

          if (slab) {
            reward = slab.rewardAmount;
          }
        }

    
        if (program.ruleType === "FIXED_TARGET") {

          const target = program.targets?.[0];

          if (
            target &&
            progress.totalOrders >= target.targetOrders
          ) {
            reward = target.rewardAmount;
          }
        }


        if (program.ruleType === "HYBRID") {

          const rule = program.rules?.[0];

          if (
            rule &&
            progress.totalOrders >= rule.minOrders &&
            progress.totalEarnings >= rule.minEarnings
          ) {
            reward =
              program.maxPayoutPerWeek || 0;
          }
        }


        if (reward > progress.rewardAmount) {

          const extraReward =
            reward - progress.rewardAmount;


          await prisma.programProgress.update({
            where: {
              id: progress.id
            },

            data: {
              achieved: true,
              rewardAmount: reward
            }
          });

          await prisma.programPayout.create({
            data: {
              riderId,
              programId: program.id,
              amount: extraReward,
              triggerType: "PROGRAM_COMPLETION"
            }
          });


          await prisma.riderWallet.upsert({
            where: { riderId },

            update: {
              balance: {
                increment: extraReward
              },

              totalEarned: {
                increment: extraReward
              }
            },

            create: {
              riderId,
              balance: extraReward,
              totalEarned: extraReward
            }
          });
        }
      }


   if (program.programType === "PEAK_SLOT")
{

        for (const slot of program.slots) {
if (
  slot.daysOfWeek.length > 0 &&
  !slot.daysOfWeek.includes(currentDay)
) {
  continue;
}
        const orderTime =
  new Date(order.updatedAt);

const orderHour =
  orderTime.getHours();
          const startHour =
            Math.floor(slot.startMinutes / 60);

          const endHour =
            Math.floor(slot.endMinutes / 60);

          if (
            orderHour < startHour ||
            orderHour >= endHour
          ) {
            continue;
          }


          let slotProgress =
  await prisma.programProgress.findFirst({
    where: {
      riderId,
      programId: program.id,
      slotId: slot.id,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 86400000)
      }
    }
  });


          if (!slotProgress) {

            slotProgress =
  await prisma.programProgress.create({
    data: {
      riderId,
      programId: program.id,
      slotId: slot.id,
      date: today,
      totalOrders: 0,
      totalEarnings: 0,
      achieved: false,
      rewardAmount: 0
    }
  });
          }


          slotProgress =
            await prisma.programProgress.update({
              where: {
                id: slotProgress.id
              },

              data: {
                totalOrders: {
                  increment: 1
                }
              }
            });


          let peakReward = 0;


          if (slot.ruleType === "PER_ORDER") {

            peakReward =
              slot.rewardPerOrder || 0;
          }

          if (slot.ruleType === "SLAB") {

            const slab = slot.slabs.find(s =>
              slotProgress.totalOrders >= s.minOrders &&
              slotProgress.totalOrders <= s.maxOrders
            );

            if (slab) {
              peakReward = slab.rewardAmount;
            }
          }

          if (peakReward > 0) {

            await prisma.programPayout.create({
              data: {
                riderId,
                programId: program.id,
                amount: peakReward,
                triggerType: "PROGRAM_COMPLETION"
              }
            });

            await prisma.riderWallet.upsert({
              where: { riderId },

              update: {
                balance: {
                  increment: peakReward
                },

                totalEarned: {
                  increment: peakReward
                }
              },

              create: {
                riderId,
                balance: peakReward,
                totalEarned: peakReward
              }
            });
          }
        }
      }

      if (
        program.programType === "REFERRAL"
      ) {

        const referral =
          await prisma.referral.findFirst({
            where: {
              refereeId: riderId,
              programId: program.id
            }
          });

        if (!referral) {
          continue;
        }

        const updatedReferral =
          await prisma.referral.update({
            where: {
              id: referral.id
            },

            data: {
              totalOrders: {
                increment: 1
              }
            }
          });


        if (
          updatedReferral.totalOrders >=
            updatedReferral.targetOrders &&
          !updatedReferral.rewardGiven
        ) {

          const slab = program.slabs?.[0];

          const reward =
            slab?.rewardAmount || 0;

          const existingReferralPayout =
            await prisma.programPayout.findFirst({
              where: {
                riderId:
                  updatedReferral.referrerId,

                programId: program.id,

                triggerType: "PROGRAM_COMPLETION"
              }
            });

          if (existingReferralPayout) {
            continue;
          }


          await prisma.riderWallet.upsert({
            where: {
              riderId:
                updatedReferral.referrerId
            },

            update: {
              balance: {
                increment: reward
              },

              totalEarned: {
                increment: reward
              }
            },

            create: {
              riderId:
                updatedReferral.referrerId,

              balance: reward,
              totalEarned: reward
            }
          });


          await prisma.programPayout.create({
            data: {
              riderId:
                updatedReferral.referrerId,

              programId: program.id,

              amount: reward,

              triggerType: "PROGRAM_COMPLETION"
            }
          });


          await prisma.referral.update({
            where: {
              id: referral.id
            },

            data: {
              rewardGiven: true,
              rewardGivenAt: new Date(),
              isCompleted: true,
              completedAt: new Date()
            }
          });
        }
      }


      if (
        program.programType === "JOINING_BONUS"
      ) {

        const enrollment =
          await prisma.programEnrollment.findFirst({
            where: {
              riderId,
              programId: program.id
            }
          });

        if (!enrollment) {
          continue;
        }


        const existingPayout =
          await prisma.programPayout.findFirst({
            where: {
              riderId,
              programId: program.id,
              triggerType: "PROGRAM_COMPLETION"
            }
          });

        if (existingPayout) {
          continue;
        }


        const target =
          program.targets?.[0];

        if (!target) {
          continue;
        }

        const deliveredOrders =
          await prisma.order.count({
            where: {
              riderId,
              orderStatus: "DELIVERED"
            }
          });

  
        if (
          deliveredOrders >=
          target.targetOrders
        ) {

  
          await prisma.riderWallet.upsert({
            where: { riderId },

            update: {
              balance: {
                increment:
                  target.rewardAmount
              },

              totalEarned: {
                increment:
                  target.rewardAmount
              }
            },

            create: {
              riderId,
              balance:
                target.rewardAmount,

              totalEarned:
                target.rewardAmount
            }
          });


          await prisma.programPayout.create({
            data: {
              riderId,
              programId: program.id,
              amount:
                target.rewardAmount,
              triggerType: "PROGRAM_COMPLETION"
            }
          });
        }
      }
    }

    await prisma.processedOrder.create({
      data: {
        orderId
      }
    });

  
    return res.json({
      success: true,
      message:
        "Incentive processed successfully"
    });

  } catch (error) {

    console.error(
      "Process incentive error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to process incentive"
    });
  }
};