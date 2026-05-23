const cron =
require("node-cron");

const prisma =
require("../config/prisma");

//////////////////////////////////////////////////////
// PEAK SLOT SETTLEMENT
//////////////////////////////////////////////////////

cron.schedule("* * * * *", async () => {

  try {

    console.log(
      "Running peak slot settlement..."
    );

    const now = new Date();
const indiaTime =
  new Date(
    now.toLocaleString(
      "en-US",
      {
        timeZone:
          "Asia/Kolkata"
      }
    )
  );

const currentMinutes =
  indiaTime.getHours() * 60 +
  indiaTime.getMinutes();

    //////////////////////////////////////////////////
    // FIND SLOT PROGRESSES
    //////////////////////////////////////////////////

    const progresses =
      await prisma.programProgress.findMany({

      where: {

  slotId: {
    not: null
  },

  achieved: false,

  rewardAmount: {
    gt: 0
  }
},

        include: {

          program: {
            include: {
              slots: {
                include: {
                  slabs: true
                }
              }
            }
          }
        }
      });

    //////////////////////////////////////////////////
    // LOOP
    //////////////////////////////////////////////////

    for (const progress of progresses) {

      const slot =
        progress.program.slots.find(
          s => s.id === progress.slotId
        );

      if (!slot) {
        continue;
      }

      ////////////////////////////////////////////////
      // SLOT STILL RUNNING
      ////////////////////////////////////////////////

      if (
        currentMinutes <
        slot.endMinutes
      ) {
        continue;
      }

      ////////////////////////////////////////////////
      // DUPLICATE CHECK
      ////////////////////////////////////////////////

      const existingPayout =
        await prisma.programPayout.findFirst({

          where: {

            riderId:
              progress.riderId,

            programId:
              progress.programId,

            referenceId:
              progress.id
          }
        });

      if (existingPayout) {
        continue;
      }

      ////////////////////////////////////////////////
      // FINAL REWARD
      ////////////////////////////////////////////////

      const finalReward =
        progress.rewardAmount;

      if (finalReward <= 0) {
        continue;
      }

      ////////////////////////////////////////////////
      // WALLET CREDIT
      ////////////////////////////////////////////////

      await prisma.riderWallet.upsert({

        where: {
          riderId:
            progress.riderId
        },

        update: {

          balance: {
            increment:
              finalReward
          },

          totalEarned: {
            increment:
              finalReward
          }
        },

        create: {

          riderId:
            progress.riderId,

          balance:
            finalReward,

          totalEarned:
            finalReward
        }
      });
//////////////////////////////////////////////////
// WALLET TRANSACTION ENTRY
//////////////////////////////////////////////////

await prisma.riderWalletTransaction.create({

  data: {

    riderId:
      progress.riderId,

    type:
      "INCENTIVE",

    amount:
      finalReward,

    description:
      "Peak slot incentive credited",

    referenceId:
      progress.id
  }
});
      ////////////////////////////////////////////////
      // PAYOUT ENTRY
      ////////////////////////////////////////////////

      await prisma.programPayout.create({

        data: {

          riderId:
            progress.riderId,

          programId:
            progress.programId,

          amount:
            finalReward,

          status:
            "CREDITED",

          creditedAt:
            new Date(),

          referenceId:
            progress.id,

          triggerType:
            "PROGRAM_COMPLETION"
        }
      });

      ////////////////////////////////////////////////
      // FINAL ACHIEVED
      ////////////////////////////////////////////////

      await prisma.programProgress.update({

        where: {
          id: progress.id
        },

        data: {
          achieved: true
        }
      });

      console.log(
        `Peak slot settled: ${progress.id}`
      );
    }

  } catch (error) {

    console.log(
      "Peak settlement error:",
      error
    );
  }
});

