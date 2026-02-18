module.exports.isKycComplete = (rider) => {
  const isAadharValid =
    rider?.kyc?.aadhar?.isVerified === true &&
    rider?.kyc?.aadhar?.status === "approved";

  if (!isAadharValid) return false;

  const isPanValid =
    !rider?.kyc?.pan ||
    (
      rider?.kyc?.pan?.status === "approved" &&
      rider?.kyc?.pan?.image &&
      rider?.kyc?.pan?.number
    );

  const isDlValid =
    !rider?.kyc?.drivingLicense ||
    (
      rider?.kyc?.drivingLicense?.status === "approved" &&
      rider?.kyc?.drivingLicense?.frontImage &&
      rider?.kyc?.drivingLicense?.backImage &&
      rider?.kyc?.drivingLicense?.number
    );

  const isBankValid =
    !rider?.bankDetails ||
    (
      rider?.bankDetails?.addedBankAccount === true &&
      rider?.bankDetails?.bankVerificationStatus === "APPROVED" &&
      rider?.bankDetails?.ifscVerificationStatus === "APPROVED"
    );

  return isPanValid && isDlValid && isBankValid;
};
