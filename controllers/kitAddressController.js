const Rider = require("../models/RiderModel");
 
exports.addKitAddress = async (req, res) => {
  try {
    const riderId = req.rider._id;
    const { name, completeAddress, pincode } = req.body;

    // Check for missing fields
    if (!name?.trim() || !completeAddress?.trim() || !pincode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, complete address and pincode are required",
      });
    }

    // Validate address length
    if (completeAddress.length < 10 || completeAddress.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Complete address must be between 10 and 200 characters",
      });
    }

    // Validate pincode (must be exactly 6 digits)
    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode. It must be a 6-digit number",
      });
    }

    //Fetch rider
    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // only fully registered riders can add kit address
    // if (!rider.isFullyRegistered) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Complete KYC and onboarding to add kit delivery address",
    //   });
    // }

    //Save kit address
    rider.kitDeliveryAddress = {
      name: name.trim(),
      completeAddress: completeAddress.trim(),
      pincode: pincode.trim(),
      onboardingKitStatus: false, // keep default unless changed later
    };

    await rider.save();

    return res.status(200).json({
      success: true,
      message: "Kit delivery address saved successfully",
      data: rider.kitDeliveryAddress,
    });

  } catch (error) {
    console.error("Add Kit Address Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save kit delivery address",
      error: error.message,
    });
  }
};

 
 
exports.getKitAddress = async (req, res) => {
  try {
    const riderId = req.rider._id;
 
    const rider = await Rider.findById(
      riderId,
      "kitDeliveryAddress.name kitDeliveryAddress.completeAddress kitDeliveryAddress.pincode"
    );
 
    if (!rider || !rider.kitDeliveryAddress) {
      return res.status(404).json({
        message: "Kit delivery address not found",
      });
    }
 
    res.status(200).json({
      message: "Kit delivery address fetched successfully",
      data: rider.kitDeliveryAddress,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch kit delivery address",
      error: error.message,
    });
  }
};