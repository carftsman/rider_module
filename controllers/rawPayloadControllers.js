const RawPayload = require("../models/RawPayload");

exports.storeAnything = async (req, res) => {
  try {
    const doc = await RawPayload.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Data stored successfully",
      id: doc._id
    });

  } catch (error) {
    console.error("STORE_ANYTHING_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to store data"
    });
  }
};
