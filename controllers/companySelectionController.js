const prisma = require("../config/prisma");
const { RiderType, OnboardingStage } = require("@prisma/client");

exports.selectRiderType = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { riderType } = req.body;

    if (!riderType) {
      return res.status(400).json({
        success: false,
        message: "riderType is required"
      });
    }

    if (!Object.values(RiderType).includes(riderType)) {
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

    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        riderType,
        onboardingStage: OnboardingStage.APP_PERMISSIONS
      },
      select: {
        id: true,
        phoneNumber: true,
        riderType: true,
        onboardingStage: true
      }
    });

    return res.status(200).json({
      success: true,
      message: "Rider type selected successfully",
      data: updatedRider
    });
  } catch (error) {
    console.error("Error selecting rider type:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};