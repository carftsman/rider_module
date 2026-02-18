const Rider = require("../models/RiderModel");

exports.approveRiderKyc = async (req, res) => {
    res.send("Rider KYC approval endpoint is disabled");
//   try {
//     const { riderId } = req.params;

//     const rider = await Rider.findById(riderId);

//     if (!rider) {
//       return res.status(404).json({
//         success: false,
//         message: "Rider not found",
//       });
//     }

//     if (rider.isFullyRegistered == true) {
//       return res.status(200).json({
//         success: true,
//         message: "Rider is already fully registered",
//       });
//     }

//     // Ensure the rider reached the final onboarding stage
//     if (rider.onboardingStage !== "KYC_APPROVAL_PENDING") {
//       return res.status(400).json({
//         success: false,
//         message: "Rider is not in KYC approval stage",
//       });
//     }


//     // Mark KYC statuses as approved (optional)
//     rider.kyc.aadhar.status = "approved";
//     rider.kyc.pan.status = "approved";
//     rider.kyc.drivingLicense.status = "approved";

//     rider.onboardingStage = "COMPLETED";
//     rider.isFullyRegistered = true;

//     await rider.save();

//     return res.json({
//       success: true,
//       message: "Rider KYC approved successfully",
//       data: {
//         riderId: rider._id,
//         isFullyRegistered: rider.isFullyRegistered,
//         onboardingStage: rider.onboardingStage,
//       },
//     });
//   } catch (err) {
//     console.error("Approve KYC Error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while approving KYC",
//     });
//   }
};
