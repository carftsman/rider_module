// const Order = require("../models/OrderSchema");
// const EarningSummary = require("../models/EarningSummary");

// /* ===================== CONSTANTS ===================== */

// const MONTH_MAP = {
//   jan: "01",
//   feb: "02",
//   mar: "03",
//   apr: "04",
//   may: "05",
//   jun: "06",
//   jul: "07",
//   aug: "08",
//   sep: "09",
//   oct: "10",
//   nov: "11",
//   dec: "12"
// };

// const VALID_MONTHS = Object.keys(MONTH_MAP);

// /* ===================== HELPERS ===================== */

// const getMonthDateRange = (year, monthNum) => {
//   const start = `${year}-${monthNum}-01`;
//   const endDate = new Date(start);
//   endDate.setMonth(endDate.getMonth() + 1);
//   const end = endDate.toISOString().slice(0, 10);
//   return { start, end };
// };

// const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

// /* ===================== MONTH ===================== */
// /**
//  * GET /api/earnings/jan
//  */
// const getMonthEarnings = async (req, res, next) => {
//   try {
//     const monthKey = req.params.param.toLowerCase();

//     if (!VALID_MONTHS.includes(monthKey)) {
//       return next(); // not month → go to next route
//     }

//     const riderId = req.rider._id;
//     const year = new Date().getFullYear();
//     const { start, end } = getMonthDateRange(year, MONTH_MAP[monthKey]);

//     const summaries = await EarningSummary.find({
//       riderId,
//       date: { $gte: start, $lt: end }
//     })
//       .sort({ date: 1 })
//       .lean();

//     let totalOrders = 0;
//     let totalEarnings = 0;
//     const weeks = [];

//     let currentWeek = null;

//     summaries.forEach(day => {
//       const d = new Date(day.date);
//       const weekStart = new Date(d);
//       weekStart.setDate(d.getDate() - d.getDay());
//       const weekKey = weekStart.toISOString().slice(0, 10);

//       if (!currentWeek || currentWeek.from !== weekKey) {
//         currentWeek = {
//           from: weekKey,
//           to: day.date,
//           ordersCompleted: 0,
//           totalEarnings: 0
//         };
//         weeks.push(currentWeek);
//       }

//       currentWeek.to = day.date;
//       currentWeek.ordersCompleted += day.ordersCompleted;
//       currentWeek.totalEarnings += day.totalEarnings;

//       totalOrders += day.ordersCompleted;
//       totalEarnings += day.totalEarnings;
//     });

//     res.json({
//       from: start,
//       to: end,
//       totalOrders,
//       totalEarnings,
//       weeks
//     });
//   } catch (err) {
//     console.error("getMonthEarnings", err);
//     res.status(500).json({ message: "Failed to fetch month earnings" });
//   }
// };

// /* ===================== WEEK ===================== */
// /**
//  * GET /api/earnings/week?start=YYYY-MM-DD&end=YYYY-MM-DD
//  */
// const getWeekEarnings = async (req, res) => {
//   try {
//     const riderId = req.rider._id;
//     const { start, end } = req.query;

//     if (!isValidDate(start) || !isValidDate(end)) {
//       return res.status(400).json({ message: "Invalid date range" });
//     }

//     const summaries = await EarningSummary.find({
//       riderId,
//       date: { $gte: start, $lte: end }
//     })
//       .sort({ date: 1 })
//       .lean();

//     let totalOrders = 0;
//     let totalEarnings = 0;

//     const days = summaries.map(day => {
//       totalOrders += day.ordersCompleted;
//       totalEarnings += day.totalEarnings;

//       return {
//         date: day.date,
//         ordersCompleted: day.ordersCompleted
//       };
//     });

//     res.json({
//       from: start,
//       to: end,
//       totalOrders,
//       totalEarnings,
//       days
//     });
//   } catch (err) {
//     console.error("getWeekEarnings", err);
//     res.status(500).json({ message: "Failed to fetch week earnings" });
//   }
// };

