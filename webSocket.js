 

// const WebSocket = require("ws");
// const jwt = require("jsonwebtoken");
// const { PrismaClient } = require("@prisma/client");

// const prisma = new PrismaClient();

// const riderSockets = new Map();
// const orderRooms = new Map();

// const initWebSocket = (server) => {
//   const wss = new WebSocket.Server({
//     server,
//     path: "/ws",
//   });

//   console.log("🟢 WebSocket server running at /ws");

//   wss.on("connection", async (ws, req) => {
//     try {
//       const query = req.url.split("?")[1];

//       if (!query) {
//         ws.close(4001, "Query params required");
//         return;
//       }

//       const params = new URLSearchParams(query);

//       const type = params.get("type");
//       const token = params.get("token");
//       const orderId = params.get("orderId");
//       const role = params.get("role")?.toUpperCase(); // ✅ FIXED
//       const userId = params.get("userId");

//       console.log("🟡 Incoming:", { type, orderId, role });

//       if (!token) {
//         ws.close(4002, "JWT token required");
//         return;
//       }

//       let decoded;

//       try {
//         decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
//       } catch (err) {
//         ws.close(4010, "Invalid or expired token");
//         return;
//       }

//       if (decoded.type !== "access") {
//         ws.close(4012, "Access token required");
//         return;
//       }

//       /* ============================
//          RIDER NOTIFICATION
//       ============================ */
//       if (type === "RIDER_NOTIFICATION") {
//         const riderId = decoded.riderId;

//         if (!riderId) {
//           ws.close(4011, "riderId missing in token");
//           return;
//         }

//         ws.riderId = riderId;
//         ws.socketType = "RIDER_NOTIFICATION";

//         riderSockets.set(riderId, ws);

//         console.log("🔔 Rider notification connected:", riderId);

//         ws.on("close", () => {
//           riderSockets.delete(riderId);
//         });

//         return;
//       }

//       if (!orderId || !role) {
//         ws.close(4003, "orderId & role required");
//         return;
//       }

//       /* ============================
//          FETCH ORDER
//       ============================ */
//       const order = await prisma.order.findUnique({
//         where: { orderId },
//         select: {
//           id: true,
//           orderStatus: true,
//           riderId: true,
    
//         },
//       });

//       if (!order) {
//         ws.close(4040, "Order not found");
//         return;
//       }

//       /* ============================
//          ROLE VALIDATION
//       ============================ */

//       if (role === "RIDER") {
//         const riderId = decoded.riderId;

//         if (!riderId) {
//           ws.close(4011, "riderId missing in token");
//           return;
//         }

//         if (order.riderId !== riderId) {
//           ws.close(4031, "Rider not assigned to this order");
//           return;
//         }

//         ws.riderId = riderId;
//       }

//       if (role === "CUSTOMER") {
//         if (!userId) {
//           ws.close(4005, "userId required for customer");
//           return;
//         }

//         // ✅ OPTIONAL BUT IMPORTANT
//         if (order.userId && order.userId !== userId) {
//           ws.close(4032, "User not allowed for this order");
//           return;
//         }
//       }

//       /* ============================
//          JOIN ROOM
//       ============================ */

//       ws.socketType = "ORDER_TRACKING";
//       ws.orderId = orderId;
//       ws.role = role;
//       ws.userId = userId;

//       if (!orderRooms.has(orderId)) {
//         orderRooms.set(orderId, new Set());
//       }

//       orderRooms.get(orderId).add(ws);

//       console.log(`📦 ${role} joined order ${orderId}`);
//       console.log("👥 Room size:", orderRooms.get(orderId).size);

//       /* ============================
//          MESSAGE HANDLER
//       ============================ */

//       ws.on("message", async (msg) => {
//         let data;

//         try {
//           data = JSON.parse(msg.toString());
//         } catch {
//           console.log("❌ Invalid JSON");
//           return;
//         }

//         console.log("📩 Incoming:", data);

//         const clients = orderRooms.get(ws.orderId);

//         console.log(
//           "📡 Clients:",
//           [...(clients || [])].map((c) => c.role)
//         );

//         /* ============================
//            LIVE LOCATION
//         ============================ */
//         if (
//           ws.role === "RIDER" &&
//           typeof data.lat === "number" &&
//           typeof data.lng === "number"
//         ) {
//           const payload = JSON.stringify({
//             type: "LIVE_LOCATION",
//             orderId: ws.orderId,
//             riderId: ws.riderId,
//             lat: data.lat,
//             lng: data.lng,
//             ts: Date.now(),
//           });

//           console.log("📡 Sending location to:", clients?.size);

//           for (const client of clients || []) {
//             if (client.readyState === WebSocket.OPEN) {
//               client.send(payload);
//             }
//           }

//           return;
//         }

