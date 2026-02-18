

const Rider = require("../models/RiderModel");
const Order = require("../models/OrderSchema");
const RiderAssets = require("../models/RiderAsset");

const mongoose=require('mongoose')
const { extractTextFromImage } = require("../utils/ocr");
const {
  extractPAN,
  extractDL,
  extractDLExpiry,
  isExpiringWithinOneMonth
} = require("../utils/kycParser");
const { uploadToAzure } = require("../utils/azureUpload"); // path adjust
const SlotBooking = require("../models/SlotBookingModel");

exports.getProfile = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const rider = await Rider.findById(riderId).lean();

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }
    const dob = rider?.personalInfo?.dob;

const formattedDob = dob
  ? `${dob.getUTCFullYear()}-${dob.getUTCMonth() + 1}-${dob.getUTCDate()}`
  : null;


    const data = {
      _id: rider._id,

     partnerId: rider.partnerId,
      email: rider.email,

      phone: {
        countryCode: rider.phone?.countryCode,
        number: rider.phone?.number
      },

      // emergencyContact: {
      //   name: rider.emergencyContact?.name,
      //   phoneNumber: rider.emergencyContact?.phoneNumber
      // },

personalInfo: {
    ...rider.personalInfo,
    dob: formattedDob
  },
            location: {
        streetAddress: rider.location?.streetAddress,
        area: rider.location?.area,
        city: rider.location?.city,
        state: rider.location?.state,
        pincode: rider.location?.pincode
      },

      isPartnerActive: rider.isPartnerActive,

      // vehicleInfo: rider.vehicleInfo,
      selfie: rider.selfie,

      onboardingStage: rider.onboardingStage,
      lastOtpVerifiedAt: rider.lastOtpVerifiedAt
    };

    // 🔥 Remove empty / undefined objects