// /* ===================== DAY ===================== */
// /**
//  * GET /api/earnings/2026-01-07
//  */
// const getDayEarnings = async (req, res, next) => {
//   try {
//     const date = req.params.param;

//     if (!isValidDate(date)) {
//       return next(); // not a date → maybe month
//     }

//     const riderId = req.rider._id;

//     const summary = await EarningSummary.findOne({
//       riderId,
//       date
//     }).lean();

//     if (!summary) {
//       return res.json({
//         date,
//         ordersCompleted: 0,
//         orders: []
//       });
//     }

//     const orders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       createdAt: {
//         $gte: new Date(`${date}T00:00:00.000Z`),
//         $lte: new Date(`${date}T23:59:59.999Z`)
//       }
//     })
//       .select("orderId")
//       .lean();

//     res.json({
//       date,
//       ordersCompleted: summary.ordersCompleted,
//       orders: orders.map(o => o.orderId)
//     });
//   } catch (err) {
//     console.error("getDayEarnings", err);
//     res.status(500).json({ message: "Failed to fetch day earnings" });
//   }
// };

// /* ===================== ORDER DETAIL ===================== */
// /**
//  * GET /api/earnings/orders/:orderId
//  */
// const getOrderEarningDetail = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       riderId: req.rider._id,
//       orderId: req.params.orderId,
//       orderStatus: "DELIVERED"
//     }).lean();

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const e = order.riderEarning || {};

//     res.json({
//       orderId: order.orderId,
//       earnings: {
//         basePay: e.basePay || 0,
//         distancePay: e.distancePay || 0,
//         surgePay: e.surgePay || 0,
//         tips: e.tips || 0,
//         total:
//           (e.basePay || 0) +
//           (e.distancePay || 0) +
//           (e.surgePay || 0) +
//           (e.tips || 0)
//       }
//     });
//   } catch (err) {
//     console.error("getOrderEarningDetail", err);
//     res.status(500).json({ message: "Failed to fetch order earnings" });
//   }
// };

// module.exports = {
//   getMonthEarnings,
//   getWeekEarnings,
//   getDayEarnings,
//   getOrderEarningDetail
// };

// const Order = require("../models/OrderSchema");
// const EarningSummary = require("../models/EarningSummary");

// /* ===================== CONSTANTS ===================== */

// const MONTH_MAP = {
//   jan: "01", feb: "02", mar: "03", apr: "04",
//   may: "05", jun: "06", jul: "07", aug: "08",
//   sep: "09", oct: "10", nov: "11", dec: "12"
// };

// const VALID_MONTHS = Object.keys(MONTH_MAP);

// /* ===================== HELPERS ===================== */

// const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

// const getDayRange = (date) => {
//   const start = new Date(date);
//   start.setHours(0, 0, 0, 0);

//   const end = new Date(date);
//   end.setHours(23, 59, 59, 999);

//   return { start, end };
// };

// const getMonthRange = (year, month) => {
//   const start = `${year}-${month}-01`;
//   const d = new Date(start);
//   d.setMonth(d.getMonth() + 1);
//   const end = d.toISOString().slice(0, 10);
//   return { start, end };
// };

// /* ===================== MONTH ===================== */
// /**
//  * GET /api/earnings/jan
//  */
// const getMonthEarnings = async (req, res, next) => {
//   try {
//     const key = req.params.param.toLowerCase();
//     if (!VALID_MONTHS.includes(key)) return next();

//     const riderId = req.rider._id;
//     const year = new Date().getFullYear();
//     const { start, end } = getMonthRange(year, MONTH_MAP[key]);

//     const summaries = await EarningSummary.find({
//       riderId,
//       date: { $gte: start, $lt: end }
//     }).sort({ date: 1 }).lean();

//     const orders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       createdAt: { $gte: new Date(start), $lt: new Date(end) }
//     })
//       .select("orderId createdAt")
//       .lean();