//         /* ============================
//            CHAT MESSAGE
//         ============================ */
//         if (data.type === "CHAT_MESSAGE") {
//           if (!data.message || typeof data.message !== "string") {
//             console.log("❌ Invalid message payload");
//             return;
//           }

//           const senderId =
//             ws.role === "RIDER" ? ws.riderId : ws.userId;

//           console.log("💬 Chat:", ws.role, data.message);

//           const payload = JSON.stringify({
//             type: "CHAT_MESSAGE",
//             orderId: ws.orderId,
//             message: data.message,
//             senderId,
//             senderRole: ws.role,
//             createdAt: Date.now(),
//           });

//           console.log("📤 Broadcasting to:", clients?.size);

//           for (const client of clients || []) {
//             if (client.readyState === WebSocket.OPEN) {
//               client.send(payload);
//             }
//           }

//           return;
//         }
//       });

//       /* ============================
//          CLEANUP
//       ============================ */

//       ws.on("close", () => {
//         const room = orderRooms.get(ws.orderId);

//         if (room) {
//           room.delete(ws);

//           if (room.size === 0) {
//             orderRooms.delete(ws.orderId);
//           }
//         }

//         console.log(`❌ ${role} left order ${ws.orderId}`);
//       });
//     } catch (err) {
//       console.error("💥 WS error:", err);
//       ws.close(4000, "WebSocket error");
//     }
//   });
// };

// const notifyRider = (riderId, payload) => {
//   const ws = riderSockets.get(riderId);

//   if (ws && ws.readyState === WebSocket.OPEN) {
//     ws.send(JSON.stringify(payload));
//   }
// };

// module.exports = {
//   initWebSocket,
//   notifyRider,
// };
const WebSocket = require("ws");

const jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");
 
const prisma = new PrismaClient();
 
const riderSockets = new Map();

const orderRooms = new Map();
 
/* =========================================================

   WEBSOCKET INIT

========================================================= */
 
