const prisma=require('../config/prisma');
const geocodeAddress = require("../utils/geocode");

/////////////////////////////////////////////////////
// CREATE ADDRESS (ADMIN)
/////////////////////////////////////////////////////

exports.createZone = async (req, res) => {
  try {
    const { name, city, state } = req.body;

    if (!name || !city || !state) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    //////////////////////////////////////////////////////
    // CUSTOM ZONE ID
    //////////////////////////////////////////////////////
    const zoneId = `zone${Math.floor(1000 + Math.random() * 90000)}`;

    const zone = await prisma.zone.create({
      data: {
        id: zoneId,
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
      addressLine2,
      city,
      state,
      pincode,
      zoneId
    } = req.body;

    //////////////////////////////////////////////////////
    // CHECK ZONE
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
    // FULL ADDRESS
    //////////////////////////////////////////////////////
    const fullAddress = `
      ${addressLine1},
      ${addressLine2 || ""},
      ${city},
      ${state},
      ${pincode}
    `;

    //////////////////////////////////////////////////////
    // AUTO LAT LNG
    //////////////////////////////////////////////////////
    const { latitude, longitude } =
      await geocodeAddress(fullAddress);

    //////////////////////////////////////////////////////
    // CREATE
    //////////////////////////////////////////////////////
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
};

/////////////////////////////////////////////////////
// GET ALL ADDRESSES (FOR UI LIST)
/////////////////////////////////////////////////////
// exports.getZonePoints = async (req, res) => {
//   try {

//     const { zoneId, pincode } = req.query;

//     const zonePoints = await prisma.zonePoint.findMany({
//       where: {
//         isActive: true,
//         ...(zoneId && { zoneId }),
//         ...(pincode && { pincode })
//       },

//       //////////////////////////////////////////////////////
//       // HIDE LATITUDE & LONGITUDE
//       //////////////////////////////////////////////////////
//       select: {
//         id: true,
//         name: true,
//         addressLine1: true,
//         addressLine2: true,
//         city: true,
//         state: true,
//         pincode: true,
//         radiusInMeters: true,
//         zoneId: true,
//         isActive: true,
//         createdAt: true,
//         updatedAt: true
//       },

//       orderBy: {
//         createdAt: "desc"
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       data: zonePoints
//     });

//   } catch (error) {

//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };

exports.getZonePoints = async (req, res) => {
  try {

    const { pincode } = req.query;

    //////////////////////////////////////////////////////
    // PINCODE REQUIRED
    //////////////////////////////////////////////////////
    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "pincode is required"
      });
    }

    //////////////////////////////////////////////////////
    // GET ALL ZONES WITH THIS PINCODE
    //////////////////////////////////////////////////////
    const zonePoints = await prisma.zonePoint.findMany({

      where: {
        isActive: true,
        pincode
      },

      //////////////////////////////////////////////////////
      // RETURN CLEAN DATA
      //////////////////////////////////////////////////////
      select: {

        id: true,

        name: true,

        addressLine1: true,

        addressLine2: true,

        city: true,

        state: true,

        pincode: true,

        //////////////////////////////////////////////////
        // INCLUDE ZONE DETAILS
        //////////////////////////////////////////////////
        zone: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      count: zonePoints.length,
      data: zonePoints
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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