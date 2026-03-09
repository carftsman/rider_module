




const prisma = require("../config/prisma");

const { extractTextFromImage } = require("../utils/ocr");
const {
  extractPAN,
  extractDL,
  extractDLExpiry,
  
} = require("../utils/kycParser");
const { uploadToAzure } = require("../utils/azureUpload"); // path adjust
const SlotBooking = require("../models/SlotBookingModel");

exports.getProfile = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        profile: true,
        location: true,
        selfie: true,
      },
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }
    const dob = rider?.profile?.dob;

    const formattedDob = dob
      ? `${dob.getUTCFullYear()}-${dob.getUTCMonth() + 1}-${dob.getUTCDate()}`
      : null;

    const data = {
      _id: rider.id,
      partnerId: rider.partnerId || null,
      phone: {
        countryCode: rider.countryCode,
        number: rider.phoneNumber,
      },

      personalInfo: {
        fullName: rider.profile?.fullName || null,
        dob: formattedDob || null,
        gender: rider.profile?.gender || null,
        primaryPhone: rider.profile?.primaryPhone || null,
        secondaryPhone: rider.profile?.secondaryPhone || null,
        email: rider.profile?.email || null,
      },

      location: {
        streetAddress: rider.location?.streetAddress || null,
        area: rider.location?.area || null,
        city: rider.location?.city || null,
        state: rider.location?.state || null,
        pincode: rider.location?.pincode || null,
      },

      isPartnerActive: rider.isPartnerActive,

      selfie: rider.selfie
        ? {
            url: rider.selfie.url,
            uploadedAt: rider.selfie.uploadedAt,
          }
        : null,

      onboardingStage: rider.onboardingStage,
      lastOtpVerifiedAt: rider.lastOtpVerifiedAt || null,
    };

    // Remove empty / undefined objects
    Object.keys(data).forEach((key) => {
      if (key === "partnerId") return; 

      if (
        data[key] == null ||
        (typeof data[key] === "object" && Object.keys(data[key]).length === 0)
      ) {
        delete data[key];
      }
    });

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data,
    });
  } catch (err) {
    console.error("Get Clean Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const riderId = req.rider.id;

    // Check rider exists
    const riderExists = await prisma.rider.findUnique({
      where: { id: riderId },
      select: { id: true },
    });

    if (!riderExists) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Fetch KYC details
    const kyc = await prisma.riderKyc.findUnique({
      where: { riderId },
    });

    if (!kyc) {
      return res.status(200).json({
        success: true,
        message: "Documents fetched successfully",
        data: {},
      });
    }

    // Transform PostgreSQL data into required response structure
    const formattedResponse = {
      aadhar: {
        isVerified: kyc.aadharStatus === "approved",
        status: kyc.aadharStatus,
      },
      pan: {
        number: kyc.panNumber,
        image: kyc.panImage,
        status: kyc.panStatus,
      },
      drivingLicense: {
        number: kyc.dlNumber,
        frontImage: kyc.dlFrontImage,
        backImage: kyc.dlBackImage,
        status: kyc.dlStatus,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      data: formattedResponse,
    });
  } catch (err) {
    console.error("Get Documents Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const riderId = req.rider?.id;
    const updateData = {};

    /* ---------------- HANDLE TEXT FIELDS (SINGLE / MULTIPLE) ---------------- */
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined && req.body[key] !== "") {
        updateData[key] = req.body[key];
      }
    });

    /* ---------------- HANDLE SELFIE (AZURE) ---------------- */
    if (req.file) {
      const selfieUrl = await uploadToAzure(req.file, "selfies");
      await prisma.riderSelfie.upsert({
        where: { riderId },
        update: {
          url: selfieUrl,
          uploadedAt: new Date(),
        },
        create: {
          riderId,
          url: selfieUrl,
          uploadedAt: new Date(),
        },
      });
    }

    /* ---------------- VALIDATION ---------------- */
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update",
      });
    }

    /* ---------------- UPDATE ---------------- */
    const profileFields = {};
    const locationFields = {};
    const riderFields = {};

    // map fields according to schema
    Object.keys(updateData).forEach((key) => {
      // RiderProfile fields
      if (
        [
          "fullName",
          "dob",
          "gender",
          "primaryPhone",
          "secondaryPhone",
          "email",
        ].includes(key)
      ) {
        profileFields[key] = updateData[key];
      }

      // RiderLocation fields
      else if (
        ["streetAddress", "area", "city", "state", "pincode"].includes(key)
      ) {
        locationFields[key] = updateData[key];
      }

      // Rider root fields
      else if (["countryCode"].includes(key)) {
        riderFields[key] = updateData[key];
      }
    });

    // Save profile
    if (Object.keys(profileFields).length) {
      await prisma.riderProfile.upsert({
        where: { riderId },
        update: profileFields,
        create: { riderId, ...profileFields },
      });
    }

    // Save location
    if (Object.keys(locationFields).length) {
      await prisma.riderLocation.upsert({
        where: { riderId },
        update: locationFields,
        create: { riderId, ...locationFields },
      });
    }

    if (Object.keys(riderFields).length) {
      if (riderFields.phoneNumber) {
        const existing = await prisma.rider.findFirst({
          where: {
            phoneNumber: riderFields.phoneNumber,
            NOT: { id: riderId },
          },
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            message: "Phone number already used by another rider",
          });
        }
      }

      await prisma.rider.update({
        where: { id: riderId },
        data: riderFields,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updateData,
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getBankDetails_profile = async (req, res) => {
  try {
    const riderId = req.rider.id; // FIXED

    const bankDetails = await prisma.riderBankDetails.findUnique({
      where: { riderId },
    });
    return res.status(200).json({
      success: true,
      data: bankDetails || {},
    });
  } catch (error) {
    console.error("Get Bank Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bank details",
    });
  }
};

exports.getMyAssetsSummary = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const doc = await RiderAssets.findOne({ riderId }).lean();

    if (!doc) {
      return res.status(200).json({
        success: true,
        data: {
          badConditionCount: 0,
          issues: [],
        },
      });
    }

    // 🔹 Count BAD assets
    const badConditionCount = (doc.assets || []).reduce(
      (count, asset) => (asset.condition === "BAD" ? count + 1 : count),
      0,
    );

    // 🔹 OPTIONAL: return only OPEN issues
    const issues = (doc.issues || []).filter(
      (issue) => issue.status === "OPEN",
    );

    return res.status(200).json({
      success: true,
      data: {
        badConditionCount,
        issues,
      },
    });
  } catch (error) {
    console.error("Assets Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch asset issues",
    });
  }
};

