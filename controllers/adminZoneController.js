const prisma = require("../config/prisma");


exports.createZonePoint=async function (req, res) {
  try {
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      latitude,
      longitude,
      zoneId
    } = req.body;

    // validation
    if (!name || !addressLine1 || !city || !state || !pincode || !latitude || !longitude || !zoneId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const zonePoint = await prisma.zonePoint.create({
      data: {
        name,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        latitude,
        longitude,
        zoneId
      }
    });

    return res.status(201).json({
      success: true,
      data: zonePoint
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

exports.getZonePoints=async function(req, res) {
  try {
    const { pincode } = req.query;

    const whereCondition = {
      isActive: true
    };

    if (pincode) {
      whereCondition.pincode = pincode;
    }

    const zonePoints = await prisma.zonePoint.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      data: zonePoints
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch zone points"
    });
  }
}

