const prisma = require("../config/prisma");

exports.createProgram = async (req, res) => {
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
      cityId,
      pincodeIds
    } = req.body;

    // -----------------------------
    // ✅ VALIDATIONS
    // -----------------------------
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Program name is required"
      });
    }

    if (!programType) {
      return res.status(400).json({
        success: false,
        message: "programType is required"
      });
    }

    if (!trackingType) {
      return res.status(400).json({
        success: false,
        message: "trackingType is required"
      });
    }

    if (!ruleType) {
      return res.status(400).json({
        success: false,
        message: "ruleType is required"
      });
    }

    if (!validFrom || !validTill) {
      return res.status(400).json({
        success: false,
        message: "validFrom and validTill are required"
      });
    }

    if (!validityDays || validityDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "validityDays must be greater than 0"
      });
    }

    if (!Array.isArray(cityId) || cityId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "cityId must be a non-empty array"
      });
    }

    if (!Array.isArray(pincodeIds) || pincodeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "pincodeIds must be a non-empty array"
      });
    }

    const startDate = new Date(validFrom);
    const endDate = new Date(validTill);

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "validFrom cannot be greater than validTill"
      });
    }

    // -----------------------------
    // ✅ CHECK DUPLICATE PROGRAM
    // -----------------------------
    const existing = await prisma.program.findFirst({
      where: {
        name,
        programType,
        isActive: true
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Program with same name already exists"
      });
    }

    // -----------------------------
    // ✅ CREATE PROGRAM
    // -----------------------------
    const program = await prisma.program.create({
      data: {
        name,
        description,
        programType,
        trackingType,
        ruleType,
        validFrom: startDate,
        validTill: endDate,
        validityDays,
        cityId,
        pincodeIds
      }
    });

    return res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: program
    });

  } catch (error) {
    console.error("Create Program Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.createProgramTask = async (req, res) => {
  try {
    const {
      programId,
      dayNumber,
      taskType,
      minOrders,
      minAcceptanceRate,
      minPeakSlots,
      minEarnings,
      rewardAmount
    } = req.body;

    // ----------------------------
    // BASIC VALIDATION
    // ----------------------------
    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "programId is required"
      });
    }

    if (!dayNumber || dayNumber < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid dayNumber is required"
      });
    }

    if (!taskType) {
      return res.status(400).json({
        success: false,
        message: "taskType is required"
      });
    }

    if (!rewardAmount) {
      return res.status(400).json({
        success: false,
        message: "rewardAmount is required"
      });
    }

    // ----------------------------
    // TASK TYPE BASED VALIDATION 🔥
    // ----------------------------
    if (taskType === "ORDERS" && !minOrders) {
      return res.status(400).json({
        success: false,
        message: "minOrders is required for ORDERS task"
      });
    }

    if (taskType === "ACCEPTANCE_RATE" && !minAcceptanceRate) {
      return res.status(400).json({
        success: false,
        message: "minAcceptanceRate is required for ACCEPTANCE_RATE task"
      });
    }

    if (taskType === "PEAK_SLOTS" && !minPeakSlots) {
      return res.status(400).json({
        success: false,
        message: "minPeakSlots is required for PEAK_SLOTS task"
      });
    }

    if (taskType === "EARNINGS" && !minEarnings) {
      return res.status(400).json({
        success: false,
        message: "minEarnings is required for EARNINGS task"
      });
    }

    // ----------------------------
    // CHECK PROGRAM EXISTS
    // ----------------------------
    const program = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }
    if (program.validityDays && dayNumber > program.validityDays) {
        return res.status(400).json({
            success: false,
            message: `Day ${dayNumber} exceeds program limit of ${program.validityDays} days`
        });
    }

    // ----------------------------
    // DUPLICATE DAY CHECK
    // ----------------------------
    const existingTask = await prisma.programTask.findFirst({
      where: {
        programId,
        dayNumber
      }
    });

    if (existingTask) {
      return res.status(400).json({
        success: false,
        message: `Task already exists for Day ${dayNumber}`
      });
    }

    // ----------------------------
    // CREATE TASK
    // ----------------------------
    const task = await prisma.programTask.create({
      data: {
        programId,
        dayNumber,
        taskType,
        minOrders: taskType === "ORDERS" ? minOrders : null,
        minAcceptanceRate:
          taskType === "ACCEPTANCE_RATE" ? minAcceptanceRate : null,
        minPeakSlots:
          taskType === "PEAK_SLOTS" ? minPeakSlots : null,
        minEarnings:
          taskType === "EARNINGS" ? minEarnings : null,
        rewardAmount
      }
    });

    return res.status(201).json({
      success: true,
      message: "Program task created successfully",
      data: task
    });

  } catch (error) {
    console.error("Create Program Task Error:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Duplicate day task not allowed"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


exports.getProgramTasks = async (req, res) => {
  try {
    const { programId } = req.query;

    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "programId is required"
      });
    }

    const tasks = await prisma.programTask.findMany({
      where: { programId },
      orderBy: { dayNumber: "asc" }
    });

    if (!tasks.length) {
      return res.json({
        success: true,
        message: "No tasks found",
        count: 0,
        data: []
      });
    }

    return res.json({
      success: true,
      message: "Program tasks fetched",
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error("Get Program Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// Get All Programs// GET /api/admin/programs

exports.getAllPrograms = async (req, res) => {
  try {
    const { isActive, programType } = req.query;

    if (!isActive || !programType) {
      return res.status(400).json({
        success: false,
        message: "isActive and programType is required"
      });
    }

    const programs = await prisma.program.findMany({
      where: {
        ...(isActive !== undefined && { isActive: isActive === "true" }),
        ...(programType && { programType })
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      success: true,
      count: programs.length,
      data: programs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// GET /api/admin/programs/:programId  = Get Single Program (with tasks)
exports.getProgramById = async (req, res) => {
  try {
    const { programId } = req.params;

    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "programId is required"
      });
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        tasks: true,
        slabs: true,
        rules: true
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    return res.json({ success: true, data: program });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// PUT /api/admin/programs/:programId    Update Program


exports.updateProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const { name, validFrom, validTill, cityId, pincodeIds } = req.body;

    // ----------------------------
    // FETCH PROGRAM
    // ----------------------------
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { tasks: true }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    const now = new Date();

    // ----------------------------
    // BLOCK IF ALREADY STARTED
    // ----------------------------
    if (now >= program.validFrom) {
      return res.status(400).json({
        success: false,
        message: "Cannot update active or started program"
      });
    }

    // ----------------------------
    // PREPARE UPDATED VALUES
    // ----------------------------
    const newValidFrom = validFrom ? new Date(validFrom) : program.validFrom;
    const newValidTill = validTill ? new Date(validTill) : program.validTill;

    // ----------------------------
    // DATE VALIDATION
    // ----------------------------
    if (newValidFrom >= newValidTill) {
      return res.status(400).json({
        success: false,
        message: "validFrom must be less than validTill"
      });
    }

    // ----------------------------
    // TASK vs VALIDITY CHECK
    // ----------------------------
    if (program.validityDays && program.tasks.length > 0) {
      const maxDay = Math.max(...program.tasks.map(t => t.dayNumber || 0));

      if (maxDay > program.validityDays) {
        return res.status(400).json({
          success: false,
          message: `Existing tasks exceed program validityDays (${program.validityDays})`
        });
      }
    }

    // ----------------------------
    // EMPTY ARRAY PROTECTION
    // ----------------------------
    if (cityId && cityId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "cityId cannot be empty"
      });
    }

    if (pincodeIds && pincodeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "pincodeIds cannot be empty"
      });
    }

    // ----------------------------
    // CONFLICT CHECK (IMPORTANT)
    // ----------------------------
    const conflict = await prisma.program.findFirst({
      where: {
        id: { not: programId },
        isActive: true,
        cityId: { hasSome: cityId || program.cityId },
        pincodeIds: { hasSome: pincodeIds || program.pincodeIds },
        OR: [
          {
            validFrom: { lte: newValidTill },
            validTill: { gte: newValidFrom }
          }
        ]
      }
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "Another program exists with overlapping dates for same city/pincode"
      });
    }

    // ----------------------------
    // UPDATE PROGRAM
    // ----------------------------
    const updated = await prisma.program.update({
      where: { id: programId },
      data: {
        name: name ?? undefined,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validTill: validTill ? new Date(validTill) : undefined,
        cityId: cityId ?? undefined,
        pincodeIds: pincodeIds ?? undefined
      }
    });

    return res.json({
      success: true,
      message: "Program updated successfully",
      data: updated
    });

  } catch (err) {
    console.error("Update Program Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// PATCH /api/admin/programs/:programId/status   Activate / Deactivate
exports.toggleProgramStatus = async (req, res) => {
  try {
    const { programId } = req.params;
    const { isActive } = req.body;

    // ----------------------------
    // VALIDATE INPUT
    // ----------------------------
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false"
      });
    }

    // ----------------------------
    // FETCH PROGRAM WITH TASKS
    // ----------------------------
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { tasks: true }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    // ----------------------------
    // NO CHANGE CHECK
    // ----------------------------
    if (program.isActive === isActive) {
      return res.status(400).json({
        success: false,
        message: `Program already ${isActive ? "active" : "inactive"}`
      });
    }

    const now = new Date();

    // ============================
    // ACTIVATE LOGIC
    // ============================
    if (isActive) {
      // ❌ Expired program
      if (now > program.validTill) {
        return res.status(400).json({
          success: false,
          message: "Cannot activate expired program"
        });
      }

      // ❌ Invalid date range
      if (program.validFrom >= program.validTill) {
        return res.status(400).json({
          success: false,
          message: "Invalid program date range"
        });
      }

      // ❌ No tasks
      if (!program.tasks || program.tasks.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot activate program without tasks"
        });
      }

      // ❌ Missing days config
      if (!program.validityDays) {
        return res.status(400).json({
          success: false,
          message: "validityDays is required"
        });
      }

      // ❌ Conflict check
      const conflict = await prisma.program.findFirst({
        where: {
          id: { not: programId },
          isActive: true,
          cityId: { hasSome: program.cityId },
          pincodeIds: { hasSome: program.pincodeIds },
          validFrom: { lte: program.validTill },
          validTill: { gte: program.validFrom }
        }
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "Another active program overlaps in same location & date"
        });
      }
    }

    // ============================
    // DEACTIVATE LOGIC
    // ============================
    if (!isActive) {
      // ⚠️ Optional: block if already started
      if (now >= program.validFrom && now <= program.validTill) {
        return res.status(400).json({
          success: false,
          message: "Cannot deactivate running program"
        });
      }
    }

    // ----------------------------
    // UPDATE STATUS
    // ----------------------------
    const updated = await prisma.program.update({
      where: { id: programId },
      data: { isActive }
    });

    return res.json({
      success: true,
      message: `Program ${isActive ? "activated" : "deactivated"} successfully`,
      data: updated
    });

  } catch (err) {
    console.error("Toggle Program Status Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET /api/admin/programs/:programId/tasks   Get Tasks of Program

exports.getTasks = async (req, res) => {
  try {
    const { programId } = req.params;

    // ----------------------------
    // VALIDATION
    // ----------------------------
    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "programId is required"
      });
    }

    // ----------------------------
    // CHECK PROGRAM EXISTS
    // ----------------------------
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: {
        id: true,
        validityDays: true,
        isActive: true
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    // ----------------------------
    // FETCH TASKS
    // ----------------------------
    const tasks = await prisma.programTask.findMany({
      where: { programId },
      orderBy: { dayNumber: "asc" }
    });

    // ----------------------------
    // EDGE CASES
    // ----------------------------

    // 1️⃣ No tasks created
    if (!tasks.length) {
      return res.status(200).json({
        success: true,
        message: "No tasks found for this program",
        count: 0,
        data: []
      });
    }

    // 2️⃣ Validate tasks exceeding validityDays (data inconsistency check)
    const invalidTasks = tasks.filter(
      t => program.validityDays && t.dayNumber > program.validityDays
    );

    if (invalidTasks.length > 0) {
      console.warn("⚠️ Invalid tasks found (dayNumber > validityDays)", invalidTasks);
    }

    // 3️⃣ Duplicate dayNumber check (extra safety)
    const daySet = new Set();
    const duplicateDays = [];

    tasks.forEach(t => {
      if (daySet.has(t.dayNumber)) {
        duplicateDays.push(t.dayNumber);
      } else {
        daySet.add(t.dayNumber);
      }
    });

    if (duplicateDays.length > 0) {
      console.warn("⚠️ Duplicate day tasks found:", duplicateDays);
    }

    // ----------------------------
    // RESPONSE
    // ----------------------------
    return res.status(200).json({
      success: true,
      count: tasks.length,
      programMeta: {
        validityDays: program.validityDays,
        isActive: program.isActive
      },
      data: tasks
    });

  } catch (error) {
    console.error("Get Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// PUT /api/admin/tasks/:taskId   Update Task

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const {
      dayNumber,
      taskType,
      minOrders,
      minAcceptanceRate,
      minPeakSlots,
      minEarnings,
      rewardAmount
    } = req.body;

    // ----------------------------
    // VALIDATION: taskId
    // ----------------------------
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "taskId is required"
      });
    }

    // ----------------------------
    // CHECK TASK EXISTS
    // ----------------------------
    const task = await prisma.programTask.findUnique({
      where: { id: taskId },
      include: { program: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const program = task.program;

    // ----------------------------
    // BLOCK UPDATE IF PROGRAM STARTED
    // ----------------------------
    if (new Date() >= program.validFrom) {
      return res.status(400).json({
        success: false,
        message: "Cannot update task after program started"
      });
    }

    // ----------------------------
    // VALIDATE dayNumber
    // ----------------------------
    if (dayNumber !== undefined) {
      if (dayNumber < 1) {
        return res.status(400).json({
          success: false,
          message: "dayNumber must be >= 1"
        });
      }

      if (program.validityDays && dayNumber > program.validityDays) {
        return res.status(400).json({
          success: false,
          message: `dayNumber cannot exceed program validityDays (${program.validityDays})`
        });
      }

      // Duplicate check
      const duplicate = await prisma.programTask.findFirst({
        where: {
          programId: program.id,
          dayNumber,
          NOT: { id: taskId }
        }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Task already exists for Day ${dayNumber}`
        });
      }
    }

    // ----------------------------
    // VALIDATE reward
    // ----------------------------
    if (rewardAmount !== undefined && rewardAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "rewardAmount must be greater than 0"
      });
    }

    // ----------------------------
    // VALIDATE TASK TYPE CONDITIONS
    // ----------------------------
    if (taskType) {
      const allowedTypes = ["ORDERS", "ACCEPTANCE_RATE", "PEAK_SLOTS", "EARNINGS"];

      if (!allowedTypes.includes(taskType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid taskType"
        });
      }
    }

    // At least one condition check
    const hasCondition =
      minOrders !== undefined ||
      minAcceptanceRate !== undefined ||
      minPeakSlots !== undefined ||
      minEarnings !== undefined;

    if (!hasCondition) {
      return res.status(400).json({
        success: false,
        message: "At least one condition must be provided"
      });
    }

    // ----------------------------
    // BUILD SAFE UPDATE OBJECT
    // ----------------------------
    const updateData = {};

    if (dayNumber !== undefined) updateData.dayNumber = dayNumber;
    if (taskType !== undefined) updateData.taskType = taskType;
    if (minOrders !== undefined) updateData.minOrders = minOrders;
    if (minAcceptanceRate !== undefined) updateData.minAcceptanceRate = minAcceptanceRate;
    if (minPeakSlots !== undefined) updateData.minPeakSlots = minPeakSlots;
    if (minEarnings !== undefined) updateData.minEarnings = minEarnings;
    if (rewardAmount !== undefined) updateData.rewardAmount = rewardAmount;

    // ----------------------------
    // UPDATE TASK
    // ----------------------------
    const updated = await prisma.programTask.update({
      where: { id: taskId },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updated
    });

  } catch (error) {
    console.error("Update Task Error:", error);

    // Prisma unique constraint
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Duplicate day task not allowed"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// DELETE /api/admin/tasks/:taskId  Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // ----------------------------
    // VALIDATION
    // ----------------------------
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "taskId is required"
      });
    }

    // ----------------------------
    // CHECK TASK EXISTS
    // ----------------------------
    const task = await prisma.programTask.findUnique({
      where: { id: taskId },
      include: { program: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const program = task.program;

    // ----------------------------
    // BLOCK DELETE IF PROGRAM STARTED
    // ----------------------------
    if (new Date() >= program.validFrom) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete task after program started"
      });
    }

    // ----------------------------
    // CHECK TASK PROGRESS (CRITICAL FIX)
    // ----------------------------
    const taskProgress = await prisma.programTaskProgress.findFirst({
      where: {
        taskId: taskId
      }
    });

    if (taskProgress) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete task, riders already started this task"
      });
    }

    // ----------------------------
    // OPTIONAL: CHECK PROGRAM PROGRESS
    // ----------------------------
    const programProgress = await prisma.programProgress.findFirst({
      where: {
        programId: program.id
      }
    });

    if (programProgress) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete task, program already in progress"
      });
    }

    // ----------------------------
    // DELETE TASK
    // ----------------------------
    await prisma.programTask.delete({
      where: { id: taskId }
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {
    console.error("Delete Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// GET /api/admin/programs/:programId/riders  Get Riders in Program

exports.getProgramRiders = async (req, res) => {
  try {
    const { programId } = req.params;

    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // ----------------------------
    // VALIDATION
    // ----------------------------
    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "programId is required"
      });
    }

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values"
      });
    }

    // ----------------------------
    // CHECK PROGRAM EXISTS
    // ----------------------------
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: {
        id: true,
        name: true,
        isActive: true,
        validFrom: true,
        validTill: true
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    // ----------------------------
    // FILTER BUILD
    // ----------------------------
    const whereClause = {
      programId
    };

    if (status) {
      const allowedStatus = ["ACTIVE", "COMPLETED", "EXPIRED"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter"
        });
      }
      whereClause.status = status;
    }

    // ----------------------------
    // FETCH DATA
    // ----------------------------
    const [total, enrollments] = await Promise.all([
      prisma.programEnrollment.count({ where: whereClause }),

      prisma.programEnrollment.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { enrolledAt: "desc" },
        include: {
          rider: {
            select: {
              id: true,
              phoneNumber: true,
              isOnline: true,
              isFullyRegistered: true
            }
          }
        }
      })
    ]);

    // ----------------------------
    // EDGE CASE: NO RIDERS
    // ----------------------------
    if (!enrollments.length) {
      return res.status(200).json({
        success: true,
        message: "No riders found for this program",
        count: 0,
        data: []
      });
    }

    // ----------------------------
    // RESPONSE
    // ----------------------------
    return res.status(200).json({
      success: true,
      count: total,
      page,
      limit,
      programMeta: {
        name: program.name,
        isActive: program.isActive,
        validFrom: program.validFrom,
        validTill: program.validTill
      },
      data: enrollments
    });

  } catch (error) {
    console.error("Get Program Riders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET /api/admin/programs/:programId/riders/:riderId    Get Rider Progress

exports.getRiderProgress = async (req, res) => {
  try {
    const { programId, riderId } = req.params;

    // ----------------------------
    // VALIDATION
    // ----------------------------
    if (!programId || !riderId) {
      return res.status(400).json({
        success: false,
        message: "programId and riderId are required"
      });
    }

    // ----------------------------
    // CHECK PROGRAM EXISTS
    // ----------------------------
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: {
        id: true,
        name: true,
        validityDays: true,
        validFrom: true,
        validTill: true
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    // ----------------------------
    // CHECK ENROLLMENT
    // ----------------------------
    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        riderId_programId: {
          riderId,
          programId
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Rider not enrolled in this program"
      });
    }

    // ----------------------------
    // GET ALL TASKS
    // ----------------------------
    const tasks = await prisma.programTask.findMany({
      where: { programId },
      orderBy: { dayNumber: "asc" }
    });

    // ----------------------------
    // GET TASK PROGRESS
    // ----------------------------
    const taskProgress = await prisma.programTaskProgress.findMany({
      where: { programId, riderId }
    });

    // Map progress by taskId
    const progressMap = {};
    taskProgress.forEach(p => {
      progressMap[p.taskId] = p;
    });

    // ----------------------------
    // MERGE TASK + PROGRESS
    // ----------------------------
    const taskStatus = tasks.map(task => {
      const progress = progressMap[task.id];

      return {
        taskId: task.id,
        dayNumber: task.dayNumber,
        taskType: task.taskType,
        conditions: {
          minOrders: task.minOrders,
          minAcceptanceRate: task.minAcceptanceRate,
          minPeakSlots: task.minPeakSlots,
          minEarnings: task.minEarnings
        },
        rewardAmount: task.rewardAmount,

        // PROGRESS
        isCompleted: progress?.isCompleted || false,
        progressValue: progress?.progressValue || 0,
        completedAt: progress?.completedAt || null
      };
    });

    // ----------------------------
    // OVERALL PROGRAM PROGRESS
    // ----------------------------
    const overall = await prisma.programProgress.findFirst({
      where: { programId, riderId }
    });

    // ----------------------------
    // CALCULATE SUMMARY
    // ----------------------------
    const completedTasks = taskStatus.filter(t => t.isCompleted).length;
    const totalTasks = taskStatus.length;

    const totalRewardEarned = taskStatus
      .filter(t => t.isCompleted)
      .reduce((sum, t) => sum + t.rewardAmount, 0);

    // ----------------------------
    // RESPONSE
    // ----------------------------
    return res.status(200).json({
      success: true,
      data: {
        program: {
          id: program.id,
          name: program.name,
          validityDays: program.validityDays,
          validFrom: program.validFrom,
          validTill: program.validTill
        },
        enrollment: {
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          expiresAt: enrollment.expiresAt
        },
        summary: {
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
          totalRewardEarned
        },
        tasks: taskStatus,
        overallProgress: overall || null
      }
    });

  } catch (error) {
    console.error("Get Rider Progress Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};