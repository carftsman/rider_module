const prisma = require('../config/prisma');
const geolib = require("geolib");

exports.updateRiderGps = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const {
      isEnabled,
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
    } = req.body;

    // ================= VALIDATION =================

    if (typeof isEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isEnabled must be true or false",
      });
    }

    // ================= DISABLE GPS =================

    if (!isEnabled) {
      const disabledGps =
        await prisma.riderGps.upsert({
          where: {
            riderId,
          },

          update: {
            isEnabled: false,
            latitude: null,
            longitude: null,
            accuracy: null,
            heading: null,
            speed: null,
          },

          create: {
            riderId,
            isEnabled: false,
          },
        });

      return res.status(200).json({
        success: true,
        message: "GPS disabled successfully",
        data: disabledGps,
      });
    }

    // ================= VALIDATE LAT LNG =================

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // ================= CHECK EXISTING GPS =================

    const existingGps =
      await prisma.riderGps.findUnique({
        where: {
          riderId,
        },
      });

    // ================= DISTANCE FILTER =================

    if (
      existingGps?.latitude &&
      existingGps?.longitude
    ) {
      const distance = geolib.getDistance(
        {
          latitude: existingGps.latitude,
          longitude: existingGps.longitude,
        },
        {
          latitude,
          longitude,
        }
      );

      // Skip DB update if movement < 30 meters
      if (distance < 30) {
        return res.status(200).json({
          success: true,
          message: "No significant movement",
          distanceInMeters: distance,
        });
      }
    }

    // ================= UPSERT GPS =================

    const updatedGps =
      await prisma.riderGps.upsert({
        where: {
          riderId,
        },

        update: {
          isEnabled: true,
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
        },

        create: {
          riderId,
          isEnabled: true,
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
        },
      });

    return res.status(200).json({
      success: true,
      message: "GPS updated successfully",
      data: updatedGps,
    });
  } catch (error) {
    console.error("Update Rider GPS Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};