const initWebSocket = (server) => {
 
  const wss = new WebSocket.Server({

    server,

    path: "/ws",

  });
 
  console.log("🟢 WebSocket server running at /ws");
 
  wss.on("connection", async (ws, req) => {
 
    try {
 
      const query = req.url.split("?")[1];
 
      if (!query) {

        ws.close(4001, "Query params required");

        return;

      }
 
      const params = new URLSearchParams(query);
 
      const type = params.get("type");

      const token = params.get("token");

      const orderId = params.get("orderId");

      const role = params.get("role")?.toUpperCase();

      const userId = params.get("userId");
 
      console.log("🟡 Incoming:", {

        type,

        orderId,

        role

      });
 
      if (!token) {

        ws.close(4002, "JWT token required");

        return;

      }
 
      let decoded;
 
      try {
 
        decoded = jwt.verify(

          token,

          process.env.JWT_ACCESS_SECRET

        );
 
      } catch (err) {
 
        ws.close(4010, "Invalid or expired token");

        return;

      }
 
      if (decoded.type !== "access") {

        ws.close(4012, "Access token required");

        return;

      }
 
      /* =========================================================

         RIDER NOTIFICATION SOCKET

      ========================================================= */
 
      if (type === "RIDER_NOTIFICATION") {
 
        const riderId = decoded.riderId;
 
        if (!riderId) {

          ws.close(4011, "riderId missing in token");

          return;

        }
 
        // ✅ VALIDATE RIDER STATUS

        const rider = await prisma.rider.findUnique({

          where: {

            id: riderId

          },
 
          select: {

            id: true,

            isFullyRegistered: true,

            isOnline: true,

            orderState: true

          }

        });
 
        if (

          !rider ||

          !rider.isFullyRegistered ||

          !rider.isOnline ||

          rider.orderState !== "READY"

        ) {
 
          console.log("❌ Rider not eligible:", riderId);
 
          ws.close(4030, "Rider not eligible");
 
          return;

        }
 
        ws.riderId = riderId;

        ws.socketType = "RIDER_NOTIFICATION";
 
        riderSockets.set(riderId, ws);
 
        console.log("🔔 Rider notification connected:", riderId);
 
        ws.on("close", () => {
 
          riderSockets.delete(riderId);
 
          console.log("❌ Rider disconnected:", riderId);

        });
 
        return;

      }
 
      /* =========================================================

         ORDER TRACKING VALIDATION

      ========================================================= */
 
      if (!orderId || !role) {

        ws.close(4003, "orderId & role required");

        return;

      }
 
      const order = await prisma.order.findUnique({

        where: {

          orderId

        },
 
        select: {

          id: true,

          orderStatus: true,

          riderId: true,

          userId: true

        }

      });
 
      if (!order) {

        ws.close(4040, "Order not found");

        return;

      }
 
      /* =========================================================

         RIDER VALIDATION

      ========================================================= */
 
      if (role === "RIDER") {
 
        const riderId = decoded.riderId;
 
        if (!riderId) {

          ws.close(4011, "riderId missing in token");

          return;

        }
 
        if (order.riderId !== riderId) {

          ws.close(4031, "Rider not assigned to this order");

          return;

        }
 
        ws.riderId = riderId;

      }
 
      /* =========================================================

         CUSTOMER VALIDATION

      ========================================================= */
 
      if (role === "CUSTOMER") {
 
        if (!userId) {

          ws.close(4005, "userId required");

          return;

        }
 
        if (order.userId && order.userId !== userId) {

          ws.close(4032, "User not allowed");

          return;

        }

      }
 
      /* =========================================================

         JOIN ROOM

      ========================================================= */
 
      ws.socketType = "ORDER_TRACKING";

      ws.orderId = orderId;

      ws.role = role;

      ws.userId = userId;
 
      if (!orderRooms.has(orderId)) {

        orderRooms.set(orderId, new Set());

      }
 
      orderRooms.get(orderId).add(ws);
 
      console.log(`📦 ${role} joined order ${orderId}`);
 
      /* =========================================================

         MESSAGE HANDLER

      ========================================================= */
 
      ws.on("message", async (msg) => {
 
        let data;
 
        try {
 
          data = JSON.parse(msg.toString());
 
        } catch {
 
          console.log("❌ Invalid JSON");

          return;

        }
 
        const clients = orderRooms.get(ws.orderId);
 
        /* =========================================================

           LIVE LOCATION

        ========================================================= */
 
        if (

          ws.role === "RIDER" &&

          typeof data.lat === "number" &&

          typeof data.lng === "number"

        ) {
 
          const payload = JSON.stringify({

            type: "LIVE_LOCATION",

            orderId: ws.orderId,

            riderId: ws.riderId,

            lat: data.lat,

            lng: data.lng,

            ts: Date.now(),

          });
 
          for (const client of clients || []) {
 
            if (client.readyState === WebSocket.OPEN) {

              client.send(payload);

            }

          }
 
          return;

        }
 
        /* =========================================================

           CHAT MESSAGE

        ========================================================= */
 
        if (data.type === "CHAT_MESSAGE") {
 
          if (

            !data.message ||

            typeof data.message !== "string"

          ) {

            return;

          }
 
          const senderId =

            ws.role === "RIDER"

              ? ws.riderId

              : ws.userId;
 
          const payload = JSON.stringify({

            type: "CHAT_MESSAGE",

            orderId: ws.orderId,

            message: data.message,

            senderId,

            senderRole: ws.role,

            createdAt: Date.now(),

          });
 
          for (const client of clients || []) {
 
            if (client.readyState === WebSocket.OPEN) {

              client.send(payload);

            }

          }
 
          return;

        }

      });
 
      /* =========================================================

         CLEANUP

      ========================================================= */
 
      ws.on("close", () => {
 
        const room = orderRooms.get(ws.orderId);
 
        if (room) {
 
          room.delete(ws);
 
          if (room.size === 0) {

            orderRooms.delete(ws.orderId);

          }

        }
 
        console.log(`❌ ${role} left order ${ws.orderId}`);

      });
 
    } catch (err) {
 
      console.error("💥 WS error:", err);
 
      ws.close(4000, "WebSocket error");

    }

  });

};

/* =========================================================

   NOTIFY RIDER

========================================================= */
 
const notifyRider = async (riderId, payload) => {
 
  try {
 
    // ✅ REVALIDATE RIDER

    const rider = await prisma.rider.findUnique({

      where: {

        id: riderId

      },
 
      select: {

        isFullyRegistered: true,

        isOnline: true,

        orderState: true

      }

    });
 
    if (

      !rider ||

      !rider.isFullyRegistered ||

      !rider.isOnline ||

      rider.orderState !== "READY"

    ) {
 
      console.log("❌ Popup blocked:", riderId);
 
      riderSockets.delete(riderId);
 
      return;

    }
 
    const ws = riderSockets.get(riderId);
 
    if (

      ws &&

      ws.readyState === WebSocket.OPEN

    ) {
 
      ws.send(JSON.stringify(payload));
 
      console.log("✅ Popup sent:", riderId);
 
    } else {
 
      console.log("❌ Socket not available:", riderId);
 
      riderSockets.delete(riderId);

    }
 
  } catch (err) {
 
    console.log("❌ notifyRider error:", err.message);

  }

};

const notifyRiderIncentive =async (
  riderId,
  payload
) => {

  try {

    const ws =
      riderSockets.get(riderId);

    if (
      ws &&
      ws.readyState ===
      WebSocket.OPEN
    ) {

      ws.send(
        JSON.stringify(payload)
      );
    }

  } catch (err) {

    console.log(
      "notify incentive error",
      err.message
    );
  }
};
module.exports = {

  initWebSocket,

  notifyRider,

  notifyRiderIncentive

};
 