const axios = require("axios");
const prisma = require("../config/prisma");

 const GOOGLE_KEY = process.env.GOOGLE_KEY;
exports.getBestRoute = async function getRouteEstimate(req, res) {
  try {
    const { originLat, originLng, destLat, destLng } = req.body;
 
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({
        success: false,
        message: "Missing coordinates"
      });
    }
 
    const url = "https://maps.googleapis.com/maps/api/directions/json";
 
    const response = await axios.get(url, {
      params: {
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        alternatives: true, 
        mode: "driving",
        key: GOOGLE_KEY
      }
    });
 
    const routes = response.data.routes.map((route, index) => {
      const leg = route.legs[0];
 
      return {
        routeIndex: index + 1,
        distance: {
          text: leg.distance.text,
          value: leg.distance.value 
        },
        duration: {
          text: leg.duration.text,
          value: leg.duration.value 
        },
        estimatedArrivalTime: new Date(
          Date.now() + leg.duration.value * 1000
        ),
        polyline: route.overview_polyline.points,
        summary: route.summary
      };
    });
 
    return res.json({
      success: true,
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      totalRoutes: routes.length,
      routes
    });
 
  } catch (err) {
    console.error("Google Maps error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch route estimate"
    });
  }
}



exports.getRiderLiveLocation = async (req, res) => {
  try {

    const { deliveryId } = req.params;

    if (!deliveryId) {
      return res.status(400).json({
        success: false,
        message: "deliveryId is required"
      });
    }

    // Find order using deliveryId
    const order = await prisma.order.findUnique({
      where: {
        deliveryId
      },
      select: {
        riderId: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!order.riderId) {
      return res.status(404).json({
        success: false,
        message: "Rider not assigned yet"
      });
    }

    // Find rider GPS
    const riderGps = await prisma.riderGps.findUnique({
      where: {
        riderId: order.riderId
      }
    });
    // console.log("riderGps : " , riderGps)

    if (!riderGps) {
      return res.status(404).json({
        success: false,
        message: "Rider GPS not found"
      });
    }

    return res.status(200).json({
      delivery_id: deliveryId,
      lat: riderGps.latitude,
      lng: riderGps.longitude,
      timestamp: riderGps.updatedAt
    });

  } catch (error) {

    console.log(
      "Get Rider Live Location Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


exports.getOrderLiveTracking = async (req, res) => {
  try {

    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required"
      });
    }

    // Find order with rider details
    const order = await prisma.order.findUnique({
      where: {
        orderId: orderId
      },

      include: {
        Rider: true,
        OrderPickupAddress: true,
        OrderDeliveryAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!order.riderId) {
      return res.status(404).json({
        success: false,
        message: "Rider not assigned yet"
      });
    }

    // Get rider GPS
    const riderGps = await prisma.riderGps.findUnique({
      where: {
        riderId: order.riderId
      }
    });

    if (!riderGps) {
      return res.status(404).json({
        success: false,
        message: "Rider GPS not found"
      });
    }

    // Manual event handling
    let currentEvent = "SEARCHING_FOR_RIDER";

    if (order.orderStatus === "ASSIGNED") {
      currentEvent = "RIDER_EN_ROUTE_TO_PICKUP";
    }

    if (order.orderStatus === "CONFIRMED") {
      currentEvent = "RIDER_ARRIVED_AT_PICKUP";
    }

    if (order.orderStatus === "PICKED_UP") {
      currentEvent = "ORDER_PICKED_UP";
    }

    if (order.orderStatus === "DELIVERED") {
      currentEvent = "DELIVERED";
    }

    if (order.orderStatus === "CANCELLED") {
      currentEvent = "DELIVERY_FAILED";
    }

    // Extra custom handling
    // you can later update manually
    // IN_TRANSIT
    // RIDER_ARRIVED_AT_DROP

    return res.status(200).json({
      success: true,

      data: {

        event: currentEvent,

        deliveryId: order.deliveryId,

        referenceOrderId: order.orderId,

        timestamp: new Date(),

        rider: {
          id: order.Rider.id,

          name:
            order.Rider.fullName || "Rider",

          phone:
            order.Rider.phoneNumber,

          vehicleType:
            order.Rider.vehicleType || "BIKE"
        },

        geoCoordinates: {
          lat: riderGps.latitude,
          lng: riderGps.longitude,
          accuracy: riderGps.accuracy,
          heading: riderGps.heading,
          speed: riderGps.speed,
          updatedAt: riderGps.updatedAt
        },

        // pickupAddress: order.OrderPickupAddress,

        // deliveryAddress:
        //   order.OrderDeliveryAddress
      }
    });

  } catch (error) {

    console.log(
      "Get Live Tracking Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
