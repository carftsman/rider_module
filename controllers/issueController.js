const Issue = require("../models/IssueSchema")

exports.reportIssue = async (req, res) => {
console.log("Report Issue Called");
  try {
    const riderId = req.rider._id;
    console.log("Rider ID:", riderId);

    const { issueType, notes, orderId = "123456789", slotId } = req.body;

    if (!issueType) {
      return res.status(400).json({ success: false, message: "issueType is required" });
    }

    const newIssue = await Issue.create({
      riderId,
      issueType,
      notes,
      orderId: orderId || null,
      slotId: slotId || null
    });

    return res.json({
      success: true,
      message: "Issue reported successfully",
      data: newIssue
    });

  } catch (err) {
    console.error("Report Issue Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