//     let totalOrders = 0;
//     let totalEarnings = 0;
//     const weeks = [];

//     let currentWeek = null;

//     summaries.forEach(day => {
//       const d = new Date(day.date);
//       let weekStart = new Date(d);
//       weekStart.setDate(d.getDate() - d.getDay());
//       if (weekStart < new Date(start)) weekStart = new Date(start);

//       const weekKey = weekStart.toISOString().slice(0, 10);

//       if (!currentWeek || currentWeek.from !== weekKey) {
//         currentWeek = {
//           from: weekKey,
//           to: day.date,
//           ordersCompleted: 0,
//           totalEarnings: 0,
//           orders: []
//         };
//         weeks.push(currentWeek);
//       }

//       currentWeek.to = day.date;
//       currentWeek.ordersCompleted += day.ordersCompleted;
//       currentWeek.totalEarnings += day.totalEarnings;

//       totalOrders += day.ordersCompleted;
//       totalEarnings += day.totalEarnings;
//     });

//     orders.forEach(o => {
//       const od = o.createdAt.toISOString().slice(0, 10);
//       const week = weeks.find(w => od >= w.from && od <= w.to);
//       if (week) week.orders.push(o.orderId);
//     });

//     res.json({
//       from: start,
//       to: end,
//       totalOrders,
//       totalEarnings,
//       weeks
//     });
//   } catch (err) {
//     console.error("getMonthEarnings", err);
//     res.status(500).json({ message: "Failed to fetch month earnings" });
//   }
// };

// /* ===================== WEEK ===================== */
// /**
//  * GET /api/earnings/week?start=YYYY-MM-DD&end=YYYY-MM-DD
//  */
// const getWeekEarnings = async (req, res) => {
//   try {
//     const { start, end } = req.query;
//     if (!isValidDate(start) || !isValidDate(end)) {
//       return res.status(400).json({ message: "Invalid date range" });
//     }

//     const riderId = req.rider._id;

//     const summaries = await EarningSummary.find({
//       riderId,
//       date: { $gte: start, $lte: end }
//     }).sort({ date: 1 }).lean();

//     const days = [];

//     summaries.forEach(d => {
//       days.push({
//         date: d.date,
//         ordersCompleted: d.ordersCompleted,
//         orders: []
//       });
//     });

//     const orders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       createdAt: {
//         $gte: new Date(`${start}T00:00:00`),
//         $lte: new Date(`${end}T23:59:59`)
//       }
//     })
//       .select("orderId createdAt")
//       .lean();

//     orders.forEach(o => {
//       const d = o.createdAt.toISOString().slice(0, 10);
//       const day = days.find(x => x.date === d);
//       if (day) day.orders.push(o.orderId);
//     });

//     const totalOrders = days.reduce((s, d) => s + d.ordersCompleted, 0);
//     const totalEarnings = summaries.reduce((s, d) => s + d.totalEarnings, 0);

//     res.json({
//       from: start,
//       to: end,
//       totalOrders,
//       totalEarnings,
//       days
//     });
//   } catch (err) {
//     console.error("getWeekEarnings", err);
//     res.status(500).json({ message: "Failed to fetch week earnings" });
//   }
// };

// /* ===================== DAY ===================== */
// /**
//  * GET /api/earnings/2026-01-07
//  */
// const getDayEarnings = async (req, res, next) => {
//   try {
//     const date = req.params.param;
//     if (!isValidDate(date)) return next();

//     const riderId = req.rider._id;
//     const summary = await EarningSummary.findOne({ riderId, date }).lean();
//     const { start, end } = getDayRange(date);

//     const orders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       createdAt: { $gte: start, $lte: end }
//     })
//       .select("orderId")
//       .lean();

//     res.json({
//       date,
//       ordersCompleted: summary?.ordersCompleted || orders.length,
//       orders: orders.map(o => o.orderId)
//     });
//   } catch (err) {
//     console.error("getDayEarnings", err);
//     res.status(500).json({ message: "Failed to fetch day earnings" });
//   }
// };

