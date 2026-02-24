const WebSocket = require("ws");

const jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");
 
const prisma = new PrismaClient();
 
/**

* riderId -> ws

*/

const riderSockets = new Map();
 
/**

* orderId -> Set<ws>

*/

const orderRooms = new Map();
 
const initWebSocket = (server) => {

  const wss = new WebSocket.Server({

    server,

    path: "/ws",

  });
 
  console.log("🟢 WebSocket server running at /ws");
 
  wss.on("connection", async (ws, req) => {

    try {

      /* ============================

         🔍 PARSE QUERY PARAMS

      ============================ */

      const query = req.url.split("?")[1];

      if (!query) {

        ws.close(4001, "Query params required");

        return;

      }
 
      const params = new URLSearchParams(query);

      const type = params.get("type");

      const token = params.get("token");

      const orderId = params.get("orderId");

      const role = params.get("role");

      const userId = params.get("userId");
 
      /* ============================

         🔐 JWT AUTH

      ============================ */

      if (!token) {

        ws.close(4002, "JWT token required");

        return;

      }
 
      let decoded;

      try {

        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      } catch (err) {

        ws.close(4010, "Invalid or expired token");

        return;

      }
 
      if (decoded.type !== "access") {

        ws.close(4012, "Access token required");

        return;

      }
 
      /* ============================

         1️⃣ RIDER NOTIFICATION SOCKET

      ============================ */

      if (type === "RIDER_NOTIFICATION") {

        const riderId = decoded.riderId;

        if (!riderId) {

          ws.close(4011, "riderId missing in token");

          return;

        }
 
        ws.riderId = riderId;

        ws.socketType = "RIDER_NOTIFICATION";
 
        riderSockets.set(riderId, ws);

        console.log("🔔 Rider notification connected:", riderId);
 
        ws.on("close", () => {

          riderSockets.delete(riderId);

        });
 
        return;

      }
 
      /* ============================

         2️⃣ ORDER TRACKING SOCKET

      ============================ */

      if (!orderId || !role) {

        ws.close(4003, "orderId & role required");

        return;

      }
 
      /* ============================

         🔎 FETCH ORDER (PRISMA)

      ============================ */

      const order = await prisma.order.findUnique({

        where: { orderId },

        select: {

          id: true,

          orderStatus: true,

          riderId: true,

        },

      });
 
      if (!order) {

        ws.close(4040, "Order not found");

        return;

      }
 
      /* ============================

         🔐 ROLE VALIDATION

      ============================ */

      if (role === "RIDER") {

        const riderId = decoded.riderId;

        if (!riderId) {

          ws.close(4011, "riderId missing in token");

          return;

        }
 
        // 🚫 Rider not assigned to this order

        if (order.riderId !== riderId) {

          ws.close(4031, "Rider not assigned to this order");

          return;

        }
 
        ws.riderId = riderId;

      }
 
      if (role === "CUSTOMER" && !userId) {

        ws.close(4005, "userId required for customer");

        return;

      }
 
      /* ============================

         🏠 JOIN ORDER ROOM

      ============================ */

      ws.socketType = "ORDER_TRACKING";

      ws.orderId = orderId;

      ws.role = role;

      ws.userId = userId;
 
      if (!orderRooms.has(orderId)) {

        orderRooms.set(orderId, new Set());

      }
 
      orderRooms.get(orderId).add(ws);

      console.log(`📦 ${role} joined order ${orderId}`);
 
      /* ============================

         📡 RIDER LIVE LOCATION

      ============================ */

      ws.on("message", (msg) => {

        if (ws.role !== "RIDER") return;
 
        let data;

        try {

          data = JSON.parse(msg.toString());

        } catch {

          return;

        }
 
        if (

          typeof data.lat !== "number" ||

          typeof data.lng !== "number"

        ) {

          return;

        }
 
        const payload = JSON.stringify({

          type: "LIVE_LOCATION",

          orderId,

          riderId: ws.riderId,

          lat: data.lat,

          lng: data.lng,

          ts: Date.now(),

        });
 
        const clients = orderRooms.get(orderId);

        if (!clients) return;
 
        for (const client of clients) {

          if (client.readyState === WebSocket.OPEN) {

            client.send(payload);

          }

        }

      });
 
      ws.on("close", () => {

        const room = orderRooms.get(orderId);

        if (room) {

          room.delete(ws);

          if (room.size === 0) {

            orderRooms.delete(orderId);

          }

        }

        console.log(`❌ ${role} left order ${orderId}`);

      });
 
    } catch (err) {

      console.error("💥 WS error:", err);

      ws.close(4000, "WebSocket error");

    }

  });

};
 
/* ============================

   🔔 PUSH MESSAGE TO RIDER

============================ */

const notifyRider = (riderId, payload) => {

  const ws = riderSockets.get(riderId);

  if (ws && ws.readyState === WebSocket.OPEN) {

    ws.send(JSON.stringify(payload));

  }

};
 
module.exports = {

  initWebSocket,

  notifyRider,

};

 