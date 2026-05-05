const prisma = require("../config/prisma");

// Helper
const getStartOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

//Get Available Programs
exports.getAvailablePrograms = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const now = new Date();

    // ----------------------------
    // GET RIDER LOCATION
    // ----------------------------
    const location = await prisma.riderLocation.findUnique({
      where: { riderId }
    });

    if (!location?.city || !location?.pincode) {
      return res.status(400).json({
        success: false,
        message: "Rider location not set"
      });
    }

    // ----------------------------
    // FETCH PROGRAMS
    // ----------------------------
    const programs = await prisma.program.findMany({
      where: {
        isActive: true,
        programType: "JOINING_BONUS",
      },
      orderBy: { priority: "desc" },
      include: {
        tasks: {
        //   take: 2, //preview only (performance)
          orderBy: { dayNumber: "asc" }
        }
      }
    });

    // ----------------------------
    // GET ENROLLMENTS
    // ----------------------------
    const enrollments = await prisma.programEnrollment.findMany({
      where: {
        riderId,
        programId: {
          in: programs.map(p => p.id)
        }
      }
    });

    const enrollmentMap = {};
    enrollments.forEach(e => {
      enrollmentMap[e.programId] = e;
    });

    // ----------------------------
    // FINAL RESPONSE
    // ----------------------------
    const response = programs.map(program => {
      const enrollment = enrollmentMap[program.id];

      return {
        id: program.id,
        name: program.name,
        validityDays: program.validityDays,
        rewardPreview: program.tasks.reduce(
          (sum, t) => sum + t.rewardAmount,
          0
        ),

        isEnrolled: !!enrollment,
        enrollmentStatus: enrollment?.status || null,

        tasksPreview: program.tasks
      };
    });

    return res.status(200).json({
      success: true,
      count: response.length,
      data: response
    });

  } catch (error) {
    console.error("Get Available Programs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// 2️⃣ Get Program Details
exports.getProgramDetails = async (req, res) => {
  try {
    const { programId } = req.params;

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        tasks: { orderBy: { dayNumber: "asc" } }
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    res.json({ success: true, data: program });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// 3️⃣ Join Program (SAFE)
exports.joinProgram = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { programId } = req.params;

    const program = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!program || !program.isActive) {
      return res.status(400).json({
        success: false,
        message: "Program not active"
      });
    }

    const now = new Date();

    if (program.validFrom > now || program.validTill < now) {
      return res.status(400).json({
        success: false,
        message: "Program expired or not started"
      });
    }

    // Prevent duplicate join
    const existing = await prisma.programEnrollment.findUnique({
      where: {
        riderId_programId: {
          riderId,
          programId
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already joined"
      });
    }

    const expiresAt = new Date(now);
    if (program.validityDays) {
      expiresAt.setDate(expiresAt.getDate() + program.validityDays);
    }

    await prisma.programEnrollment.create({
      data: {
        riderId,
        programId,
        expiresAt
      }
    });

    res.json({
      success: true,
      message: "Program joined successfully"
    });

  } catch (err) {
    console.error(err);

    // Unique constraint safe
    if (err.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Already joined"
      });
    }

    res.status(500).json({ success: false });
  }
};


// 4️⃣ My Programs
exports.getMyPrograms = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const programs = await prisma.programEnrollment.findMany({
      where: { riderId },
      include: {
        program: true
      },
      orderBy: { enrolledAt: "desc" }
    });

    res.json({
      success: true,
      count: programs.length,
      data: programs
    });

  } catch {
    res.status(500).json({ success: false });
  }
};


// 5️⃣ Get My Progress
exports.getMyProgress = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { programId } = req.params;

    // ✅ Check enrollment first
    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        riderId_programId: { riderId, programId }
      }
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: "Not enrolled in program"
      });
    }

    // ✅ Fetch progress
    let progress = await prisma.programProgress.findFirst({
      where: { riderId, programId },
      include: {
        program: {
          include: { tasks: true }
        }
      }
    });

    // ✅ If no progress → return default object
    if (!progress) {
      return res.json({
        success: true,
        message: "No progress yet",
        data: {
          riderId,
          programId,
          totalOrders: 0,
          totalEarnings: 0,
          achieved: false,
          tasks: []
        }
      });
    }

    res.json({
      success: true,
      data: progress
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


// 6️⃣ Get Today Task (FIXED LOGIC 🔥)
exports.getTodayTask = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { programId } = req.params;

    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        riderId_programId: { riderId, programId }
      }
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: "Not enrolled"
      });
    }

    const start = new Date(enrollment.enrolledAt);
    const today = new Date();

    const dayNumber = Math.floor(
      (today - start) / (1000 * 60 * 60 * 24)
    ) + 1;

    const task = await prisma.programTask.findFirst({
      where: {
        programId,
        dayNumber
      }
    });

    res.json({
      success: true,
      dayNumber,
      data: task || null
    });

  } catch {
    res.status(500).json({ success: false });
  }
};