// /* ===================== ORDER DETAIL ===================== */
// /**
//  * GET /api/earnings/orders/:orderId
//  */
// const getOrderEarningDetail = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       riderId: req.rider._id,
//       orderId: req.params.orderId,
//       orderStatus: "DELIVERED"
//     }).lean();

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const e = order.riderEarning || {};

//     res.json({
//       orderId: order.orderId,
//       earnings: {
//         basePay: e.basePay || 0,
//         distancePay: e.distancePay || 0,
//         surgePay: e.surgePay || 0,
//         tips: e.tips || 0,
//         total:
//           (e.basePay || 0) +
//           (e.distancePay || 0) +
//           (e.surgePay || 0) +
//           (e.tips || 0)
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch order earnings" });
//   }
// };

// const getEarningsSummary = async (req, res) => {
//   try {
//     const riderId = req.rider._id;
//     const today = new Date().toISOString().slice(0, 10);
//     const monthStart = today.slice(0, 7) + "-01";

//     const todaySummary = await EarningSummary.findOne(
//       { riderId, date: today },
//       { totalEarnings: 1 }
//     ).lean();

//     const monthAgg = await EarningSummary.aggregate([
//       { $match: { riderId, date: { $gte: monthStart } } },
//       { $group: { _id: null, total: { $sum: "$totalEarnings" } } }
//     ]);

//     res.json({
//       todayEarnings: todaySummary?.totalEarnings || 0,
//       monthEarnings: monthAgg[0]?.total || 0
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch earnings summary" });
//   }
// };


// module.exports = {
//   getMonthEarnings,
//   getWeekEarnings,
//   getDayEarnings,
//   getOrderEarningDetail,
//   getEarningsSummary
// };


// const Order = require("../models/OrderSchema");
// const EarningSummary = require("../models/EarningSummary");

// /* ===================== CONSTANTS ===================== */

// const MONTH_MAP = {
//   jan: "01", feb: "02", mar: "03", apr: "04",
//   may: "05", jun: "06", jul: "07", aug: "08",
//   sep: "09", oct: "10", nov: "11", dec: "12"
// };

// const VALID_MONTHS = Object.keys(MONTH_MAP);

// /* ===================== HELPERS ===================== */

// const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

// const getMonthRange = (year, month) => {
//   const start = `${year}-${month}-01`;
//   const d = new Date(start);
//   d.setMonth(d.getMonth() + 1);
//   const end = d.toISOString().slice(0, 10);
//   return { start, end };
// };

// /* ===================== MONTH ===================== */
// /**
//  * GET /api/earnings/jan
//  * Shows: weeks + orders
//  */
// const getMonthEarnings = async (req, res, next) => {
//   try {
//     const key = req.params.param.toLowerCase();
//     if (!VALID_MONTHS.includes(key)) return next();

//     const riderId = req.rider._id;
//     const year = new Date().getFullYear();
//     const { start, end } = getMonthRange(year, MONTH_MAP[key]);

//     // ---- summaries (for totals) ----
//     const summaries = await EarningSummary.find({
//       riderId,
//       date: { $gte: start, $lt: end }
//     }).sort({ date: 1 }).lean();

//     // ---- orders (DATE STRING MATCH - SAFE) ----
//     const orders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       $expr: {
//         $and: [
//           {
//             $gte: [
//               { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//               start
//             ]
//           },
//           {
//             $lt: [
//               { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//               end
//             ]
//           }
//         ]
//       }
//     })
//       .select("orderId createdAt")
//       .lean();

//     let totalOrders = 0;
//     let totalEarnings = 0;
//     const weeks = [];
//     let currentWeek = null;

//     summaries.forEach(day => {
//       const d = new Date(day.date);
//       let weekStart = new Date(d);
//       weekStart.setDate(d.getDate() - d.getDay());

