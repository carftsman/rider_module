const prisma=require('../config/prisma');

/////////////////////////////////////////////////////
// CREATE ADDRESS (ADMIN)
/////////////////////////////////////////////////////
// exports.createZonePoint = async (req, res) => {
//   try {
//     const {
//       name,
//       addressLine1,
//       addressLine2,
//       city,
//       state,
//       pincode,
//       latitude,
//       longitude,
//       zoneId
//     } = req.body;

//     if (!name || !addressLine1 || !city || !state || !pincode || !latitude || !longitude || !zoneId) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields"
//       });
//     }

//     const zonePoint = await prisma.zonePoint.create({
//       data: {
//         name,
//         addressLine1,
//         addressLine2,
//         city,
//         state,
//         pincode,
//         latitude,
//         longitude,
//         zoneId
//       }
//     });

//     return res.status(201).json({
//       success: true,
//       data: zonePoint
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

exports.createZone = async (req, res) => {
  try {
    const { name, city, state } = req.body;

    if (!name || !city || !state) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        city,
        state
      }
    });

    return res.status(201).json({
      success: true,
      message: "Zone created successfully",
      data: zone
    });

  } catch (error) {
    console.error("CREATE ZONE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.createZonePoint = async (req, res) => {
  try {
    const {
      name,
      addressLine1,
      city,
      state,
      pincode,
      latitude,
      longitude,
      zoneId
    } = req.body;

    //////////////////////////////////////////////////////
    // 🔴 CHECK IF ZONE EXISTS
    //////////////////////////////////////////////////////
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId }
    });

    if (!zone) {
      return res.status(400).json({
        success: false,
        message: "Invalid zoneId. Zone does not exist."
      });
    }

    //////////////////////////////////////////////////////
    // ✅ CREATE ZONE POINT
    //////////////////////////////////////////////////////
    const zonePoint = await prisma.zonePoint.create({
      data: {
        name,
        addressLine1,
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/////////////////////////////////////////////////////
// GET ALL ADDRESSES (FOR UI LIST)
/////////////////////////////////////////////////////
exports.getZonePoints = async (req, res) => {
  try {
    const { zoneId, pincode } = req.query;

    const zonePoints = await prisma.zonePoint.findMany({
      where: {
        isActive: true,
        ...(zoneId && { zoneId }),
        ...(pincode && { pincode })
      },
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/////////////////////////////////////////////////////
// UPDATE ADDRESS
/////////////////////////////////////////////////////
exports.updateZonePoint = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.zonePoint.update({
      where: { id },
      data: req.body
    });

    return res.status(200).json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/////////////////////////////////////////////////////
// DELETE (SOFT DELETE)
/////////////////////////////////////////////////////
exports.deleteZonePoint = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.zonePoint.update({
      where: { id },
      data: { isActive: false }
    });

    return res.status(200).json({
      success: true,
      message: "Address removed"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};