Object.keys(data).forEach(key => {
  if (key === "partnerId") return; // 👈 keep it always

  if (
    data[key] == null ||
    (typeof data[key] === "object" &&
      Object.keys(data[key]).length === 0)
  ) {
    delete data[key];
  }
});

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data
    });

  } catch (err) {
    console.error("Get Clean Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
exports.getAllDocuments = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const rider = await Rider.findById(riderId).select("kyc");

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      data: rider.kyc || {}
    });

  } catch (err) {
    console.error("Get Documents Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



exports.updateProfile = async (req, res) => {
  try {
    const riderId = req.rider._id;
    const updateData = {};

    /* ---------------- DEBUG (KEEP TEMPORARILY) ---------------- */
    // console.log("REQ BODY:", req.body);
    // console.log("REQ FILE:", req.file);

    /* ---------------- HANDLE TEXT FIELDS (SINGLE / MULTIPLE) ---------------- */
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && req.body[key] !== "") {
        updateData[key] = req.body[key];
      }
    });

    /* ---------------- HANDLE SELFIE (AZURE) ---------------- */
    if (req.file) {
      const selfieUrl = await uploadToAzure(req.file, "selfies");
      updateData.selfie = selfieUrl;
    }

    /* ---------------- VALIDATION ---------------- */
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update"
      });
    }

    /* ---------------- UPDATE ---------------- */
    const updatedRider = await Rider.findByIdAndUpdate(
      riderId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedRider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }


    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updateData
    });

  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getBankDetails = async (req, res) => {
  try {
    const rider = await Rider.findById(req.rider._id).select("bankDetails");

    return res.status(200).json({
      success: true,
      data: rider?.bankDetails || {},
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
      (count, asset) => asset.condition === "BAD" ? count + 1 : count,
      0
    );

    // 🔹 OPTIONAL: return only OPEN issues
    const issues = (doc.issues || []).filter(
      (issue) => issue.status === "OPEN"
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


// exports.getMyAssetsSummary = async (req, res) => {
//   try {
//     const riderId = req.rider._id;

//     const doc = await RiderAssets.findOne({ riderId }).lean();

//     if (!doc || !doc.assets || doc.assets.length === 0) {
//       return res.status(200).json({
//         success: true,
//         data: {
//           totalAssets: 0,
//           badConditionCount: 0,
//           canRaiseRequest: false,
//           assets: [],
//         },
//       });
//     }

//     let totalAssets = 0;
//     let badConditionCount = 0;

//     const formattedAssets = doc.assets.map(asset => {
//       const qty = asset.quantity || 1;

//       totalAssets += qty;

//       if (asset.condition === "BAD") {
//         badConditionCount += qty;
//       }

//       return {
//         assetId: asset._id,
//         assetType: asset.assetType,
//         assetName: asset.assetName,
//         quantity: qty,
//         condition: asset.condition,
//         issuedDate: asset.issuedDate,
//         canRaiseRequest: asset.condition === "BAD",
//       };
//     });

//     // return res.status(200).json({
//     //   success: true,
//     //   data: {
//     //     totalAssets,
//     //     badConditionCount,
//     //     canRaiseRequest: badConditionCount > 0,
//     //     assets: formattedAssets,


        
//     //   },
//     // });


//     return res.status(200).json({
//   success: true,
//   data: {
//     totalProducts: formattedAssets.length,
//     totalAssets,
//     badConditionCount,
//     canRaiseRequest: badConditionCount > 0,
//     assets: formattedAssets
//   }
// });

//   } catch (error) {
//     console.error("Assets Summary Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch asset summary",
//     });
//   }
// };
exports.getWalletDetails = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const rider = await Rider.findById(riderId)
      .select("wallet")
      .lean();

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet details fetched successfully",
      data: rider.wallet || {}
    });

  } catch (err) {
    console.error("Get Wallet Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// exports.updateDocuments = async (req, res) => {
//   try {
//     const riderId = req.rider?._id;
//     if (!riderId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const rider = await Rider.findById(riderId);
//     if (!rider) {
//       return res.status(404).json({ success: false, message: "Rider not found" });
//     }

//     rider.kyc = rider.kyc || {};
//     const updatedDocs = [];
//     const warnings = [];

//     /* ================= PAN ================= */
//     if (req.files?.panImage?.length) {
//       const panFile = req.files.panImage[0];

//       let text;
//       try {
//         text = await extractTextFromImage(panFile);
//         console.log("PAN OCR TEXT 👉", text);
//       } catch (err) {
//         return res.status(400).json({ success: false, message: err.message });
//       }

//       const panNumber = extractPAN(text);

//       if (!panNumber) {
//         warnings.push("PAN not detected. Please enter PAN manually.");
//       } else {
//         const panUrl = await uploadToAzure(panFile, "pan");

//         rider.kyc.pan = {
//           number: panNumber,
//           image: panUrl,

//           // ✅ INITIAL STATE
//           status: "pending",
//           isVerified: false,

//           updatedAt: new Date()
//         };

//         updatedDocs.push("PAN");
//       }
//     }

//     /* ================= DRIVING LICENSE ================= */
//     if (req.files?.dlFrontImage?.length) {
//       const dlFrontFile = req.files.dlFrontImage[0];

//       let text;
//       try {
//         text = await extractTextFromImage(dlFrontFile);
//       } catch (err) {
//         return res.status(400).json({ success: false, message: err.message });
//       }

//       const dlNumber = extractDL(text);
//       const expiryDate = extractDLExpiry(text);

//       if (!dlNumber) {
//         warnings.push("Driving License number not detected clearly.");
//       } else {
//         const expiryAlert = isExpiringWithinOneMonth(expiryDate);

//         const frontUrl = await uploadToAzure(dlFrontFile, "dl-front");
//         const backUrl = req.files?.dlBackImage?.length
//           ? await uploadToAzure(req.files.dlBackImage[0], "dl-back")
//           : rider.kyc.drivingLicense?.backImage || null;

//         rider.kyc.drivingLicense = {
//           number: dlNumber,
//           frontImage: frontUrl,
//           backImage: backUrl,
//           expiryDate,
//           expiryAlert,

//           // ✅ INITIAL STATE
//           status: "pending",
//           isVerified: false,

//           updatedAt: new Date()
//         };

//         updatedDocs.push("Driving License");
//       }
//     }

//     if (
//   !req.files?.panImage?.length &&
//   !req.files?.dlFrontImage?.length
// ) {
//   return res.status(400).json({
//     success: false,
//     message: "No documents uploaded"
//   });
// }

//     /* ================= MANUAL ENTRY REQUIRED ================= */
// if (updatedDocs.length === 0 && warnings.length > 0) {
//   return res.status(200).json({
//     success: true,
//     message: `${warnings[0]} Please enter manually.`,
//     data: {
//       enterManually: true,
//       document: warnings[0].includes("Driving License")
//         ? "drivingLicense"
//         : "pan"
//     }
//   });
// }


//     /* ================= NO VALID UPDATE ================= */
// /* ================= FINAL RESPONSE ================= */
// const responseData = {};

// if (updatedDocs.includes("PAN")) {
//   responseData.pan = {
//     number: rider.kyc.pan.number,
//     image: rider.kyc.pan.image,
//     status: rider.kyc.pan.status
//   };
// }

// if (updatedDocs.includes("Driving License")) {
//   responseData.drivingLicense = {
//     number: rider.kyc.drivingLicense.number,
//     frontImage: rider.kyc.drivingLicense.frontImage,
//     backImage: rider.kyc.drivingLicense.backImage,
//     status: rider.kyc.drivingLicense.status
//   };
// }

// return res.status(200).json({
//   success: true,
//   message: `${updatedDocs.join(" & ")} submitted successfully`,
//   warnings,
//   data: responseData
// });
//   } catch (err) {
//     console.error("Update Documents Error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };
exports.updateDocuments = async (req, res) => {
  try {
    const riderId = req.rider._id;

    /* =====================================================
       PAN – IMAGE UPLOAD
       ===================================================== */
    if (req.files?.panImage?.length) {
      const panFile = req.files.panImage[0];

      let text = null;
      try {
        text = await extractTextFromImage(panFile);
      } catch {}

      const panNumber = text ? extractPAN(text) : null;

      // ❌ OCR FAILED
      if (!panNumber) {
        const rider = await Rider.findByIdAndUpdate(
          riderId,
          { $inc: { "kyc.pan.ocrAttempts": 1 } },
          { new: true }
        );

        const attempts = rider.kyc.pan.ocrAttempts;

        if (attempts >= 2 && !rider.kyc.pan.allowManual) {
          rider.kyc.pan.allowManual = true;
          await rider.save();
        }

        return res.status(400).json({
          success: false,
          message:
            attempts >= 2
              ? "PAN image is not clear. Please update manually."
              : "PAN image is blur. Please upload a clear image.",
          allowManual: attempts >= 2
        });
      }
      const panImageUrl = await uploadToAzure(panFile, "pan");

      // ✅ OCR SUCCESS
      await Rider.findByIdAndUpdate(
        riderId,
        {
          $set: {
            "kyc.pan.number": panNumber,
            "kyc.pan.image":panImageUrl,
            "kyc.pan.status": "pending",
            "kyc.pan.isVerified": false,
            "kyc.pan.ocrAttempts": 0,
            "kyc.pan.allowManual": false,
            "kyc.pan.updatedAt": new Date()
          }
        },
      );

      return res.status(200).json({
        success: true,
        message: "PAN uploaded successfully",
        data: {
          pan: { number: panNumber },

          image: panImageUrl


        }
      });
    }

    /* =====================================================
       PAN – MANUAL UPDATE
       ===================================================== */
    if (req.body.panNumber) {
      const rider = await Rider.findById(riderId);

      if (!rider.kyc?.pan?.allowManual) {
        return res.status(403).json({
          success: false,
          message: "Manual PAN update not allowed yet"
        });
      }

      rider.kyc.pan.number = req.body.panNumber;
      rider.kyc.pan.status = "pending";
      rider.kyc.pan.isVerified = false;
      rider.kyc.pan.allowManual = false;
      rider.kyc.pan.updatedAt = new Date();

      await rider.save();

      return res.status(200).json({
        success: true,
        message: "PAN updated manually",
        data: {
          pan: rider.kyc.pan
        }
      });
    }

    /* =====================================================
       DRIVING LICENSE – IMAGE UPLOAD
       ===================================================== */
    if (req.files?.dlFrontImage?.length) {
      const dlFile = req.files.dlFrontImage[0];

      let text = null;
      try {
        text = await extractTextFromImage(dlFile);
      } catch {}

      const dlNumber = text ? extractDL(text) : null;
      const expiryDate = text ? extractDLExpiry(text) : null;

      // ❌ OCR FAILED
      if (!dlNumber) {
        const rider = await Rider.findByIdAndUpdate(
          riderId,
          { $inc: { "kyc.drivingLicense.ocrAttempts": 1 } },
          { new: true }
        );

        const attempts = rider.kyc.drivingLicense.ocrAttempts;

        if (attempts >= 2 && !rider.kyc.drivingLicense.allowManual) {
          rider.kyc.drivingLicense.allowManual = true;
          await rider.save();
        }

        return res.status(400).json({
          success: false,
          message:
            attempts >= 2
              ? "Image is not clear. Please update manually."
              : "Driving License image is blur. Please upload a clear image.",
          allowManual: attempts >= 2
        });
      }

      // ✅ OCR SUCCESS
      await Rider.findByIdAndUpdate(
        riderId,
        {
          $set: {
            "kyc.drivingLicense.number": dlNumber,
            "kyc.drivingLicense.frontImage": await uploadToAzure(dlFile, "dl-front"),
            "kyc.drivingLicense.backImage": req.files?.dlBackImage?.length
              ? await uploadToAzure(req.files.dlBackImage[0], "dl-back")
              : null,
            "kyc.drivingLicense.expiryDate": expiryDate,
            "kyc.drivingLicense.expiryAlert": expiryDate
              ? isExpiringWithinOneMonth(expiryDate)
              : false,
            "kyc.drivingLicense.status": "pending",
            "kyc.drivingLicense.isVerified": false,
            "kyc.drivingLicense.ocrAttempts": 0,
            "kyc.drivingLicense.allowManual": false,
            "kyc.drivingLicense.updatedAt": new Date()
          }
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Driving License uploaded successfully",
        data: {
          drivingLicense: { number: dlNumber }
        }
      });
    }

    /* =====================================================
       DRIVING LICENSE – MANUAL UPDATE
       ===================================================== */
    if (req.body.dlNumber) {
      const rider = await Rider.findById(riderId);

      if (!rider.kyc?.drivingLicense?.allowManual) {
        return res.status(403).json({
          success: false,
          message: "Manual Driving License update not allowed yet"
        });
      }

      rider.kyc.drivingLicense.number = req.body.dlNumber;
      rider.kyc.drivingLicense.expiryDate = req.body.expiryDate || null;
      rider.kyc.drivingLicense.status = "pending";
      rider.kyc.drivingLicense.isVerified = false;
      rider.kyc.drivingLicense.allowManual = false;
      rider.kyc.drivingLicense.updatedAt = new Date();

      await rider.save();

      return res.status(200).json({
        success: true,
        message: "Driving License updated manually",
        data: {
          drivingLicense: rider.kyc.drivingLicense
        }
      });
    }

    /* =====================================================
       NO VALID INPUT
       ===================================================== */
    return res.status(400).json({
      success: false,
      message: "No valid input"
    });

  } catch (err) {
    console.error("Update Documents Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
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

    const riderId = req.rider._id;
    const { filter, date, month, year } = req.query;

    let dateFilter = {};
    const todayStr = new Date().toISOString().slice(0, 10);

    /* ---------------- DATE FILTER ---------------- */

    if (filter === "daily") {
      dateFilter.date = normalizeDate(date) || todayStr;
    }

    else if (filter === "weekly") {

      const today = new Date();
      const day = today.getDay() || 7;

      const start = new Date(today);
      start.setDate(today.getDate() - day + 1);

      const weekDates = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        weekDates.push(d.toISOString().slice(0, 10));
      }

      dateFilter.date = { $in: weekDates };
    }

    else if (filter === "monthly") {

      const y = Number(year) || new Date().getFullYear();
      const m = Number(month) || new Date().getMonth() + 1;
      const days = new Date(y, m, 0).getDate();

      const monthDates = [];

      for (let i = 1; i <= days; i++) {
        monthDates.push(
          `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`
        );
      }

      dateFilter.date = { $in: monthDates };
    }

    /* ---------------- FETCH SLOT BOOKINGS ---------------- */

    const bookings = await SlotBooking.find({
      riderId,
      ...dateFilter
    }).lean();

    if (!bookings.length) {
      return res.json({
        success: true,
        filter: filter || "all",
        totalSlots: 0,
        totalEarnings: 0,
        data: []
      });
    }

    /* ---------------- FETCH ALL ORDERS ONCE ---------------- */

    const dates = bookings.map(b => b.date);

    const dayStart = new Date(`${dates[0]}T00:00:00.000Z`);
    const dayEnd = new Date(`${dates[dates.length - 1]}T23:59:59.999Z`);

    const allOrders = await Order.find({
      riderId,
      createdAt: { $gte: dayStart, $lte: dayEnd }
    }).lean();

    /* ---------------- GROUP ORDERS BY DATE ---------------- */

    const ordersByDate = {};

    allOrders.forEach(order => {

      const d = new Date(order.createdAt)
        .toISOString()
        .slice(0, 10);

      if (!ordersByDate[d]) {
        ordersByDate[d] = [];
      }

      ordersByDate[d].push(order);
    });

    /* ---------------- BUILD RESPONSE ---------------- */

    let totalEarnings = 0;
    const data = [];

    for (const booking of bookings) {

      const orders = ordersByDate[booking.date] || [];

      const completed = orders.filter(
        o => o.orderStatus?.toUpperCase() === "DELIVERED"
      );

      const canceled = orders.filter(
        o => o.orderStatus?.toUpperCase() === "CANCELED"
      );

      const slotEarnings = completed.reduce(
        (sum, o) => sum + Number(o.riderEarning?.total || 0),
        0
      );

      totalEarnings += slotEarnings;

      // SLOT STATUS
      let slotStatus = "ACTIVE";

      if (booking.status === "CANCELED") {
        slotStatus = "CANCELED";
      } else {

        const slotEnd = new Date(`${booking.date}T${booking.endTime}:00`);
        const now = new Date();

        if (slotEnd < now) {
          slotStatus = "COMPLETED";
        }
      }

      data.push({
        slotBookingId: booking._id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        slotStatus,
        totalOrders: orders.length,
        completedOrders: completed.length,
        canceledOrders: canceled.length,
        slotEarnings
      });
    }

    return res.json({
      success: true,
      filter: filter || "all",
      totalSlots: data.length,
      totalEarnings,
      data
    });

  } catch (err) {

    console.error("Slot History Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};





exports.getRiderOrderHistory = async (req, res) => {
  try {
    const riderId = req.rider?._id;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "Rider ID missing"
      });
    }

    const { filter = "all" } = req.query;
    let dateFilter = {};

    // ---------- DATE FILTERS ----------
    if (filter === "daily") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      dateFilter.createdAt = { $gte: start, $lte: end };
    }

    if (filter === "weekly") {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      dateFilter.createdAt = { $gte: start, $lte: new Date() };
    }

    if (filter === "monthly") {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      dateFilter.createdAt = { $gte: start, $lte: end };
    }

    // ---------- FETCH ORDERS ----------
    const orders = await Order.find({
      riderId,
      orderStatus: "DELIVERED",
      ...dateFilter
    }).sort({ createdAt: -1 });

    // ---------- TOTALS ----------
    const totalOrders = orders.length;

    const totalEarnings = orders.reduce(
      (sum, o) => sum + (o.pricing?.totalAmount || 0),
      0
    );

    const totalDistance = orders.reduce(
      (sum, o) => sum + (o.tracking?.distanceInKm || 0),
      0
    );

    const ratings = orders
      .map(o => o.rating)
      .filter(r => typeof r === "number");

    const avgRating =
      ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null;

    // ---------- RESPONSE ----------
    const data = orders.map(order => ({
      orderId: order.orderId,

      items: order.items?.map(item => ({
        itemName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })) || [],

      pricing: {
        itemTotal: order.pricing?.itemTotal || 0,
        deliveryFee: order.pricing?.deliveryFee || 0,
        tax: order.pricing?.tax || 0,
        platformCommission: order.pricing?.platformCommission || 0,
        totalAmount: order.pricing?.totalAmount || 0
      },

      customerTip: order.payment?.tip || 0,

      distanceTravelled: order.tracking?.distanceInKm || 0,

      durationInMin: order.tracking?.durationInMin || 0,
      pickupAddress: order.pickupAddress?.addressLine || "",

      rating: order.rating || null,

deliveredAddress: order.deliveryAddress?.addressLine || "",
  deliveredAt: order.deliveredAt || order.updatedAt || null

    }));

    return res.status(200).json({
      success: true,
      filter,
      totalOrders,
      totalEarnings,
      totalDistance,
      avgRating,
      data
    });

  } catch (err) {
    console.error("Order History Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
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
    if (!req.rider?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider",
      });
    }

    // ✅ READ NESTED BODY
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

    // ✅ VALIDATION
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

    await Rider.findByIdAndUpdate(
      req.rider._id,
      {
        $set: {
          bankDetails: {
            bankName: bankName.trim(),
            accountHolderName: accountHolderName.trim(),
            accountType,
            branch,
            accountNumber,
            ifscCode: ifscCode.toUpperCase(),
            addedBankAccount: true,
            ifscVerificationStatus: "PENDING",
            bankVerificationStatus: "PENDING",
            verifiedAt: null,
          },
        },
      },
      { runValidators: true }
    );

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
 
    const formattedAssets = doc.assets.map(asset => {
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
 
    // return res.status(200).json({
    //   success: true,
    //   data: {
    //     totalAssets,
    //     badConditionCount,
    //     canRaiseRequest: badConditionCount > 0,
    //     assets: formattedAssets,
 
 
       
    //   },
    // });
 
 
    return res.status(200).json({
  success: true,
  data: {
    totalProducts: formattedAssets.length,
    totalAssets,
    badConditionCount,
    canRaiseRequest: badConditionCount > 0,
    assets: formattedAssets
  }
});
 
  } catch (error) {
    console.error("Assets Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch asset summary",
    });
  }
};
 


 


 