

 
// const dotenv = require("dotenv");
 
// dotenv.config();
 
// const http = require("http");
 
// const connectDB = require("./config/db");
 
// const app = require("./app");
 
// const initWebSocket = require("./webSocket");
 
// // DB
 
// connectDB();
 
// // Create HTTP server
 
// const server = http.createServer(app);
 
// // Init WebSocket
 
 
 
// // Start server
 
// const PORT = process.env.PORT || 4000;
 
// server.listen(PORT, () => {
 
//   console.log(`Server running at http://localhost:${PORT}`);
 
// });
 
 
 
 
 
 
const dotenv = require("dotenv");
dotenv.config();
const cron = require("node-cron");
const { sendSlotStartReminder, sendSlotStartedNotification ,sendMissedSlotNotification } = require("./notifications/slotNotification");
 
const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");
const {initWebSocket} = require("./webSocket");
// const { initRiderSocket } = require("./sockets/rider.socket");
 
 
connectDB();
 
// ONE HTTP SERVER
const server = http.createServer(app);
 
// Attach WebSocket to SAME server
initWebSocket(server);  
// initRiderSocket(server);




cron.schedule("*/2 * * * *", sendSlotStartReminder); // every 2 mins
cron.schedule("*/1 * * * *", sendSlotStartedNotification);  // every 1 min
cron.schedule("*/2 * * * *", sendMissedSlotNotification);

 
const PORT = process.env.PORT || 4000;
 
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
 
 
 