const RiderAssets = require("../models/RiderAsset");
exports.raiseAssetIssue = async (req, res) => {
  try {
    const riderId = req.rider._id;
    const { assets, issueType, description } = req.body;

    if (!assets || !assets.length) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one asset",
      });
    }

    const riderAssets = await RiderAssets.findOne({ riderId });
    if (!riderAssets) {
      return res.status(404).json({
        success: false,
        message: "Assets not found",
      });
    }

    for (const item of assets) {
      // 1️⃣ Find asset
      const asset = riderAssets.assets.find(
        (a) =>
          a.assetType === item.assetType &&
          a.assetName === item.assetName
      );

      if (!asset) continue;

      // 2️⃣ Check if OPEN issue already exists
      const openIssueExists = riderAssets.issues.some(
        (i) =>
          i.assetType === item.assetType &&
          i.assetName === item.assetName &&
          i.status === "OPEN"
      );

      if (openIssueExists) {
        return res.status(400).json({
          success: false,
          message: `Issue already raised for ${item.assetName}`,
        });
      }

      // 3️⃣ Create issue
      riderAssets.issues.push({
        assetType: item.assetType,
        assetName: item.assetName,
        issueType: issueType || "OTHER",
        description,
        status: "OPEN",
      });

      // 4️⃣ Mark asset BAD
      asset.condition = "BAD";
    }

    await riderAssets.save();

    return res.status(201).json({
      success: true,
      message: "Issue raised successfully",
    });
  } catch (error) {
    console.error("Raise Issue Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to raise issue",
    });
  }
};