//       const monthStart = new Date(start);
//       if (weekStart < monthStart) weekStart = monthStart;

//       const weekKey = weekStart.toISOString().slice(0, 10);

//       if (!currentWeek || currentWeek.from !== weekKey) {
//         currentWeek = {
//           from: weekKey,
//           to: day.date,
//           ordersCompleted: 0,
//           totalEarnings: 0,
//           orders: []
//         };
//         weeks.push(currentWeek);
//       }

//       currentWeek.to = day.date;
//       currentWeek.ordersCompleted += day.ordersCompleted;
//       currentWeek.totalEarnings += day.totalEarnings;

//       totalOrders += day.ordersCompleted;
//       totalEarnings += day.totalEarnings;
//     });

//     // attach orders into correct week
//     orders.forEach(o => {
//       const od = o.createdAt.toISOString().slice(0, 10);
//       const week = weeks.find(w => od >= w.from && od <= w.to);
//       if (week) week.orders.push(o.orderId);
//     });

//     res.json({
//       from: start,
//       to: end,
//       totalOrders,
//       totalEarnings,
//       weeks
//     });
//   } catch (err) {
//     console.error("getMonthEarnings", err);
//     res.status(500).json({ message: "Failed to fetch month earnings" });
//   }
// };

// /* ===================== WEEK ===================== */
// /**
//  * GET /api/earnings/week?start=YYYY-MM-DD&end=YYYY-MM-DD
//  * Shows: days + orders
//  */
// const getWeekEarnings = async (req, res) => {
//   try {
//     const { start, end } = req.query;
//     if (!isValidDate(start) || !isValidDate(end)) {
//       return res.status(400).json({ message: "Invalid date range" });
//     }

//     const riderId = req.rider._id;

//     const summaries = await EarningSummary.find({
//       riderId,
//       date: { $gte: start, $lte: end }
//     }).sort({ date: 1 }).lean();

//     const days = summaries.map(d => ({
//       date: d.date,
//       ordersCompleted: d.ordersCompleted,
//       orders: []
//     }));

//     const orders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       $expr: {
//         $and: [
//           {
//             $gte: [
//               { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//               start
//             ]
//           },
//           {
//             $lte: [
//               { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//               end
//             ]
//           }
//         ]
//       }
//     })
//       .select("orderId createdAt")
//       .lean();

//     orders.forEach(o => {
//       const d = o.createdAt.toISOString().slice(0, 10);
//       const day = days.find(x => x.date === d);
//       if (day) day.orders.push(o.orderId);
//     });

//     const totalOrders = summaries.reduce((s, d) => s + d.ordersCompleted, 0);
//     const totalEarnings = summaries.reduce((s, d) => s + d.totalEarnings, 0);

//     res.json({
//       from: start,
//       to: end,
//       totalOrders,
//       totalEarnings,
//       days
//     });
//   } catch (err) {
//     console.error("getWeekEarnings", err);
//     res.status(500).json({ message: "Failed to fetch week earnings" });
//   }
// };

// /* ===================== DAY ===================== */
// /**
//  * GET /api/earnings/2026-01-07
//  * Shows: orders only
//  */
// const getDayEarnings = async (req, res, next) => {
//   try {
//     const date = req.params.param;
//     if (!isValidDate(date)) return next();

//     const riderId = req.rider._id;

//     const summary = await EarningSummary.findOne({ riderId, date }).lean();

//     const orders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       $expr: {
//         $eq: [
//           { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           date
//         ]
//       }
//     })
//       .select("orderId")
//       .lean();

//     res.json({
//       date,
//       ordersCompleted: summary?.ordersCompleted || orders.length,
//       orders: orders.map(o => o.orderId)
//     });
//   } catch (err) {
//     console.error("getDayEarnings", err);
//     res.status(500).json({ message: "Failed to fetch day earnings" });
//   }
// };