//////////////////////////////////////////////////////
// DAILY SETTLEMENT
//////////////////////////////////////////////////////
cron.schedule("59 23 * * *", async () => {

  try {

    console.log(
      "Running daily settlement..."
    );

    const progresses =
      await prisma.programProgress.findMany({

        where: {

          achieved: false,

          rewardAmount: {
            gt: 0
          },

          program: {

            trackingType:
              "DAILY"
          }
        },

        include: {
          program: true
        }
      });

    for (const progress of progresses) {

      //////////////////////////////////////////
      // DUPLICATE CHECK
      //////////////////////////////////////////

      const existingPayout =
        await prisma.programPayout.findFirst({

          where: {

            riderId:
              progress.riderId,

            programId:
              progress.programId,

            referenceId:
              progress.id
          }
        });

      if (existingPayout) {
        continue;
      }

      const finalReward =
        progress.rewardAmount;

      //////////////////////////////////////////
      // WALLET
      //////////////////////////////////////////

      await prisma.riderWallet.upsert({

        where: {
          riderId:
            progress.riderId
        },

        update: {

          balance: {
            increment:
              finalReward
          },

          totalEarned: {
            increment:
              finalReward
          }
        },

        create: {

          riderId:
            progress.riderId,

          balance:
            finalReward,

          totalEarned:
            finalReward
        }
      });

      //////////////////////////////////////////
      // WALLET TRANSACTION
      //////////////////////////////////////////

      await prisma.riderWalletTransaction.create({

        data: {

          riderId:
            progress.riderId,

          type:
            "INCENTIVE",

          amount:
            finalReward,

          description:
            "Daily incentive credited",

          referenceId:
            progress.id
        }
      });

      //////////////////////////////////////////
      // PAYOUT
      //////////////////////////////////////////

      await prisma.programPayout.create({

        data: {

          riderId:
            progress.riderId,

          programId:
            progress.programId,

          amount:
            finalReward,

          status:
            "CREDITED",

          creditedAt:
            new Date(),

          referenceId:
            progress.id,

          triggerType:
            "PROGRAM_COMPLETION"
        }
      });

      //////////////////////////////////////////
      // ACHIEVED
      //////////////////////////////////////////

      await prisma.programProgress.update({

        where: {
          id: progress.id
        },

        data: {
          achieved: true
        }
      });
    }

  } catch (error) {

    console.log(
      "Daily settlement error:",
      error
    );
  }
});

//////////////////////////////////////////////////////
// WEEKLY SETTLEMENT
//////////////////////////////////////////////////////

cron.schedule("59 23 * * 0", async () => {

  try {

    console.log(
      "Running weekly settlement..."
    );

    const progresses =
      await prisma.programProgress.findMany({

        where: {

          achieved: false,

          rewardAmount: {
            gt: 0
          },

          program: {

            trackingType:
              "WEEKLY"
          }
        },

        include: {
          program: true
        }
      });

    for (const progress of progresses) {

      //////////////////////////////////////////
      // DUPLICATE CHECK
      //////////////////////////////////////////

      const existingPayout =
        await prisma.programPayout.findFirst({

          where: {

            riderId:
              progress.riderId,

            programId:
              progress.programId,

            referenceId:
              progress.id
          }
        });

      if (existingPayout) {
        continue;
      }

      const finalReward =
        progress.rewardAmount;

      //////////////////////////////////////////
      // WALLET
      //////////////////////////////////////////

      await prisma.riderWallet.upsert({

        where: {
          riderId:
            progress.riderId
        },

        update: {

          balance: {
            increment:
              finalReward
          },

          totalEarned: {
            increment:
              finalReward
          }
        },

        create: {

          riderId:
            progress.riderId,

          balance:
            finalReward,

          totalEarned:
            finalReward
        }
      });

      //////////////////////////////////////////
      // WALLET TRANSACTION
      //////////////////////////////////////////

      await prisma.riderWalletTransaction.create({

        data: {

          riderId:
            progress.riderId,

          type:
            "INCENTIVE",

          amount:
            finalReward,

          description:
            "Weekly incentive credited",

          referenceId:
            progress.id
        }
      });

      //////////////////////////////////////////
      // PAYOUT
      //////////////////////////////////////////

      await prisma.programPayout.create({

        data: {

          riderId:
            progress.riderId,

          programId:
            progress.programId,

          amount:
            finalReward,

          status:
            "CREDITED",

          creditedAt:
            new Date(),

          referenceId:
            progress.id,

          triggerType:
            "PROGRAM_COMPLETION"
        }
      });

      //////////////////////////////////////////
      // ACHIEVED
      //////////////////////////////////////////

      await prisma.programProgress.update({

        where: {
          id: progress.id
        },

        data: {
          achieved: true
        }
      });
    }

  } catch (error) {

    console.log(
      "Weekly settlement error:",
      error
    );
  }
});