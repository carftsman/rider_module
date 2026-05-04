//Get Active Joining Bonus Programs

exports.getAvailablePrograms = async (req, res) => {
  try {
    const riderId = req.rider.id;

    // Get rider location
    const location = await prisma.riderLocation.findUnique({
      where: { riderId }
    });

    if (!location?.city || !location?.pincode) {
      return res.status(400).json({
        success: false,
        message: "Rider location not set"
      });
    }

    const today = new Date();

    const programs = await prisma.program.findMany({
      where: {
        isActive: true,
        programType: "JOINING_BONUS",
        validFrom: { lte: today },
        validTill: { gte: today },
        cityId: { has: location.city },
        pincodeIds: { has: location.pincode }
      }
    });

    res.json({
      success: true,
      count: programs.length,
      data: programs
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};


//Get Program Details (with tasks)

exports.getProgramDetails = async (req, res) => {
  try {
    const { programId } = req.params;

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        tasks: {
          orderBy: { dayNumber: "asc" }
        }
      }
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found"
      });
    }

    res.json({ success: true, data: program });

  } catch {
    res.status(500).json({ success: false });
  }
};

// Join / Enroll in Program

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

    const existing = await prisma.programProgress.findFirst({
      where: { riderId, programId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already joined program"
      });
    }

    await prisma.programProgress.create({
      data: {
        riderId,
        programId,
        totalOrders: 0
      }
    });

    res.json({
      success: true,
      message: "Joined program successfully"
    });

  } catch {
    res.status(500).json({ success: false });
  }
};

//Get My Active Programs

exports.getMyPrograms = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const programs = await prisma.programProgress.findMany({
      where: { riderId },
      include: {
        program: true
      }
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

// Get My Progress 

exports.getMyProgress = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { programId } = req.params;

    const progress = await prisma.programProgress.findFirst({
      where: { riderId, programId },
      include: {
        program: {
          include: { tasks: true }
        }
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Not enrolled"
      });
    }

    res.json({
      success: true,
      data: progress
    });

  } catch {
    res.status(500).json({ success: false });
  }
};

// Get Today Task

exports.getTodayTask = async (req, res) => {
  try {
    const { programId } = req.params;

    const today = new Date();
    const dayNumber = today.getDate(); // simple logic (can improve)

    const task = await prisma.programTask.findFirst({
      where: {
        programId,
        dayNumber
      }
    });

    res.json({
      success: true,
      data: task
    });

  } catch {
    res.status(500).json({ success: false });
  }
};

// Get Earnings (Reward Summary)

exports.getEarnings = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { programId } = req.params;

    const payouts = await prisma.programPayout.findMany({
      where: { riderId, programId }
    });

    const total = payouts.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      totalEarned: total,
      data: payouts
    });

  } catch {
    res.status(500).json({ success: false });
  }
};

