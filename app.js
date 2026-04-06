const express = require("express");
const { swaggerSetup } = require("./docs/swagger");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const riderRouter = require("./routes/riderRoute");
const locationRouter = require("./routes/locationRoute");
const aadharRoute = require("./routes/aadharRoutes");
const bankDetailsRoutes = require("./routes/bankDetailsRoutes");
const kitRouter = require("./routes/kitAddressRoutes");
const slotRouter = require("./routes/slotsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const staticRouter = require("./routes/staticMobileOtpRoute");
const profileRoutes = require("./routes/profileRoutes");
const incentiveRoutes = require("./routes/incentiveRoutes");
const adminRouterIncentives = require("./routes/adminInccentiveRoutes");
const riderIncentiveRoutes = require("./routes/incentiveRiderRoutes");
const webIncentiveRoutes = require("./routes/order.routes");
const riderIncentiveProgressRoutes = require("./routes/riderIncentiveProgress.routes");
const kitRoutes = require("./routes/kitSelectionRoutes");

// const webRiderRoutes = require("./routes/rider.routes");

const riderEarningsRoutes = require("./routes/riderEarningsRoutes");

const issueRouter = require("./routes/issueRoutes");

const pricingConfigRoutes = require("./routes/pricingConfigRoutes");

const notificationRoutes = require("./routes/notificationRoutes");
const fcmTokenRoutes = require("./routes/fcmTokenRoutes");
const riderStatusRoutes = require("./routes/riderStatus.routes");
const riderCashRoutes = require("./routes/riderCashRoutes");
const orderStateReady = require("./routes/readyStateRouter");
const rawPayloadRoutes = require("./routes/rawPayloadRoutes");
const companySelectionRoutes = require("./routes/companySelectionRoutes");

// const offlineStoreRoute = require("./routes/offlineStoreRoute");

const app = express();

// app.use(cors())
app.use(
  cors({
    origin: "*", // You can restrict later to your frontend URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "Origin",
      "Content-Length",
      "Content-Disposition",
    ],
    credentials: false, // change to true ONLY if using cookies
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(morgan("dev"));
// app.use("/uploads", express.static("uploads"));

// Swagger
swaggerSetup(app);

// Routes
app.use("/api", riderRouter);
app.use("/api/location", locationRouter);
app.use("/aadhar", aadharRoute);
app.use("/api/bank", bankDetailsRoutes);

app.use("/api/mobile", staticRouter);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/incentives", adminRouterIncentives);

app.use("/api/rider", kitRouter);
app.use("/api/slots", slotRouter);
app.use("/api/rider/assets", require("./routes/riderAssetsRoutes"));

// app.use("/api/offline-stores", offlineStoreRoute);

// app.use("/api/admin/offline-stores", offlineStoreRoute);

app.use("/api/profile", profileRoutes);

app.use("/api/home", incentiveRoutes);

app.use("/api/rider/incentives", riderIncentiveRoutes);

app.use("/api/issues", issueRouter);
app.use("/api/raw", rawPayloadRoutes);

app.use("/api/rider/earnings", riderEarningsRoutes);

app.use("/api/orders", require("./routes/orderRoutes"));

app.use("/api/aerial", require("./routes/gpsRoutes"));
app.use("/api/web", webIncentiveRoutes);
// app.use("/api/web",webRiderRoutes)

app.use("/api", pricingConfigRoutes);

app.use("/api/rider/incentives", riderIncentiveProgressRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/rider/notifications", fcmTokenRoutes);
app.use("/api/rider", require("./routes/rider.routes"));
app.use("/api/rider/status", riderStatusRoutes);
app.use("/api", riderCashRoutes);

//orderState Ready
app.use("/api", orderStateReady);
app.use("/api/rider-incentives", riderIncentiveProgressRoutes);
app.use("/api/rider", require("./routes/availableRidersRoutes"));
app.use("/api/kit", kitRoutes);
app.use("/api/company", companySelectionRoutes);

app.get("/", (req, res) => {
  res.send("Vega Delivery Partner API Running. Open /api-docs");
});

module.exports = app;