exports.getWalletDetails = async (req, res) => {
  try {
    const riderId = req.rider.id; // Prisma uses id (not _id)

    const wallet = await prisma.riderWallet.findUnique({
      where: { riderId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet details fetched successfully",
      data: wallet || {},
    });
  } catch (err) {
    console.error("Get Wallet Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.updateDocuments = async (req, res) => {
  try {
    const riderId = req.rider.id;

    /* =====================================================
       ENSURE KYC ROW EXISTS
    ===================================================== */
    await prisma.riderKyc.upsert({
      where: { riderId },
      update: {},
      create: { riderId },
    });

    /* =====================================================
       PAN IMAGE UPLOAD
    ===================================================== */
    if (req.files?.panImage?.length) {
      const panFile = req.files.panImage[0];

      let text = null;
      try {
        text = await extractTextFromImage(panFile.buffer);
      } catch {}

      const panNumber = text ? extractPAN(text) : null;

      const kyc = await prisma.riderKyc.findUnique({
        where: { riderId },
      });

      // OCR FAILED
      if (!panNumber) {
        const updated = await prisma.riderKyc.update({
          where: { riderId },
          data: { panOcrAttempts: { increment: 1 } },
        });

        const attempts = updated.panOcrAttempts;

        if (attempts >= 2 && !updated.panAllowManual) {
          await prisma.riderKyc.update({
            where: { riderId },
            data: { panAllowManual: true },
          });
        }

        return res.status(400).json({
          success: false,
          message:
            attempts >= 2
              ? "PAN image is not clear. Please update manually."
              : "PAN image is blur. Please upload a clear image.",
          allowManual: attempts >= 2,
        });
      }

      const panImageUrl = await uploadToAzure(panFile, "pan");

      await prisma.riderKyc.update({
        where: { riderId },
        data: {
          panNumber,
          panImage: panImageUrl,
          panStatus: "pending",
          panOcrAttempts: 0,
          panAllowManual: false,
        },
      });

      return res.json({
        success: true,
        message: "PAN uploaded successfully",
        data: { panNumber, panImageUrl },
      });
    }

    /* =====================================================
       PAN – MANUAL UPDATE
    ===================================================== */
    if (req.body.panNumber) {
      const kyc = await prisma.riderKyc.findUnique({
        where: { riderId },
      });

      if (!kyc.panAllowManual) {
        return res.status(403).json({
          success: false,
          message: "Manual PAN not allowed yet",
        });
      }

      await prisma.riderKyc.update({
        where: { riderId },
        data: {
          panNumber: req.body.panNumber,
          panStatus: "pending",
          panAllowManual: false,
        },
      });

      return res.json({
        success: true,
        message: "PAN updated manually",
      });
    }

    /* =====================================================
        DRIVING LICENSE – IMAGE UPLOAD
    ===================================================== */
    if (req.files?.dlFrontImage?.length) {
      const dlFile = req.files.dlFrontImage[0];

      let text = null;
      try {
        text = await extractTextFromImage(dlFile.buffer);
      } catch {}

      const dlNumber = text ? extractDL(text) : null;
      const expiryDate = text ? extractDLExpiry(text) : null;

      const kyc = await prisma.riderKyc.findUnique({
        where: { riderId },
      });

      //  OCR FAILED
      if (!dlNumber) {
        const updated = await prisma.riderKyc.update({
          where: { riderId },
          data: { dlOcrAttempts: { increment: 1 } },
        });

        const attempts = updated.dlOcrAttempts;

        if (attempts >= 2 && !updated.dlAllowManual) {
          await prisma.riderKyc.update({
            where: { riderId },
            data: { dlAllowManual: true },
          });
        }

        return res.status(400).json({
          success: false,
          message:
            attempts >= 2
              ? "Image is not clear. Please update manually."
              : "Driving License image is blur. Please upload a clear image.",
          allowManual: attempts >= 2,
        });
      }

      const frontUrl = await uploadToAzure(dlFile, "dl-front");
      const backUrl = req.files?.dlBackImage?.length
        ? await uploadToAzure(req.files.dlBackImage[0], "dl-back")
        : null;

      await prisma.riderKyc.update({
        where: { riderId },
        data: {
          dlNumber,
          dlFrontImage: frontUrl,
          dlBackImage: backUrl,
          dlStatus: "pending",
          dlOcrAttempts: 0,
          dlAllowManual: false,
        },
      });

      return res.json({
        success: true,
        message: "Driving License uploaded",
        data: { dlNumber },
      });
    }

    /* =====================================================
       DL MANUAL UPDATE
    ===================================================== */
    if (req.body.dlNumber) {
      const kyc = await prisma.riderKyc.findUnique({
        where: { riderId },
      });

      if (!kyc.dlAllowManual) {
        return res.status(403).json({
          success: false,
          message: "Manual DL not allowed",
        });
      }

      await prisma.riderKyc.update({
        where: { riderId },
        data: {
          dlNumber: req.body.dlNumber,
          dlStatus: "pending",
          dlAllowManual: false,
        },
      });

      return res.json({
        success: true,
        message: "Driving License updated manually",
      });
    }

    /* =====================================================
       NO VALID INPUT
    ===================================================== */
    return res.status(400).json({
      success: false,
      message: "No valid input",
    });
  } catch (err) {
    console.error("KYC Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// helper (make sure this exists)
const normalizeDate = (inputDate) => {
  if (!inputDate) return null;
  const d = new Date(inputDate);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
};

exports.getSlotHistory = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { filter, date, month, year } = req.query;

    let dateFilter = {};

    if (filter === "daily") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      dateFilter.slotStartAt = {
        gte: start,
        lte: end,
      };
    } else if (filter === "weekly") {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      dateFilter.slotStartAt = {
        gte: start,
        lte: new Date(),
      };
    } else if (filter === "monthly") {
      const y = Number(year) || new Date().getFullYear();
      const m = Number(month) - 1 || new Date().getMonth(); // IMPORTANT: month index fix

      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59);

      dateFilter.slotStartAt = {
        gte: start,
        lte: end,
      };
    }
    const bookings = await prisma.slotBooking.findMany({
      where: {
        riderId,
        ...dateFilter,
      },
    });

    if (!bookings.length) {
      return res.json({
        success: true,
        filter: filter || "all",
        totalSlots: 0,
        totalEarnings: 0,
        data: [],
      });
    }
    const dates = bookings.map((b) => b.date).sort();

    const dayStart = new Date(`${dates[0]}T00:00:00.000Z`);
    const dayEnd = new Date(`${dates[dates.length - 1]}T23:59:59.999Z`);

    const allOrders = await prisma.order.findMany({
      where: {
        riderId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        OrderRiderEarning: true,
      },
    });

    const ordersByDate = {};

    allOrders.forEach((order) => {
      const d = new Date(order.createdAt).toISOString().slice(0, 10);

      if (!ordersByDate[d]) {
        ordersByDate[d] = [];
      }

      ordersByDate[d].push(order);
    });

    let totalEarnings = 0;
    const data = [];

    for (const booking of bookings) {
      // const orders = ordersByDate[booking.date] || [];
      const slotStart = booking.slotStartAt;
      const slotEnd = booking.slotEndAt;

      const slotOrders = allOrders.filter((order) => {
        const orderTime = order.createdAt;
        return orderTime >= slotStart && orderTime <= slotEnd;
      });
      const completed = slotOrders.filter(
        (o) => o.orderStatus?.toUpperCase() === "DELIVERED",
      );

      const canceled = slotOrders.filter(
        (o) => o.orderStatus?.toUpperCase() === "CANCELLED",
      );

      const slotEarnings = completed.reduce(
        (sum, o) => sum + Number(o.OrderRiderEarning?.totalEarning || 0),
        0,
      );

      totalEarnings += slotEarnings;

      let slotStatus = "ACTIVE";

      if (
        booking.status === "CANCELLED_BY_RIDER" ||
        booking.status === "CANCELLED_BY_SYSTEM"
      ) {
        slotStatus = "CANCELLED";
      } else if (booking.slotEndAt < new Date()) {
        slotStatus = "COMPLETED";
      }

      data.push({
        slotBookingId: booking.id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        slotStatus,
        totalOrders: slotOrders.length,
        completedOrders: completed.length,
        canceledOrders: canceled.length,
        slotEarnings: Number(slotEarnings.toFixed(2)),
      });
    }

    return res.json({
      success: true,
      filter: filter || "all",
      totalSlots: data.length,
      totalEarnings,
      data,
    });
  } catch (err) {
    console.error("Slot History Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getRiderOrderHistory = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "Rider ID missing",
      });
    }

    const { filter = "all" } = req.query;
    let dateFilter = {};

    if (filter === "daily") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      dateFilter = { gte: start, lte: end };
    }

    if (filter === "weekly") {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      dateFilter = { gte: start, lte: new Date() };
    }

    if (filter === "monthly") {
      const start = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );
      const end = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      dateFilter = { gte: start, lte: end };
    }

    // ---------- FETCH ORDERS ----------
    const orders = await prisma.order.findMany({
      where: {
        riderId,
        orderStatus: "DELIVERED",
        ...(filter !== "all" && { createdAt: dateFilter }),
      },
      include: {
        OrderItems: true,
        OrderPricing: true,
        OrderPayment: true,
        OrderTracking: true,
        OrderPickupAddress: true,
        OrderDeliveryAddress: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    orders.forEach((order) => {
      if (!order.OrderPricing) {
        console.warn("Delivered order missing pricing:", order.orderId);
      }
    });
    // ---------- TOTALS ----------
    const totalOrders = orders.length;

    const totalEarnings = orders.reduce(
      (sum, o) => sum + (o.OrderPricing?.totalAmount || 0),
      0,
    );

    const totalDistance = Number(
      orders
        .reduce((sum, o) => sum + (o.OrderTracking?.distanceInKm || 0), 0)
        .toFixed(2),
    );

    const ratings = orders
      .map((o) => o.rating)
      .filter((r) => typeof r === "number");

    const avgRating = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

    // ---------- RESPONSE ----------
    const data = orders.map((order) => ({
      orderId: order.orderId,

      items:
        order.OrderItems?.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })) || [],

      pricing: {
        itemTotal: order.OrderPricing?.itemTotal || 0,
        deliveryFee: order.OrderPricing?.deliveryFee || 0,
        tax: order.OrderPricing?.tax || 0,
        platformCommission: order.OrderPricing?.platformCommission || 0,
        totalAmount: order.OrderPricing?.totalAmount || 0,
      },

      customerTip: 0,

      distanceTravelled: order.OrderTracking?.distanceInKm || 0,

      durationInMin: order.OrderTracking?.durationInMin || 0,
      pickupAddress: order.OrderPickupAddress?.addressLine || "",

      rating: null,

      deliveredAddress: order.OrderDeliveryAddress?.addressLine || "",
      deliveredAt: order.updatedAt || null,
    }));

    return res.status(200).json({
      success: true,
      filter,
      totalOrders,
      totalEarnings,
      totalDistance,
      avgRating,
      data,
    });
  } catch (err) {
    console.error("Order History Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
/**

* ============================================================

* UPDATE BANK DETAILS (PUT)

* ============================================================

*/
exports.addOrUpdateBankDetails = async (req, res) => {
  try {
    const riderId = req.rider.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider",
      });
    }

    const bankDetails = req.body?.bankDetails;

    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        message: "bankDetails object is required",
      });
    }

    const {
      bankName,
      accountHolderName,
      accountType,
      branch,
      accountNumber,
      ifscCode,
    } = bankDetails;

    if (
      !bankName ||
      !accountHolderName ||
      !accountType ||
      !branch ||
      !accountNumber ||
      !ifscCode
    ) {
      return res.status(400).json({
        success: false,
        message: "All bank details are required",
      });
    }

    await prisma.riderBankDetails.upsert({
      where: { riderId },
      update: {
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountType,
        branch,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        ifscVerificationStatus: "PENDING",
        bankVerificationStatus: "PENDING",
        verifiedAt: null,
      },
      create: {
        riderId,
        bankName,
        accountHolderName,
        accountType,
        branch,
        accountNumber,
        ifscCode,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Bank details saved successfully",
    });
  } catch (error) {
    console.error("Add/Update Bank Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save bank details",
    });
  }
};

exports.getMyAssets = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const doc = await RiderAssets.findOne({ riderId }).lean();

    if (!doc || !doc.assets || doc.assets.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalAssets: 0,
          badConditionCount: 0,
          canRaiseRequest: false,
          assets: [],
        },
      });
    }

    let totalAssets = 0;
    let badConditionCount = 0;

    const formattedAssets = doc.assets.map((asset) => {
      const qty = asset.quantity || 1;

      totalAssets += qty;

      if (asset.condition === "BAD") {
        badConditionCount += qty;
      }

      return {
        assetId: asset._id,
        assetType: asset.assetType,
        assetName: asset.assetName,
        quantity: qty,
        condition: asset.condition,
        issuedDate: asset.issuedDate,
        canRaiseRequest: asset.condition === "BAD",
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalProducts: formattedAssets.length,
        totalAssets,
        badConditionCount,
        canRaiseRequest: badConditionCount > 0,
        assets: formattedAssets,
      },
    });
  } catch (error) {
    console.error("Assets Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch asset summary",
    });
  }
};
