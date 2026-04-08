const prisma = require("../config/prisma");
const { RiderType, OnboardingStage } = require("@prisma/client");



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
    message: error.message || "Internal server error"
  });
}

};
 
 
const { uploadToAzure } = require("../utils/azureUpload");



exports.documentDetails = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    const { dlNumber, panNumber, type } = req.body;
    const file = req.file; // 👈 selfie file

    // ✅ Validation
    if (!dlNumber || !panNumber || !type || !file) {
      return res.status(400).json({
        success: false,
        message: "dlNumber, panNumber, type, selfie(file) are required"
      });
    }

    const allowedVehicleTypes = ["ev", "bike", "scooty"];
    if (!allowedVehicleTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type"
      });
    }

    // ✅ Check rider
    const rider = await prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    // ✅ Upload selfie to Azure
    const selfieUrl = await uploadToAzure(file, "selfies");

    // ✅ Upsert KYC
    await prisma.riderKyc.upsert({
      where: { riderId },
      update: { dlNumber, panNumber },
      create: { riderId, dlNumber, panNumber }
    });

    // ✅ Upsert Vehicle
    await prisma.riderVehicle.upsert({
      where: { riderId },
      update: { type },
      create: { riderId, type }
    });

    // ✅ Upsert Selfie
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

    // ✅ Update onboarding flags
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

    // ✅ Update stage
    await prisma.rider.update({
      where: { id: riderId },
      data: {
        onboardingStage: OnboardingStage.EMPLOYEEKYC_VERIFICATION
      }
    });

    return res.status(200).json({
      success: true,
      message: "Documents uploaded",
      selfieUrl,
      nextStage: OnboardingStage.EMPLOYEEKYC_VERIFICATION
    });

  } catch (error) {
    console.error("Document Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};