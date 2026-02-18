const Rider = require("../models/RiderModel");
const Order = require("../models/OrderSchema");
const jwt = require("jsonwebtoken");


// exports.handoverCodCash = async (req, res) => {
//   try {
//     const riderId = req.rider?._id;
//     if (!riderId) return res.status(401).json({ success: false, message: "Unauthorized rider" });

//     const { amount } = req.body;
//     if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Invalid handover amount" });

//     const rider = await Rider.findById(riderId);
//     if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

//     let remainingAmount = Number(amount);
//     let depositedNow = 0;
//     const depositTime = new Date();

//     // FIFO: oldest collected orders first
//     const codOrders = await Order.find({
//       riderId,
//       "payment.mode": "COD",
//       "cod.status": { $in: ["PENDING", "PARTIAL_DEPOSITED"] }
//     }).sort({ "cod.collectedAt": 1, createdAt: 1 });

//     for (const order of codOrders) {
//       if (remainingAmount <= 0) break;

//       const totalAmount = order.cod?.amount || order.pricing?.totalAmount || 0;
//       const alreadyDeposited = order.cod?.depositedAmount || 0;
//       const pendingBefore = totalAmount - alreadyDeposited;
//       if (pendingBefore <= 0) continue;

//       let depositThisOrder = 0;

//       if (remainingAmount >= pendingBefore) {
//         // FULL DEPOSIT
//         order.cod.depositedAmount = totalAmount;
//         order.cod.pendingAmount = 0;
//         order.cod.status = "DEPOSITED";
//         depositThisOrder = pendingBefore;
//         remainingAmount -= pendingBefore;
//       } else {
//         // PARTIAL DEPOSIT
//         order.cod.depositedAmount = alreadyDeposited + remainingAmount;
//         order.cod.pendingAmount = totalAmount - order.cod.depositedAmount;
//         order.cod.status = "PARTIAL_DEPOSITED";
//         depositThisOrder = remainingAmount;
//         remainingAmount = 0;
//       }

//       order.cod.depositedAt = depositTime;
//       order.markModified("cod");
//       await order.save();

//       depositedNow += depositThisOrder;
//     }

//     // Update rider cash balance
//     rider.cashInHand.balance = Math.max((rider.cashInHand.balance || 0) - depositedNow, 0);
//     await rider.save();

//     return res.status(200).json({
//       success: true,
//       message: "COD cash handed over successfully",
//       data: {
//         handedOverAmount: depositedNow,
//         remainingCashBalance: rider.cashInHand.balance,
//         currency: "INR",
//       }
//     });

//   } catch (error) {
//     console.error("handoverCodCash error:", error);
//     return res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// };
exports.handoverCodCash = async (req, res) => {
  try {
    const riderId = req.rider?._id;
    if (!riderId) {
      return res.status(401).json({ success: false, message: "Unauthorized rider" });
    }

    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid handover amount",
      });
    }

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    // ✅ SOURCE OF TRUTH
    const walletBalance = Number(rider.cashInHand?.balance || 0);

    if (walletBalance === 0) {
      return res.status(400).json({
        success: false,
        message: "No pending COD amount to deposit",
      });
    }

    // ❌ BLOCK PARTIAL / MISMATCH DEPOSIT
    if (Number(amount) !== walletBalance) {
      return res.status(400).json({
        success: false,
        message: `Partial deposit not allowed. Deposit full amount ₹${walletBalance}`,
      });
    }

    // ✅ ONLY COLLECTED COD ORDERS
    const codOrders = await Order.find({
      riderId,
      "payment.mode": "COD",
      "cod.collectedAt": { $ne: null },
    }).sort({ "cod.collectedAt": 1, createdAt: 1 });

    let remainingToSettle = walletBalance;
    const depositedAt = new Date();

    // ✅ FIFO SETTLEMENT
    for (const order of codOrders) {
      if (remainingToSettle <= 0) break;

      const totalAmount =
        Number(order.cod?.amount) ||
        Number(order.pricing?.totalAmount) ||
        0;

      const alreadyDeposited = Number(order.cod?.depositedAmount || 0);
      const pending = totalAmount - alreadyDeposited;

      if (pending <= 0) continue;

      order.cod.depositedAmount = totalAmount;
      order.cod.pendingAmount = 0;
      order.cod.status = "DEPOSITED";
      order.cod.depositedAt = depositedAt;

      order.markModified("cod");
      await order.save();

      remainingToSettle -= pending;
    }

    // ✅ RESET WALLET
    rider.cashInHand.balance = 0;
    await rider.save();

    return res.status(200).json({
      success: true,
      message: "COD cash deposited successfully",
      data: {
        depositedAmount: walletBalance,
        remainingCashBalance: 0,
        currency: "INR",
      },
    });

  } catch (error) {
    console.error("handoverCodCash error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to handover COD cash",
    });
  }
};

exports.withdrawFromWallet = async (req, res) => {
  try {
    // ✅ Safely resolve riderId
    let riderId = req.rider?._id;

    if (!riderId && req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      riderId = decoded.riderId || decoded.id || decoded._id;
    }

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized rider"
      });
    }

    const { amount } = req.body;

    // 1️⃣ Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal amount"
      });
    }

    // 2️⃣ Fetch rider wallet
    const rider = await Rider.findById(riderId)
      .select("wallet")
      .lean();

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    const availableBalance = rider.wallet?.balance || 0;

    // 3️⃣ Business rules
    if (amount < 500) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is ₹500"
      });
    }

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    // 4️⃣ Calculate new balance
    const updatedBalance = availableBalance - amount;

    // 5️⃣ Generate transaction ID
    const transactionId = `WD-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // 6️⃣ Save transaction
    await WalletTransaction.create({
      riderId,
      transactionId,
      type: "WITHDRAW",
      amount,
      balanceAfterTransaction: updatedBalance,
      status: "SUCCESS"
    });

    // 7️⃣ Update rider wallet
    await Rider.updateOne(
      { _id: riderId },
      { $set: { "wallet.balance": updatedBalance } }
    );

    // 8️⃣ Response
    return res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      data: {
        transactionId,
        withdrawnAmount: amount,
        availableBalance: updatedBalance,
        currency: "INR"
      }
    });

  } catch (error) {
    console.error("WITHDRAW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to withdraw amount"
    });
  }
};
