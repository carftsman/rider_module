const prisma = require("../config/prisma");


exports.selectRiderType = async (req, res) => {
  try {
    const riderId = req.rider?.id;
    const { riderType } = req.body;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!riderType) {
      return res.status(400).json({
        success: false,
        message: "riderType is required"
      });
    }

    if (
      riderType !== "INDIVIDUAL_EMPLOYEE" &&
      riderType !== "COMPANY_EMPLOYEE"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid riderType. Allowed values: INDIVIDUAL_EMPLOYEE, COMPANY_EMPLOYEE"
      });
    }

    const existingRider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!existingRider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    const existingOnboarding = await prisma.riderOnboarding.findUnique({
      where: { riderId }
    });

    if (!existingOnboarding) {
      return res.status(404).json({
        success: false,
        message: "Rider onboarding record not found"
      });
    }

    const riderTypeBoolean = riderType === "COMPANY_EMPLOYEE";

    const updatedOnboarding = await prisma.riderOnboarding.update({
      where: { riderId },
      data: {
        riderType: riderTypeBoolean
      },
      select: {
        id: true,
        riderId: true,
        riderType: true,
        appPermissionDone: true,
        // citySelected: true,
        // employeeDetailsSubmitted: true
      }
    });

    const nextStage = riderTypeBoolean
      ? "EMPLOYEE_DETAILS"
      : "SELECT_LOCATION";

    return res.status(200).json({
      success: true,
      message: "Rider type selected successfully",
      data: {
        ...updatedOnboarding,
        riderType: updatedOnboarding.riderType
          ? "COMPANY_EMPLOYEE"
          : "INDIVIDUAL_EMPLOYEE"
      },
      nextStage
    });
  } catch (error) {
    console.error("Error selecting rider type:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};