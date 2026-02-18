const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
 
const riderSockets = new Map();   // riderId -> ws
const orderRooms = new Map();     // orderId -> Set<ws>
 
const initWebSocket = (server) => {
  const wss = new WebSocket.Server({
    server,
    path: "/ws",
  });
 
  console.log("🟢 WebSocket server running at /ws");
 
  wss.on("connection", (ws, req) => {
    console.log("🟡 WS connection:", req.url);
 
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
      const token = params.get("token");     // ✅ FIXED
      const orderId = params.get("orderId");
      const role = params.get("role");
      const userId = params.get("userId");
 
      /* ============================
         🔐 JWT AUTH (ACCESS TOKEN)
      ============================ */
      if (!token) {
        ws.close(4002, "JWT token required");
        return;
      }
 
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET); // ✅ FIXED
      } catch (err) {
        console.error("❌ JWT error:", err.message);
        ws.close(4010, "Invalid or expired token");
        return;
      }
 
      if (decoded.type !== "access") {
        ws.close(4012, "Access token required");
        return;
      }
 
      const riderId = decoded.riderId;
      if (!riderId) {
        ws.close(4011, "riderId missing in token");
        return;
      }
 
      ws.riderId = riderId;
 
      /* ============================
         1️⃣ RIDER NOTIFICATION SOCKET
      ============================ */
      if (type === "RIDER_NOTIFICATION") {
        riderSockets.set(riderId.toString(), ws);
        ws.socketType = "RIDER_NOTIFICATION";
 
        console.log("🔔 Rider connected:", riderId);
 
        ws.on("close", () => {
          riderSockets.delete(riderId.toString());
          console.log("❌ Rider disconnected:", riderId);
        });
 
        ws.on("error", (err) => {
          console.error("🔥 Rider WS error:", err.message);
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
 
      if (role === "CUSTOMER" && !userId) {
        ws.close(4005, "userId required for customer");
        return;
      }
 
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
         📡 RIDER LOCATION STREAM
      ============================ */
      ws.on("message", (msg) => {
        if (ws.role !== "RIDER") return;
 
        let data;
        try {
          data = JSON.parse(msg.toString());
        } catch {
          return;
        }
 
        if (!data.lat || !data.lng) return;
 
        const payload = JSON.stringify({
          type: "LIVE_LOCATION",
          orderId,
          riderId,
          lat: data.lat,
          lng: data.lng,
          ts: Date.now(),
        });
 
        for (const client of orderRooms.get(orderId)) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        }
      });
 
      ws.on("close", () => {
        orderRooms.get(orderId)?.delete(ws);
        if (orderRooms.get(orderId)?.size === 0) {
          orderRooms.delete(orderId);
        }
        console.log(`❌ ${role} left order ${orderId}`);
      });
 
    } catch (err) {
      console.error("💥 WS fatal error:", err);
      ws.close(4000, "WebSocket error");
    }
  });
};
 
/* ============================
   🔔 SEND PUSH TO RIDER
============================ */
const notifyRider = (riderId, payload) => {
  const ws = riderSockets.get(riderId.toString());
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};
 
module.exports = {
  initWebSocket,
  notifyRider,
};
 
 