// /* ===================== ORDER DETAIL ===================== */
// /**
//  * GET /api/earnings/orders/:orderId
//  * Shows: earnings breakup
//  */
// const getOrderEarningDetail = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       riderId: req.rider._id,
//       orderId: req.params.orderId,
//       orderStatus: "DELIVERED"
//     }).lean();

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const e = order.riderEarning || {};

//     res.json({
//       orderId: order.orderId,
//       earnings: {
//         basePay: e.basePay || 0,
//         distancePay: e.distancePay || 0,
//         surgePay: e.surgePay || 0,
//         tips: e.tips || 0,
//         total:
//           (e.basePay || 0) +
//           (e.distancePay || 0) +
//           (e.surgePay || 0) +
//           (e.tips || 0)
//       }
//     });
//   } catch (err) {
//     console.error("getOrderEarningDetail", err);
//     res.status(500).json({ message: "Failed to fetch order earnings" });
//   }
// };

// const getEarningsSummary = async (req, res) => {
//   try {
//     const riderId = req.rider._id;

//     const today = new Date().toISOString().slice(0, 10);

//     // ----- TODAY -----
//     const todaySummary = await EarningSummary.findOne(
//       { riderId, date: today },
//       { ordersCompleted: 1, totalEarnings: 1 }
//     ).lean();

//     // ----- WEEK (Mon → Sun) -----
//     const now = new Date();
//     const day = now.getDay() || 7;

//     const weekStart = new Date(now);
//     weekStart.setDate(now.getDate() - day + 1);
//     weekStart.setHours(0, 0, 0, 0);

//     const weekEnd = new Date(weekStart);
//     weekEnd.setDate(weekStart.getDate() + 6);
//     weekEnd.setHours(23, 59, 59, 999);

//     const weekStartStr = weekStart.toISOString().slice(0, 10);
//     const weekEndStr = weekEnd.toISOString().slice(0, 10);

//     const weekAgg = await EarningSummary.aggregate([
//       {
//         $match: {
//           riderId,
//           date: { $gte: weekStartStr, $lte: weekEndStr }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           ordersCompleted: { $sum: "$ordersCompleted" },
//           totalEarnings: { $sum: "$totalEarnings" }
//         }
//       }
//     ]);

//     // ----- MONTH -----
//     const monthStart = today.slice(0, 7) + "-01";

//     const monthAgg = await EarningSummary.aggregate([
//       {
//         $match: {
//           riderId,
//           date: { $gte: monthStart }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           ordersCompleted: { $sum: "$ordersCompleted" },
//           totalEarnings: { $sum: "$totalEarnings" }
//         }
//       }
//     ]);

//     res.json({
//       today: {
//         date: today,
//         ordersCompleted: todaySummary?.ordersCompleted || 0,
//         totalEarnings: todaySummary?.totalEarnings || 0
//       },
//       week: {
//         from: weekStartStr,
//         to: weekEndStr,
//         ordersCompleted: weekAgg[0]?.ordersCompleted || 0,
//         totalEarnings: weekAgg[0]?.totalEarnings || 0
//       },
//       month: {
//         from: monthStart,
//         to: today.slice(0, 7) + "-31",
//         ordersCompleted: monthAgg[0]?.ordersCompleted || 0,
//         totalEarnings: monthAgg[0]?.totalEarnings || 0
//       }
//     });
//   } catch (err) {
//     console.error("getEarningsSummary", err);
//     res.status(500).json({ message: "Failed to fetch earnings summary" });
//   }
// };


// module.exports = {
//   getMonthEarnings,
//   getWeekEarnings,
//   getDayEarnings,
//   getOrderEarningDetail,
//   getEarningsSummary
// };

const Order = require("../models/OrderSchema");
const EarningSummary = require("../models/EarningSummary");

/* ===================== CONSTANTS ===================== */

const MONTH_MAP = {
  jan: "01", feb: "02", mar: "03", apr: "04",
  may: "05", jun: "06", jul: "07", aug: "08",
  sep: "09", oct: "10", nov: "11", dec: "12"
};

