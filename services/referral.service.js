const prisma = require("../config/prisma");
const removeEmptyValues = (obj) => {

  if (!obj || typeof obj !== "object")
    return obj;

  if (Array.isArray(obj)) {

    return obj
      .map((item) =>
        removeEmptyValues(item)
      )
      .filter((item) => {

        if (
          item === null ||
          item === undefined ||
          item === ""
        ) {
          return false;
        }

        if (
          Array.isArray(item) &&
          item.length === 0
        ) {
          return false;
        }

        if (
          typeof item === "object" &&
          !(item instanceof Date) &&
          Object.keys(item).length === 0
        ) {
          return false;
        }

        return true;

      });

  }

  const cleaned = {};

  Object.entries(obj).forEach(
    ([key, value]) => {

      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (
          Array.isArray(value) &&
          value.length === 0
        )
      ) {
        return;
      }

      if (
        typeof value === "object" &&
        !(value instanceof Date)
      ) {

        const nested =
          removeEmptyValues(value);

        if (
          nested &&
          !(
            typeof nested === "object" &&
            !Array.isArray(nested) &&
            Object.keys(nested).length === 0
          )
        ) {
          cleaned[key] = nested;
        }

        return;
      }

      cleaned[key] = value;

    }
  );

  return cleaned;

};
exports.getReferralPrograms =
  async (riderId) => {

    // GET RIDER LOCATION

    const riderLocation =
      await prisma.riderLocation.findUnique({

        where: {
          riderId
        }

      });

    if (!riderLocation?.pincode) {
      return [];
    }

    // GET ACTIVE PROGRAMS
const referral =
  await prisma.referral.findFirst({

    where: {
      refereeId: riderId
    }

  });

if (!referral) {
  return [];
}
    const programs =
      await prisma.program.findMany({

        where: {

          programType: "REFERRAL",

          isActive: true,

          validFrom: {
            lte: new Date()
          },

          validTill: {
            gte: new Date()
          },

          pincodeIds: {
            has: String(
              riderLocation.pincode
            )
          }

        },

        include: {
          tasks: true,
          slabs: true,
          targets: true
        },

        orderBy: {
          priority: "asc"
        }

      });

   return programs.map((program) => {

  //////////////////////////////////////////////////
  // COMMON RESPONSE
  //////////////////////////////////////////////////

  const baseResponse = {

    programId: program.id,

    name: program.name,

    description:
      program.description,

    type:
      program.programType,

    trackingType:
      program.trackingType,

    ruleType:
      program.ruleType,

    status:
      program.isActive
        ? "RUNNING"
        : "INACTIVE",

    validFrom:
      program.validFrom,

    validTill:
      program.validTill,

   maxReward:
  calculateProgramMaxReward(
    program
  )
  };

  //////////////////////////////////////////////////
  // FIXED TARGET PROGRAM
  //////////////////////////////////////////////////

  if (
    program.ruleType ===
    "FIXED_TARGET"
  ) {

    return removeEmptyValues({

      ...baseResponse,

      target: {

        orders:
          program.targets?.[0]
            ?.targetOrders
      },

      reward: {

        amount:
          program.targets?.[0]
            ?.rewardAmount
      }

    });

  }

  //////////////////////////////////////////////////
  // NORMAL SLAB PROGRAM
  //////////////////////////////////////////////////

  if (
    program.ruleType ===
    "SLAB"
  ) {

    return removeEmptyValues({

      ...baseResponse,

      slabs:

        program.slabs.map(
          (slab) => ({

            minOrders:
              slab.minOrders,

            maxOrders:
              slab.maxOrders,

            rewardAmount:
              slab.rewardAmount
          })
        )

    });

  }

  //////////////////////////////////////////////////
  // TASK / HYBRID / PER_ORDER
  //////////////////////////////////////////////////

  const groupedTasks =
    Object.values(

      program.tasks.reduce(
        (acc, task) => {

          const key =
            `${task.dayNumber}_${task.taskRuleType}`;

          ////////////////////////////////////////////////
          // CREATE GROUP
          ////////////////////////////////////////////////

          if (!acc[key]) {

            acc[key] = {

              dayNumber:
                task.dayNumber,

              taskRuleType:
                task.taskRuleType
            };
          }

          ////////////////////////////////////////////////
          // SLAB
          ////////////////////////////////////////////////

          if (
            task.taskRuleType ===
            "SLAB"
          ) {

            if (!acc[key].slabs) {
              acc[key].slabs = [];
            }

            acc[key].slabs.push({

              minOrders:
                task.minOrders,

              maxOrders:
                task.maxOrders,

              rewardAmount:
                task.rewardAmount
            });

          }

          ////////////////////////////////////////////////
          // FIXED_TARGET
          ////////////////////////////////////////////////

          else if (
            task.taskRuleType ===
            "FIXED_TARGET"
          ) {

            acc[key].target = {

              orders:
                task.targetOrders
            };

            acc[key].reward = {

              amount:
                task.rewardAmount
            };
          }

          ////////////////////////////////////////////////
          // PER_ORDER
          ////////////////////////////////////////////////

          else if (
            task.taskRuleType ===
            "PER_ORDER"
          ) {

            acc[key].rewardPerOrder =
              task.rewardPerOrder;

            acc[key].maxOrders =
              task.maxOrders;

            acc[key].maxEarning =
              task.maxEarning;
          }

          ////////////////////////////////////////////////
          // HYBRID
          ////////////////////////////////////////////////

          else if (
            task.taskRuleType ===
            "HYBRID"
          ) {

            acc[key].conditions = {

              minOrders:
                task.minOrders,

              minAcceptanceRate:
                task.minAcceptanceRate,

              minEarnings:
                task.minEarnings,

              minCompletionRate:
                task.minCompletionRate
            };

            acc[key].reward = {

              amount:
                task.rewardAmount
            };
          }

          return acc;

        },

        {}
      )

    )

    .sort(
      (a, b) =>
        (a.dayNumber || 0) -
        (b.dayNumber || 0)
    )

    .map(removeEmptyValues);

  //////////////////////////////////////////////////
  // FINAL RESPONSE
  //////////////////////////////////////////////////

  return removeEmptyValues({

    ...baseResponse,

    tasks: groupedTasks
  });

});

  };
