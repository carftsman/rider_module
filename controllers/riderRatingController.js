const prisma = require("../config/prisma");

exports.submitRiderRating = async (req, res) => {
  try {
    const riderIdFromToken = req.rider.id; // ✅ from middleware

    const { orderId, rating, review } = req.body;

    // 1. Validate rating
    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 0 and 5"
      });
    }

    // 2. Find order
    const order = await prisma.order.findUnique({
      where: { orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Invalid orderId"
      });
    }

    // 3. Status checks
    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Order is cancelled, rating not allowed"
      });
    }

    if (order.orderStatus !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "You can rate only after delivery"
      });
    }

    // 4. Ensure rider matches (IMPORTANT)
    if (order.riderId !== riderIdFromToken) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to rate this order"
      });
    }

    // 5. Duplicate check
    const existingRating = await prisma.riderRating.findFirst({
      where: { orderId }
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: "Rating already submitted for this order"
      });
    }

    // 6. Save rating
    const ratingData = await prisma.riderRating.create({
      data: {
        orderId,
        riderId: riderIdFromToken,
        rating,
        review
      }
    });

    return res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      data: ratingData
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



exports.getRiderRatings = async (req, res) => {
  try {
    const riderId = req.rider.id; // 🔥 from token

    const ratings = await prisma.riderRating.findMany({
      where: { riderId },
      orderBy: { createdAt: "desc" },
    });

    let sum = 0;

    ratings.forEach((r) => {
      sum += r.rating;
    });

    const averageRating =
      ratings.length === 0 ? 0 : sum / ratings.length;

    return res.json({
      success: true,
      riderId,
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings: ratings.length,
      ratings,
    });
  } catch (err) {
      console.error("🔥 REAL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};