const VALID_MONTHS = Object.keys(MONTH_MAP);

/* ===================== HELPERS ===================== */

const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

const getMonthRange = (year, month) => {
  const start = `${year}-${month}-01`;
  const d = new Date(start);
  d.setMonth(d.getMonth() + 1);
  const end = d.toISOString().slice(0, 10);
  return { start, end };
};

const mapOrderWithEarnings = (order) => {
  const e = order.riderEarning || {};
  return {
    orderId: order.orderId,
    completedAt: order.createdAt,
    earnings: {
      basePay: e.basePay || 0,
      distancePay: e.distancePay || 0,
      surgePay: e.surgePay || 0,
      tips: e.tips || 0,
      total:
        (e.basePay || 0) +
        (e.distancePay || 0) +
        (e.surgePay || 0) +
        (e.tips || 0)
    }
  };
};


const getDayEarnings = async (req, res, next) => {
  try {
    const date = req.params.param;
    if (!isValidDate(date)) return next();

    const riderId = req.rider._id;

    const orders = await Order.find({
      riderId,
      orderStatus: "DELIVERED",
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          date
        ]
      }
    }).lean();

    const summary = await EarningSummary.findOne({ riderId, date }).lean();

    res.json({
      date,
      ordersCompleted: summary?.ordersCompleted || orders.length,
      orders: orders.map(mapOrderWithEarnings)
    });
  } catch (err) {
    console.error("getDayEarnings", err);
    res.status(500).json({ message: "Failed to fetch day earnings" });
  }
};

/* ===================== WEEK ===================== */
/**
 * GET /api/earnings/week?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
const getWeekEarnings = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!isValidDate(start) || !isValidDate(end)) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const riderId = req.rider._id;

    const orders = await Order.find({
      riderId,
      orderStatus: "DELIVERED",
      $expr: {
        $and: [
          {
            $gte: [
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              start
            ]
          },
          {
            $lte: [
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              end
            ]
          }
        ]
      }
    }).lean();

    // group by date
    const dayMap = {};

    orders.forEach(o => {
      const d = o.createdAt.toISOString().slice(0, 10);
      if (!dayMap[d]) {
        dayMap[d] = { date: d, ordersCompleted: 0, orders: [] };
      }
      dayMap[d].ordersCompleted += 1;
      dayMap[d].orders.push(mapOrderWithEarnings(o));
    });

    const days = Object.values(dayMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const summaries = await EarningSummary.find({
      riderId,
      date: { $gte: start, $lte: end }
    }).lean();

    const totalOrders =
      summaries.reduce((s, d) => s + d.ordersCompleted, 0) || orders.length;

    const totalEarnings =
      summaries.reduce((s, d) => s + d.totalEarnings, 0) || 0;

    res.json({
      from: start,
      to: end,
      totalOrders,
      totalEarnings,
      days
    });
  } catch (err) {
    console.error("getWeekEarnings", err);
    res.status(500).json({ message: "Failed to fetch week earnings" });
  }
};

/* ===================== MONTH ===================== */
/**
 * GET /api/earnings/jan
 */