exports.getReferralProgramsProgress =
  async (riderId) => {
const referralExists =
  await prisma.referral.findFirst({

    where: {
      refereeId: riderId
    }

  });

if (!referralExists) {
  return [];
}
const riderLocation =
  await prisma.riderLocation.findUnique({

    where: {
      riderId
    }

  });

if (!riderLocation?.pincode) {
  return [];
}
 const referrals =
  await prisma.referral.findMany({

    where: {

      refereeId: riderId,

  program: {

  isActive: true,

  validFrom: {
    lte: new Date()
  },

  validTill: {
    gte: new Date()
  },

  pincodeIds: {
    has: String(
      riderLocation.pincode
    )
  }

}

    },

    include: {

      program: {
        include: {
          tasks: true,
          slabs: true,
          targets: true
        }
      }

    }

  });

    const uniqueProgramsMap =
      new Map();

    for (const ref of referrals) {
     if (
  uniqueProgramsMap.has(
    ref.program.id
  )
) {
  continue;
}

      const groupedTasks = {};

      ref.program.tasks
        .filter(
          (task) =>
            task.taskRuleType === "FIXED_TARGET"
            || task.dayNumber !== null
        )
        .forEach((task) => {

          const key =
            task.dayNumber || "FIXED_TARGET";

          if (!groupedTasks[key]) {
            groupedTasks[key] = [];
          }

          groupedTasks[key].push(task);

        });

      const tasks =
        await Promise.all(

          Object.values(groupedTasks)
            .map(async (slabs) => {

              const firstTask =
                slabs[0];

              //////////////////////////////////////////////////
              // REAL TASK PROGRESS
              //////////////////////////////////////////////////

              const taskProgress =
                await prisma.programTaskProgress
                  .findFirst({

                    where: {

                      riderId,

                      programId:
                        ref.program.id,

                      taskId:
                        firstTask.id
                    }

                  });

              const progress = {

                progressValue:
                  taskProgress
                    ?.progressValue || 0,

                allSlabs: slabs

              };

              return buildTaskProgress(
                firstTask,
                progress
              );

            })

        );

      uniqueProgramsMap.set(
        ref.program.id,
        {

          programId:
            ref.program.id,

          name:
            ref.program.name,

          type:
            ref.program.programType,

          ruleType:
            ref.program.ruleType,

          status:
            ref.isCompleted
              ? "COMPLETED"
              : "RUNNING",

          overallProgress: {

            completedDays:
              tasks.filter(
                (t) =>
                  t.progress?.isCompleted
              ).length,

            totalDays:
              tasks.length

          },

          tasks

        }
      );
    }
    return Array.from(
      uniqueProgramsMap.values()
    );

  };

// ============================================
// GET REFERRER LIST
// ============================================

