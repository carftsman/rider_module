const PricingConfig = require("../models/pricingConfigSchema");

/**
 * @desc    Create Pricing Configuration
 * @route   POST /api/pricing-config
 * @access  Admin (or Protected)
 */
exports.createPricingConfig = async (req, res) => {
  try {
    const pricingConfig = await PricingConfig.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Pricing configuration saved successfully",
      data: pricingConfig,
    });
  } catch (error) {
    console.error("Create Pricing Config Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save pricing configuration",
      error: error.message,
    });
  }
};