const getMonthEarnings = async (req, res, next) => {
  try {
    const key = req.params.param.toLowerCase();
    if (!VALID_MONTHS.includes(key)) return next();

    const riderId = req.rider._id;
    const year = new Date().getFullYear();
    const { start, end } = getMonthRange(year, MONTH_MAP[key]);

    const orders = await Order.find({
      riderId,
      orderStatus: "DELIVERED",
      $expr: {
        $and: [
          {
            $gte: [
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              start
            ]
          },
          {
            $lt: [
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              end
            ]
          }
        ]
      }
    }).lean();

    // group by week
    const weekMap = {};

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const wk = weekStart.toISOString().slice(0, 10);

      if (!weekMap[wk]) {
        weekMap[wk] = {
          from: wk,
          to: wk,
          ordersCompleted: 0,
          orders: []
        };
      }

      const dayStr = d.toISOString().slice(0, 10);
      weekMap[wk].to = dayStr;
      weekMap[wk].ordersCompleted += 1;
      weekMap[wk].orders.push(mapOrderWithEarnings(o));
    });

    const weeks = Object.values(weekMap).sort((a, b) =>
      a.from.localeCompare(b.from)
    );

    const summaries = await EarningSummary.find({
      riderId,
      date: { $gte: start, $lt: end }
    }).lean();

    const totalOrders =
      summaries.reduce((s, d) => s + d.ordersCompleted, 0) || orders.length;

    const totalEarnings =
      summaries.reduce((s, d) => s + d.totalEarnings, 0) || 0;

    res.json({
      from: start,
      to: end,
      totalOrders,
      totalEarnings,
      weeks
    });
  } catch (err) {
    console.error("getMonthEarnings", err);
    res.status(500).json({ message: "Failed to fetch month earnings" });
  }
};


const getEarningsSummary = async (req, res) => {
  try {
    const riderId = req.rider._id;

    // -------- TODAY --------
    const today = new Date().toISOString().slice(0, 10);

    const todaySummary = await EarningSummary.findOne(
      { riderId, date: today },
      { ordersCompleted: 1, totalEarnings: 1 }
    ).lean();

    // -------- WEEK (Mon → Sun) --------
    const now = new Date();
    const day = now.getDay() || 7;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - day + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    const weekAgg = await EarningSummary.aggregate([
      {
        $match: {
          riderId,
          date: { $gte: weekStartStr, $lte: weekEndStr }
        }
      },
      {
        $group: {
          _id: null,
          ordersCompleted: { $sum: "$ordersCompleted" },
          totalEarnings: { $sum: "$totalEarnings" }
        }
      }
    ]);

    // -------- MONTH --------
    const monthStart = today.slice(0, 7) + "-01";

    const monthAgg = await EarningSummary.aggregate([
      {
        $match: {
          riderId,
          date: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          ordersCompleted: { $sum: "$ordersCompleted" },
          totalEarnings: { $sum: "$totalEarnings" }
        }
      }
    ]);

    res.json({
      today: {
        date: today,
        ordersCompleted: todaySummary?.ordersCompleted || 0,
        totalEarnings: todaySummary?.totalEarnings || 0
      },
      week: {
        from: weekStartStr,
        to: weekEndStr,
        ordersCompleted: weekAgg[0]?.ordersCompleted || 0,
        totalEarnings: weekAgg[0]?.totalEarnings || 0
      },
      month: {
        from: monthStart,
        to: today.slice(0, 7) + "-31",
        ordersCompleted: monthAgg[0]?.ordersCompleted || 0,
        totalEarnings: monthAgg[0]?.totalEarnings || 0
      }
    });
  } catch (error) {
    console.error("getEarningsSummary error:", error);
    res.status(500).json({ message: "Failed to fetch earnings summary" });
  }
};

module.exports = { getEarningsSummary };


/* ===================== ORDER DETAIL ===================== */
/**
 * GET /api/earnings/orders/:orderId
 */
const getOrderEarningDetail = async (req, res) => {
  try {
    const order = await Order.findOne({
      riderId: req.rider._id,
      orderId: req.params.orderId,
      orderStatus: "DELIVERED"
    }).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const e = order.riderEarning || {};

    res.json({
      orderId: order.orderId,
      earnings: {
        basePay: e.basePay || 0,
        distancePay: e.distancePay || 0,
        surgePay: e.surgePay || 0,
        tips: e.tips || 0,
        total:
          (e.basePay || 0) +
          (e.distancePay || 0) +
          (e.surgePay || 0) +
          (e.tips || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order earnings" });
  }
};

module.exports = {
  getMonthEarnings,
  getWeekEarnings,
  getDayEarnings,
  getOrderEarningDetail,
  getEarningsSummary
};