exports.getReferrerList = async (riderId) => {

  const referrals =
    await prisma.referral.findMany({

      where: {
        referrerId: riderId
      },

      include: {

        referee: {
          include: {
            profile: true
          }
        }

      }

    });

  return {

    summary: {

      totalReferrals:
        referrals.length,

      completedReferrals:
        referrals.filter(
          (r) => r.isCompleted
        ).length,

      activeReferrals:
        referrals.filter(
          (r) => !r.isCompleted
        ).length

    },

    referrals:
      await Promise.all(

        referrals.map(async (ref) => {

          //////////////////////////////////////////////////
          // REAL COMPLETED ORDERS
          //////////////////////////////////////////////////

          let completedOrders = 0;

          if (
            ref.programId
          ) {

          

                completedOrders =
  ref.totalOrders || 0;

          } else {

            completedOrders =
              ref.totalOrders || 0;
          }

          //////////////////////////////////////////////////
          // RESPONSE
          //////////////////////////////////////////////////

          return {

            referralId:
              ref.id,

            referee: {

              riderId:
                ref.referee.id,

              name:
                ref.referee.profile
                  ?.fullName

            },

            status:
              ref.isCompleted
                ? "COMPLETED"
                : "IN_PROGRESS",

            earnedAmount:
              completedOrders * 20,

            remainingAmount:
              Math.max(
                1000 -
                (
                  completedOrders * 20
                ),
                0
              ),

            progressPercentage:
              ref.targetOrders

                ? Math.min(

                  (
                    completedOrders /
                    ref.targetOrders
                  ) * 100,

                  100
                )

                : 0

          };

        })

      )

  };

};

// ============================================
// TASK RULE TYPE ENGINE
// ============================================

function buildTaskProgress(
  task,
  progress
) {

  const completedOrders =
    progress?.progressValue || 0;

  switch (task.taskRuleType) {

    // ========================================
    // SLAB
    // ========================================
    case "SLAB": {

      const slabs =
        progress?.allSlabs || [task];
      const currentSlab =
        slabs.find(
          (slab) =>
            completedOrders <=
            (slab.maxOrders || 0)
        ) || null;

      const currentIndex =
        slabs.findIndex(
          (slab) =>
            completedOrders <=
            (slab.maxOrders || 0)
        );

      const nextSlab =
        currentIndex >= 0 &&
          currentIndex < slabs.length - 1

          ? slabs[currentIndex + 1]

          : null;

      return {

        dayNumber:
          task.dayNumber,

        dayName:
          task.dayNumber
            ? getDayName(task.dayNumber)
            : null,

        taskRuleType:
          task.taskRuleType,

        progress: {

          completedOrders,

          currentSlab: {
            minOrders:
              currentSlab?.minOrders,

            maxOrders:
              currentSlab?.maxOrders,

            rewardAmount:
              currentSlab?.rewardAmount
          },

          nextSlab:
            nextSlab
              ? {
                minOrders:
                  nextSlab.minOrders,

                maxOrders:
                  nextSlab.maxOrders,

                rewardAmount:
                  nextSlab.rewardAmount
              }
              : null,

          remainingOrders:

            completedOrders <
              (currentSlab?.minOrders || 0)

              ? (
                currentSlab.minOrders -
                completedOrders
              )

              : nextSlab

                ? (
                  nextSlab.minOrders -
                  completedOrders
                )

                : 0,

          earnedAmount:
            completedOrders >=
              (
                currentSlab?.minOrders || 0
              )
              ? (
                currentSlab?.rewardAmount || 0
              )
              : 0,

          progressPercentage:
            calculatePercentage(
              completedOrders,
              slabs[
                slabs.length - 1
              ]?.maxOrders
            ),

          status:
            getStatus(
              completedOrders,
              slabs[
                slabs.length - 1
              ]?.maxOrders
            ),

          isCompleted:
            completedOrders >=
            (
              slabs[
                slabs.length - 1
              ]?.maxOrders || 0
            )

        }

      };

    }

    // ========================================
    // PER ORDER
    // ========================================

    case "PER_ORDER":

      return {

        dayNumber:
          task.dayNumber,

        dayName:
          task.dayNumber
            ? getDayName(task.dayNumber)
            : null,

        taskRuleType:
          task.taskRuleType,

        progress: {

          completedOrders,

          earnedAmount:
            completedOrders *
            (
              task.rewardPerOrder
              || 0
            ),

          remainingOrders:
            Math.max(
              (
                task.maxOrders || 0
              ) - completedOrders,
              0
            ),

          remainingAmount:
            Math.max(
              (
                task.maxEarning || 0
              ) -
              (
                completedOrders *
                (
                  task.rewardPerOrder
                  || 0
                )
              ),
              0
            ),

          progressPercentage:
            calculatePercentage(
              completedOrders,
              task.maxOrders
            ),

          status:
            getStatus(
              completedOrders,
              task.maxOrders
            ),

          isCompleted:
            completedOrders >=
            (task.maxOrders || 0)

        }

      };

    // ========================================
    // FIXED TARGET
    // ========================================

    case "FIXED_TARGET":

      return {

        dayNumber:
          task.dayNumber,

        dayName:
          task.dayNumber
            ? getDayName(task.dayNumber)
            : null,

        taskRuleType:
          task.taskRuleType,

        progress: {

          completedOrders,

          targetOrders:
            task.targetOrders,

          remainingOrders:
            Math.max(
              (
                task.targetOrders || 0
              ) - completedOrders,
              0
            ),

          earnedAmount:
            completedOrders >=
              (
                task.targetOrders || 0
              )
              ? task.rewardAmount
              : 0,

          progressPercentage:
            calculatePercentage(
              completedOrders,
              task.targetOrders
            ),

          status:
            getStatus(
              completedOrders,
              task.targetOrders
            ),

          isCompleted:
            completedOrders >=
            (
              task.targetOrders || 0
            )

        }

      };

    // ========================================
    // HYBRID
    // ========================================

    case "HYBRID":

      return {

        dayNumber:
          task.dayNumber,

        dayName:
          task.dayNumber
            ? getDayName(task.dayNumber)
            : null,

        taskRuleType:
          task.taskRuleType,

        progress: {

          completedOrders,

          currentAcceptanceRate: 0,

          currentEarnings: 0,

          remainingEarnings:
            Math.max(
              (
                task.minEarnings || 0
              ) - 1000,
              0
            ),

          progressPercentage:
            calculatePercentage(
              completedOrders,
              task.minOrders
            ),

          status:
            getStatus(
              completedOrders,
              task.minOrders
            ),

          isCompleted:
            completedOrders >=
            (
              task.minOrders || 0
            )

        }

      };

    default:

      return {};

  }

}

