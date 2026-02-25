// controllers/riderEarningsController.js
const RiderDailyEarnings = require("../models/RiderDailyEarnings");
const RiderOrderEarnings = require("../models/RiderOrderEarnings");
const Order = require("../models/OrderSchema");

const prisma=require('../config/prisma');

const { getISOWeekRange , getCurrentISOWeek} = require("../helpers/getWeekNumber");
//1 Today / Week / Month cards
exports.getEarningsSummary = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const today = new Date();
    today.setHours(0,0,0,0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayData] = await RiderDailyEarnings.find({
      riderId,
      date: today
    });

    const weekAgg = await RiderDailyEarnings.aggregate([
      { $match: { riderId, date: { $gte: weekStart } } },
      { $group: {
          _id: null,
          total: { $sum: "$totalEarnings" }
      }}
    ]);

    const monthAgg = await RiderDailyEarnings.aggregate([
      { $match: { riderId, date: { $gte: monthStart } } },
      { $group: {
          _id: null,
          base: { $sum: "$baseEarnings" },
          incentives: { $sum: "$incentiveEarnings" },
          tips: { $sum: "$tips" },
          total: { $sum: "$totalEarnings" }
      }}
    ]);

    res.json({
      today: {
        orders: todayData?.ordersCount || 0,
        baseEarnings: todayData?.baseEarnings || 0,
        incentives: todayData?.incentiveEarnings || 0,
        tips: todayData?.tips || 0,
        total: todayData?.totalEarnings || 0
      },
      week: {
        total: weekAgg[0]?.total || 0
      },
      month: {
        baseEarnings: monthAgg[0]?.base || 0,
        incentives: monthAgg[0]?.incentives || 0,
        tips: monthAgg[0]?.tips || 0,
        total: monthAgg[0]?.total || 0
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.new_getEarningsSummary = async (req, res) => {
  try {
    const riderId = req.rider.id;

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const current = getCurrentISOWeek();
    const { start: weekStart, end: weekEnd } =
      getISOWeekRange(current.week, current.year);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const orders = await prisma.order.findMany({
      where:{
        riderId: riderId,
        orderStatus: "DELIVERED",
        updatedAt: {
          gte: monthStart,
          lte: todayEnd
        }
      },
    include: {
      OrderRiderEarning: true
    }
  });

    let todayOrders = 0;
    let todayTotal = 0;
    let todayBase = 0;
    let todayIncentives = 0;
    let todayTips = 0;
    
    let weekOrders = 0;
    let weekBase = 0;
    let weekIncentives = 0;
    let weekTips = 0;
    let weekTotal = 0;

    let monthOrders = 0;          
    let monthBase = 0;
    let monthIncentives = 0;
    let monthTips = 0;
    let monthTotal = 0;

    orders.forEach(order => {
      const deliveredAt = new Date(order.updatedAt);
      const earning = order.OrderRiderEarning || {};

      const totalEarning = earning.totalEarning || 0;
      const basePay = earning.basePay || 0;
      const incentive = earning.surgePay || 0;
      const tips = earning.tips || 0;
      
      //Today
      if (deliveredAt >= todayStart && deliveredAt <= todayEnd) {
        todayOrders += 1;
        todayTotal += totalEarning;
        todayBase += basePay;
        todayIncentives += incentive;
        todayTips += tips;
      }

      // ---- THIS WEEK ----
      if (deliveredAt >= weekStart && deliveredAt <= weekEnd) {
        weekOrders += 1;
        weekBase += basePay;
        weekIncentives += incentive;
        weekTips += tips;
        weekTotal += totalEarning;
      }

      //MONTH 
      monthOrders += 1;           
      monthBase += basePay;
      monthIncentives += incentive;
      monthTips += tips;
      monthTotal += totalEarning;
    });

    res.json({
      today: {
        orders: todayOrders,
        baseEarnings: todayBase,
        incentives: todayIncentives,
        tips: todayTips,
        total: todayTotal
      },
      week: {
        orders: weekOrders,
        baseEarnings: weekBase,
        incentives: weekIncentives,
        tips: weekTips,
        total: weekTotal
      },
      month: {
        orders: monthOrders,      
        baseEarnings: monthBase,
        incentives: monthIncentives,
        tips: monthTips,
        total: monthTotal
      }
    });

  } catch (err) {
    console.error("Earnings summary error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// 2 Bar chart (Mon–Sun)
exports.getWeeklyChart = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0,0,0,0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const data = await RiderDailyEarnings.find({
      riderId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    const response = days.map((day, i) => {
      const d = data.find(x => new Date(x.date).getDay() === i);
      return {
        day,
        amount: d?.totalEarnings || 0,
        orders: d?.ordersCount || 0
      };
    });

    res.json({ week: response });

  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.new_getWeeklyChart = async (req, res) => {
  try {
    const riderId = req.rider.id; // ✅ Prisma id

    // ---- CURRENT ISO WEEK ----
    const current = getCurrentISOWeek();
    const { start, end } = getISOWeekRange(current.week, current.year);

    // ---- FETCH DELIVERED ORDERS ----
    const orders = await prisma.order.findMany({
      where: {
        riderId,
        orderStatus: "DELIVERED",
        updatedAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        OrderRiderEarning: true // 👈 important
      }
    });

    // ---- GROUP BY DAY ----
    const dayMap = {};

    orders.forEach(order => {
      const key = new Date(order.updatedAt).toDateString();

      if (!dayMap[key]) {
        dayMap[key] = {
          orders: 0,
          amount: 0
        };
      }

      dayMap[key].orders += 1;
      dayMap[key].amount += order.OrderRiderEarning?.totalEarning || 0;
    });

    // ---- BUILD WEEK (MON → SUN) ----
    const week = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);

      const key = day.toDateString();
      const data = dayMap[key] || { orders: 0, amount: 0 };

      week.push({
        day: day.toLocaleDateString("en-IN", { weekday: "short" }),
        amount: data.amount,
        orders: data.orders
      });
    }

    res.json({ week });

  } catch (err) {
    console.error("Weekly chart error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


// 3 Daily earnings list

// exports.getDailyEarnings = async (req, res) => {
//     // console.log("hited daily earnings controller");
//     // console.log("Request query:", req.query); // Debugging line
//     // console.log("Rider ID:", req.rider._id); // Debugging line
//   try {
//     const riderId = req.rider._id;
//     const date = new Date(req.query.date);
//     date.setHours(0,0,0,0);

//     const daily = await RiderDailyEarnings.findOne({ riderId, date });
//     const orders = await RiderOrderEarnings.find({
//       riderId,
//       completedAt: {
//         $gte: date,
//         $lte: new Date(date.getTime() + 86400000)
//       }
//     }).sort({ completedAt: -1 });

//     res.json({
//       date,
//       totalEarnings: daily?.totalEarnings || 0,
//       items: orders.map(o => ({
//         type: "DELIVERY",
//         orderId: o.orderId,
//         amount: o.earnings.totalAmount,
//         time: o.completedAt
//       }))
//     });

//   } catch (err) {
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

exports.getDailyEarnings = async (req, res) => {
  try {
    const riderId = req.rider._id;

    let year, month, day;

    // -----------------------------
    //SAFE DATE PARSING (LOCAL)
    // -----------------------------
    if (req.query.date) {
      // Expecting YYYY-MM-DD
      const parts = req.query.date.split("-").map(Number);

      if (parts.length !== 3) {
        return res.status(400).json({
          message: "Invalid date format. Use YYYY-MM-DD"
        });
      }

      [year, month, day] = parts;

      if (!year || !month || !day) {
        return res.status(400).json({
          message: "Invalid date format. Use YYYY-MM-DD"
        });
      }
    } else {
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
      day = today.getDate();
    }

    // -----------------------------
    //CREATE LOCAL DAY RANGE
    // -----------------------------
    const baseDate = new Date(year, month - 1, day);

    const startOfDay = new Date(baseDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(baseDate);
    endOfDay.setHours(23, 59, 59, 999);

    // -----------------------------
    //FETCH DAILY AGGREGATE
    // -----------------------------
    const daily = await RiderDailyEarnings.findOne({
      riderId,
      date: startOfDay
    });

    // -----------------------------
    // FETCH ORDERS FOR THE DAY
    // -----------------------------
    const orders = await RiderOrderEarnings.find({
      riderId,
      completedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ completedAt: -1 });

    // -----------------------------
    // FORMAT DATE FOR UI
    // -----------------------------
    const responseDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // -----------------------------
    // RESPONSE
    // -----------------------------
    res.json({
      date: responseDate,
      totalEarnings: daily?.totalEarnings || 0,
      items: orders.map(o => ({
        type: "DELIVERY",
        orderId: o.orderId,
        amount: o.earnings?.totalAmount || 0,
        time: o.completedAt
      }))
    });

  } catch (err) {
    console.error("Daily earnings error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.new_getDailyEarnings = async (req, res) => {
  try {
    console.log("Hitted new daily earnings controller");

    const riderId = req.rider.id; // Prisma uses id (not _id)

    let year, month, day;

    // -----------------------------
    // SAFE DATE PARSING (LOCAL)
    // -----------------------------
    if (req.query.date) {
      const parts = req.query.date.split("-").map(Number);

      if (parts.length !== 3) {
        return res.status(400).json({
          message: "Invalid date format. Use YYYY-MM-DD"
        });
      }

      [year, month, day] = parts;
    } else {
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
      day = today.getDate();
    }

    const baseDate = new Date(year, month - 1, day);

    const startOfDay = new Date(baseDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(baseDate);
    endOfDay.setHours(23, 59, 59, 999);

    // -----------------------------
    // FETCH ORDERS (DELIVERED ONLY)
    // -----------------------------
    const orders = await prisma.order.findMany({
      where: {
        riderId: riderId,
        orderStatus: "DELIVERED",
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        OrderRiderEarning: true
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    let totalEarnings = 0;
    const items = [];

    orders.forEach(order => {
      const earning = order.OrderRiderEarning;

      const amount = earning?.totalEarning || 0;
      const surgePay = earning?.surgePay || 0;

      totalEarnings += amount;

      // DELIVERY ENTRY
      items.push({
        type: "DELIVERY",
        orderId: order.orderId,
        amount,
        time: order.updatedAt
      });

      // BONUS ENTRY
      if (surgePay > 0) {
        items.push({
          type: "BONUS",
          title: "Peak Hour Bonus",
          amount: surgePay,
          time: order.updatedAt
        });
      }
    });

    const responseDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    res.json({
      date: responseDate,
      totalEarnings,
      items,
      count:items.length
    });

  } catch (err) {
  console.error("Delivery earnings error:", err);
  return res.status(500).json({
    message: "Internal server error",
    error: err.message   
  });
}
};




exports.getDeliveryEarnings = async (req, res) => {
  try {
    const riderId = req.rider._id;
    const { orderId } = req.params;

    const order = await Order.findOne({ riderId, orderId });

    console.log("Order data:", order);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("Rider Earning data:", order.riderEarning.total);
res.json({
  orderId: order.orderId,
  store: order.vendorShopName,
  totalEarnings:
    order.riderEarning?.total ??
    order.riderEarning?.totalEarning ??
    10,

  breakup: {
    baseFare: order.riderEarning?.baseFare || 0,
    distanceFare: order.riderEarning?.distanceFare || 0,
    surgePay: order.riderEarning?.surgePay || 0,
    incentive: order.riderEarning?.incentive || 0,
    tips: order.riderEarning?.tips || 0
  },

  status: order.orderStatus,
  time: order.updatedAt
});


  } catch (err) {
    console.error("Delivery earnings error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.new_getDeliveryEarnings = async (req, res) => {
  try {
    const riderId = req.rider.id;
    const { orderId } = req.params;
    // console.log("Fetching earnings for Order ID:", orderId);
    // console.log("Rider ID:", riderId);
const order = await prisma.order.findFirst({
  where: {
    riderId: riderId,
    orderId: orderId
  },
  include: {
    OrderRiderEarning: true
  }
});     
// console.log(order);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const riderEarning = order.OrderRiderEarning || {};

    res.json({
      orderId: order.orderId,
      store: order.vendorShopName,

      // ✅ FIX: correct field
      totalEarnings: riderEarning.totalEarning || 0,

      breakup: {
        // ✅ FIX: correct field names
        basePay: riderEarning.basePay || 0,
        distancePay: riderEarning.distancePay || 0,
        surgePay: riderEarning.surgePay || 0,
        tips: riderEarning.tips || 0
      },

      status: order.orderStatus,
      time: order.updatedAt
    });

  } catch (err) {
    console.error("Delivery earnings error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};




exports.getWeeklyEarnings = async (req, res) => {
  try {
    const riderId = req.rider._id;
    let { week, year } = req.query;

    // ---- DEFAULT CURRENT ISO WEEK ----
    if (!week || !year) {
      const current = getCurrentISOWeek();
      week = current.week;
      year = current.year;
    }

    const { start, end } = getISOWeekRange(Number(week), Number(year));

    // ---- FETCH ORDERS FOR THE WEEK ----
    const orders = await Order.find({
      riderId,
      orderStatus: "DELIVERED",
      updatedAt: { $gte: start, $lte: end }
    }).sort({ updatedAt: 1 });

    // ---- GROUP ORDERS BY DAY ----
    const ordersByDay = {};

    orders.forEach(order => {
      const dayKey = new Date(order.updatedAt).toDateString();

      if (!ordersByDay[dayKey]) {
        ordersByDay[dayKey] = [];
      }

      ordersByDay[dayKey].push({
        orderId: order.orderId,
        amount:
          order.riderEarning?.total ??
          order.riderEarning?.totalEarning ??
          0,
        time: order.updatedAt
      });
    });

    // ---- BUILD 7 DAYS RESPONSE (MON → SUN) ----
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);

      const dayKey = day.toDateString();
      const dayOrders = ordersByDay[dayKey] || [];

      const totalAmount = dayOrders.reduce(
        (sum, o) => sum + o.amount,
        0
      );

      days.push({
        day: day.toLocaleDateString("en-IN", { weekday: "short" }),
        date: day.toISOString().split("T")[0],
        ordersCount: dayOrders.length,
        amount: totalAmount,
        orders: dayOrders
      });
    }

    res.json({
      week: Number(week),
      year: Number(year),
      weekRange: `${start.toDateString()} - ${end.toDateString()}`,
      total: days.reduce((s, d) => s + d.amount, 0),
      days
    });

  } catch (err) {
    console.error("Weekly earnings error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


// exports.new_getWeeklyEarnings = async (req, res) => {
//   try {
//     const riderId = req.rider._id;
//     let { week, year } = req.query;

//     // ---- DEFAULT CURRENT ISO WEEK ----
//     if (!week || !year) {
//       const current = getCurrentISOWeek();
//       week = current.week;
//       year = current.year;
//     }

//     const { start, end } = getISOWeekRange(Number(week), Number(year));
//     console.log("heloo" , start , end)
//     // ---- FETCH ORDERS FOR CURRENT WEEK ----
//     const orders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       updatedAt: { $gte: start, $lte: end }
//     }).sort({ updatedAt: -1 });

//     // ---- GROUP ORDERS BY DAY ----
//     const ordersByDay = {};

//     orders.forEach(order => {
//       const dayKey = new Date(order.updatedAt).toDateString();

//       if (!ordersByDay[dayKey]) {
//         ordersByDay[dayKey] = {
//           ordersCount: 0,
//           amount: 0,
//           orders: []
//         };
//       }

//       const earning = order.riderEarning?.totalEarning || 0;

//       ordersByDay[dayKey].ordersCount += 1;
//       ordersByDay[dayKey].amount += earning;

//       ordersByDay[dayKey].orders.push({
//         orderId: order.orderId,
//         amount: earning,
//         time: order.updatedAt
//       });
//     });

//     // ---- BUILD WEEK DAYS (MON → SUN) ----
//     const days = [];

//     for (let i = 0; i < 7; i++) {
//       const day = new Date(start);
//       day.setDate(start.getDate() + i);

//       const key = day.toDateString();
//       const data = ordersByDay[key] || {
//         ordersCount: 0,
//         amount: 0,
//         orders: []
//       };

//       days.push({
//         day: day.toLocaleDateString("en-IN", { weekday: "long" }),
//         date: day.toISOString().split("T")[0],
//         orders: data.ordersCount,
//         amount: data.amount,
//         deliveries: data.orders     // delivered items array
//       });
//     }

//     const total = days.reduce((sum, d) => sum + d.amount, 0);

//     // ---- LAST WEEK COMPARISON ----
//     const lastWeekStart = new Date(start);
//     lastWeekStart.setDate(start.getDate() - 7);

//     const lastWeekEnd = new Date(end);
//     lastWeekEnd.setDate(end.getDate() - 7);

//     const lastWeekOrders = await Order.find({
//       riderId,
//       orderStatus: "DELIVERED",
//       updatedAt: { $gte: lastWeekStart, $lte: lastWeekEnd }
//     });

//     const lastWeekTotal = lastWeekOrders.reduce(
//       (sum, o) => sum + (o.riderEarning?.totalEarning || 0),
//       0
//     );

//     const changePercent =
//       lastWeekTotal > 0
//         ? Math.round(((total - lastWeekTotal) / lastWeekTotal) * 100)
//         : 0;

//     // ---- RESPONSE ----
//     res.json({
//       week: Number(week),
//       year: Number(year),
//       weekRange: `${start.toDateString()} - ${end.toDateString()}`,
//       total,
//       changePercent,
//       days
//     });

//   } catch (err) {
//     console.error("Weekly earnings error:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


function toISTDate(date) {
  return new Date(
    new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

exports.new_getWeeklyEarnings = async (req, res) => {
  try {
    const riderId = req.rider.id || req.rider._id;
    let { week, year } = req.query;

    if (!week || !year) {
      const current = getCurrentISOWeek();
      week = current.week;
      year = current.year;
    }

    const { start, end } = getISOWeekRange(Number(week), Number(year));

    const orders = await prisma.order.findMany({
      where: {
        riderId: String(riderId),
        orderStatus: "DELIVERED",
        updatedAt: { gte: start, lte: end }
      },
      select: {
        orderId: true,
        updatedAt: true,
        OrderRiderEarning: {
          select: { totalEarning: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const ordersByDay = {};

    orders.forEach(order => {
      const istDate = toISTDate(order.updatedAt);
      const dayKey = istDate.toDateString();

      if (!ordersByDay[dayKey]) {
        ordersByDay[dayKey] = {
          ordersCount: 0,
          amount: 0,
          orders: []
        };
      }

      const earning = order.OrderRiderEarning?.totalEarning || 0;

      ordersByDay[dayKey].ordersCount += 1;
      ordersByDay[dayKey].amount += earning;

      ordersByDay[dayKey].orders.push({
        orderId: order.orderId,
        amount: earning,
        time: order.updatedAt
      });
    });

    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = toISTDate(new Date(start));
      day.setDate(day.getDate() + i);

      const key = day.toDateString();
      const data = ordersByDay[key] || {
        ordersCount: 0,
        amount: 0,
        orders: []
      };

      days.push({
        day: day.toLocaleDateString("en-IN", { weekday: "long" }),
        date: day.toLocaleDateString("en-CA"),
        orders: data.ordersCount,
        amount: data.amount,
        deliveries: data.orders
      });
    }

    const total = days.reduce((sum, d) => sum + d.amount, 0);

    const lastWeekStart = new Date(start);
    lastWeekStart.setDate(start.getDate() - 7);

    const lastWeekEnd = new Date(end);
    lastWeekEnd.setDate(end.getDate() - 7);

    const lastWeekOrders = await prisma.order.findMany({
      where: {
        riderId: String(riderId),
        orderStatus: "DELIVERED",
        updatedAt: { gte: lastWeekStart, lte: lastWeekEnd }
      },
      select: {
        OrderRiderEarning: {
          select: { totalEarning: true }
        }
      }
    });

    const lastWeekTotal = lastWeekOrders.reduce(
      (sum, o) => sum + (o.OrderRiderEarning?.totalEarning || 0),
      0
    );

    const changePercent =
      lastWeekTotal > 0
        ? Math.round(((total - lastWeekTotal) / lastWeekTotal) * 100)
        : 0;

    res.json({
      week: Number(week),
      year: Number(year),
      weekRange: `${toISTDate(start).toDateString()} - ${toISTDate(end).toDateString()}`,
      total,
      changePercent,
      days
    });

  } catch (err) {
    console.error("Weekly earnings error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getEarningsHistory = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const {
      from,
      to,
      page = 1,
      limit = 10
    } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "from and to dates are required (YYYY-MM-DD)"
      });
    }

    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      RiderDailyEarnings.find({
        riderId,
        date: { $gte: startDate, $lte: endDate }
      })
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),

      RiderDailyEarnings.countDocuments({
        riderId,
        date: { $gte: startDate, $lte: endDate }
      })
    ]);

    res.json({
      page: Number(page),
      limit: Number(limit),
      totalRecords: total,
      data: records.map(d => ({
        date: d.date,
        orders: d.ordersCount,
        totalEarnings: d.totalEarnings,
        payoutStatus: d.payoutStatus
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


