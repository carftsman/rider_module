// const WebSocket = require("ws");

// let riderSockets = new Map();

// const initRiderSocket = (server) => {

//   const wss = new WebSocket.Server({ server });

//   console.log("✅ WebSocket Server Initialized");

//   wss.on("connection", (ws) => {

//     console.log("Rider WS Connected");

//     ws.on("message", (data) => {

//       const msg = JSON.parse(data);

//       if (msg.type === "JOIN_RIDER") {

//         riderSockets.set(msg.riderId, ws);

//         console.log("Rider Registered:", msg.riderId);

//       }

//     });

//     ws.on("close", () => {

//       for (let [riderId, socket] of riderSockets.entries()) {

//         if (socket === ws) {

//           riderSockets.delete(riderId);

//           console.log("Rider Disconnected:", riderId);

//         }

//       }

//     });

//   });

// };

// // Emit function
// const emitRiderDashboard = (riderId, payload) => {

//   const socket = riderSockets.get(riderId);

//   if (socket && socket.readyState === WebSocket.OPEN) {

//     socket.send(JSON.stringify(payload));

//   }

// };

// module.exports = {

//   initRiderSocket,

//   emitRiderDashboard

// };
const WebSocket = require("ws");

let riderSockets = new Map();        // riderId => ws
let orderSockets = new Map();        // orderId => Set(ws)

const initRiderSocket = (server) => {

  const wss = new WebSocket.Server({ server });

  console.log("✅ WebSocket Server Initialized");

  wss.on("connection", (ws) => {

    console.log("🔌 Client Connected");

    ws.on("message", async (data) => {

      const msg = JSON.parse(data);

      // ================= RIDER JOIN =================

      if (msg.type === "JOIN_RIDER") {

        ws.riderId = msg.riderId;

        riderSockets.set(msg.riderId, ws);

        console.log("🚴 Rider Registered:", msg.riderId);
      }

      // ================= USER JOIN ORDER =================

      if (msg.type === "JOIN_ORDER") {

        const { orderId } = msg;

        ws.orderId = orderId;

        if (!orderSockets.has(orderId)) {
          orderSockets.set(orderId, new Set());
        }

        orderSockets.get(orderId).add(ws);

        console.log("📦 User joined order room:", orderId);
      }

    });

    ws.on("close", () => {

      // ---------- Remove Rider Socket ----------

      if (ws.riderId) {
        riderSockets.delete(ws.riderId);
        console.log("❌ Rider disconnected:", ws.riderId);
      }

      // ---------- Remove Order Socket ----------

      if (ws.orderId) {

        const clients = orderSockets.get(ws.orderId);

        if (clients) {

          clients.delete(ws);

          if (clients.size === 0) {
            orderSockets.delete(ws.orderId);
          }

        }

        console.log("❌ User left order room:", ws.orderId);
      }

    });

  });

};


// ================= EMIT TO RIDER =================

const emitRiderDashboard = (riderId, payload) => {

  const socket = riderSockets.get(riderId);

  if (socket && socket.readyState === WebSocket.OPEN) {

    socket.send(JSON.stringify(payload));

  }

};


// ================= EMIT TO ORDER USERS =================

const emitOrderStatus = (orderId, payload) => {

  const clients = orderSockets.get(orderId);

  if (!clients) return;

  clients.forEach(ws => {

    if (ws.readyState === WebSocket.OPEN) {

      ws.send(JSON.stringify(payload));

    }

  });

};


module.exports = {

  initRiderSocket,

  emitRiderDashboard,

  emitOrderStatus

};
