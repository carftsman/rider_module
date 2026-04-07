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



exports.employeeDetails = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const {
      companyName,
      empId,
      fullName,
      dob,
      gender,
      secondaryPhone,
      email
    } = req.body;

    // ✅ 1. Validation
    if (!companyName || !empId || !fullName) {
      return res.status(400).json({
        success: false,
        message: "companyName, empId, fullName are required"
      });
    }

    // if (gender && !Object.values(Gender).includes(gender)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid gender"
    //   });
    // }
     const allowedGenders = ["male", "female", "other"];

    if (gender && !allowedGenders.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender"
      });
    }



    // ✅ 2. Check rider exists
    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    // ✅ 3. Prevent duplicate empId
    const existingEmp = await prisma.rider.findFirst({
      where: { empId }
    });

    if (existingEmp && existingEmp.id !== riderId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID already exists"
      });
    }

    // ✅ 4. Update Rider (Company fields)
    await prisma.rider.update({
      where: { id: riderId },
      data: {
        companyName,
        empId,
        dob: dob ? new Date(dob) : null,
        email,
        riderType: RiderType.COMPANY_EMPLOYEE,
        onboardingStage: OnboardingStage.EMPLOYEE_DETAILS
      }
    });

    // ✅ 5. Upsert Profile
    await prisma.riderProfile.upsert({
      where: { riderId },
      update: {
        fullName,
        gender,
        secondaryPhone,
        email
      },
      create: {
        riderId,
        fullName,
        gender,
        secondaryPhone,
        email
      }
    });

    // ✅ 6. Update Onboarding Flags
    await prisma.riderOnboarding.upsert({
      where: { riderId },
      update: {
        employeeDetailsSubmitted: true
      },
      create: {
        riderId,
        employeeDetailsSubmitted: true
      }
    });

    // ✅ 7. Decide NEXT STAGE (as per your flow)
    const nextStage = OnboardingStage.DOCUMENT_DETAILS;

    // ✅ 8. Response
    return res.status(200).json({
      success: true,
      message: "Employee details submitted",
      nextStage
    });

  } catch (error) {
    console.error("Employee Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};



exports.documentDetails = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const {
      dlNumber,
      panNumber,
      type,
      selfieUrl
    } = req.body;

    // ✅ 1. Validation
    if (!dlNumber || !panNumber || !type || !selfieUrl) {
      return res.status(400).json({
        success: false,
        message: "dlNumber, panNumber, type, selfieUrl are required"
      });
    }

    const allowedVehicleTypes = ["ev", "bike", "scooty"];

    if (!allowedVehicleTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type"
      });
    }

    // ✅ 2. Check rider exists
    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    // ✅ 3. Upsert RiderKyc
    await prisma.riderKyc.upsert({
      where: { riderId },
      update: {
        dlNumber,
        panNumber
      },
      create: {
        riderId,
        dlNumber,
        panNumber
      }
    });

    // ✅ 4. Upsert Vehicle
    await prisma.riderVehicle.upsert({
      where: { riderId },
      update: {
        type
      },
      create: {
        riderId,
        type
      }
    });

    // ✅ 5. Upsert Selfie
    await prisma.riderSelfie.upsert({
      where: { riderId },
      update: {
        url: selfieUrl,
        uploadedAt: new Date()
      },
      create: {
        riderId,
        url: selfieUrl,
        uploadedAt: new Date()
      }
    });

    // ✅ 6. Update Onboarding Flags
    await prisma.riderOnboarding.upsert({
      where: { riderId },
      update: {
        documentDetailsSubmitted: true,
        dlUploaded: true,
        panUploaded: true,
        selfieUploaded: true
      },
      create: {
        riderId,
        documentDetailsSubmitted: true,
        dlUploaded: true,
        panUploaded: true,
        selfieUploaded: true
      }
    });

    // ✅ 7. Update Rider Stage
    await prisma.rider.update({
      where: { id: riderId },
      data: {
        onboardingStage: OnboardingStage.EMPLOYEEKYC_VERIFICATION
      }
    });

    // ✅ 8. Response
    return res.status(200).json({
      success: true,
      message: "Documents uploaded",
      nextStage: OnboardingStage.EMPLOYEEKYC_VERIFICATION
    });

  } catch (error) {
    console.error("Document Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};