// ============================================
// HELPERS
// ============================================

function calculatePercentage(
  value,
  total
) {

  if (!total) return 0;

  return Math.min(
    Math.floor(
      (value / total) * 100
    ),
    100
  );

}

function getStatus(
  value,
  target
) {

  if (!target)
    return "NOT_STARTED";

  if (value <= 0)
    return "NOT_STARTED";

  if (value >= target)
    return "COMPLETED";

  return "RUNNING";

}

function getDayName(day) {

  const days = [
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
    "SUN"
  ];

  return days[day - 1];

}
function calculateProgramMaxReward(
  program
) {

  //////////////////////////////////////////////////
  // FIXED TARGET PROGRAM
  //////////////////////////////////////////////////

  if (
    program.ruleType ===
    "FIXED_TARGET"
  ) {

    return (
      program.targets?.reduce(

        (sum, target) =>
          sum +
          (
            target.rewardAmount || 0
          ),

        0

      ) || 0
    );

  }

  //////////////////////////////////////////////////
  // NORMAL SLAB PROGRAM
  //////////////////////////////////////////////////

  if (
    program.ruleType ===
    "SLAB"
  ) {

    return (
      program.slabs?.reduce(

        (sum, slab) =>
          sum +
          (
            slab.rewardAmount || 0
          ),

        0

      ) || 0
    );

  }

  //////////////////////////////////////////////////
  // TASK PROGRAM
  //////////////////////////////////////////////////

  return (

    program.tasks?.reduce(
      (sum, task) => {

        ////////////////////////////////////////////
        // SLAB TASK
        ////////////////////////////////////////////

        if (
          task.taskRuleType ===
          "SLAB"
        ) {

          return (
            sum +
            (
              task.rewardAmount || 0
            )
          );

        }

        ////////////////////////////////////////////
        // FIXED TARGET / HYBRID
        ////////////////////////////////////////////

        if (
          task.taskRuleType ===
          "FIXED_TARGET"
          ||
          task.taskRuleType ===
          "HYBRID"
        ) {

          return (
            sum +
            (
              task.rewardAmount || 0
            )
          );

        }

        ////////////////////////////////////////////
        // PER ORDER
        ////////////////////////////////////////////

        if (
          task.taskRuleType ===
          "PER_ORDER"
        ) {

          return (
            sum +
            (
              task.maxEarning || 0
            )
          );

        }

        return sum;

      },

      0
    ) || 0

  );

}