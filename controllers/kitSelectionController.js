const prisma = require("../config/prisma");
const { RequestStatus,PaymentStatus,AssetStatus } = require("@prisma/client");

exports.createAsset = async (req, res) => {
  try {
    const { assetType, assetName, price, freeLimit, imageUrl } = req.body;

    const asset = await prisma.assetMaster.create({
      data: {
        assetType,
        assetName,
        price: Number(price),
        freeLimit: Number(freeLimit),
        imageUrl
      }
    });

    return res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data: asset
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};
exports.viewAssets = async (req, res) => {
  try {
    const riderId = req.rider?.id;
    if (!riderId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1️⃣ Fetch rider_assets for this rider
    const riderAssets = await prisma.rider_assets.findMany({
      where: { riderId },
      include: { 
        rider_asset_items: true 
      }
    });

    if (!riderAssets || riderAssets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No assets issued to this rider",
        totalAssets: 0,
        data: []
      });
    }

    // 2️⃣ Transform the response
    let response = [];
    riderAssets.forEach(rAssets => {
      rAssets.rider_asset_items.forEach(item => {
        const isFree = item.status === "ISSUED" && item.condition === "GOOD"; // logic to mark free or paid can be adjusted
        response.push({
          id: item.id,
          riderAssetsId: rAssets.id,
          assetType: item.assetType,
          assetName: item.assetName,
          issuedDate: item.issuedDate,
          returnedDate: item.returnedDate,
          status: item.status,
          condition: item.condition,
          isFree,
          quantity: item.quantity || 1
        });
      });
    });

    const totalAssets = response.length;
    const freeAssetsCount = response.filter(a => a.isFree).length;
    const paidAssetsCount = totalAssets - freeAssetsCount;

    return res.status(200).json({
      success: true,
      message: "Rider assets fetched successfully",
      totalAssets,
      freeAssetsCount,
      paidAssetsCount,
      data: response
    });

  } catch (error) {
    console.error("View Rider Assets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching rider assets",
      error: error.message
    });
  }
};
exports.requestAsset = async (req, res) => {
  try {
    const { assetType, quantity } = req.body;

    if (!req.rider?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!assetType || !quantity) {
      return res.status(400).json({
        success: false,
        message: "assetType and quantity are required"
      });
    }

    const asset = await prisma.assetMaster.findFirst({
      where: { assetType }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found"
      });
    }

    const isFree = asset.issuedCount < asset.freeLimit;
    const calculatedPrice = isFree
      ? 0
      : asset.price * Number(quantity);

    // 🔥 REMOVE price and isFree from DB insert
    const request = await prisma.assetRequest.create({
      data: {
        riderId: req.rider.id,
        assetType,
        quantity: Number(quantity),
    status: isFree ? RequestStatus.READY_FOR_DISPATCH : RequestStatus.PAYMENT_PENDING
      }
    });

    return res.status(201).json({
      success: true,
      message: "Asset request created successfully",
      data: request,
      price: calculatedPrice,   // ✅ send in response only
      isFree                    // ✅ send in response only
    });

  } catch (error) {
    console.error("Request Asset Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};
// exports.approveRequest = async (req, res) => {
//   try {
//     const { riderId } = req.body;

//     console.log("Incoming riderId:", riderId);

//     if (!riderId) {
//       return res.status(400).json({
//         success: false,
//         message: "riderId is required"
//       });
//     }

//     const existingRequest = await prisma.assetRequest.findFirst({
//       where: {
//         riderId: riderId
//       }
//     });

//     console.log("Found request:", existingRequest);

//     if (!existingRequest) {
//       return res.status(404).json({
//         success: false,
//         message: "Asset request not found"
//       });
//     }

//     const updatedRequest = await prisma.assetRequest.update({
//       where: { id: existingRequest.id },
//       data: {
//         status: "READY_FOR_DISPATCH"
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Request approved successfully",
//       data: updatedRequest
//     });

//   } catch (error) {
//     console.error("Approve Request Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message
//     });
//   }
// };

exports.approveRequest = async (req, res) => {
  try {
    const { riderId } = req.body;
    if (!riderId) {
      return res.status(400).json({ success: false, message: "riderId is required" });
    }
     console.log("Admin approving riderId:", riderId);

// List all requests for this rider
const allRequests = await prisma.assetRequest.findMany({
  where: { riderId },
  orderBy: { createdAt: "desc" }
});
console.log("All requests for this rider:", allRequests);

    // Find latest request ready for dispatch
    const request = await prisma.assetRequest.findFirst({
      where: { riderId, status: RequestStatus.READY_FOR_DISPATCH },
      orderBy: { createdAt: "desc" }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "No request ready for dispatch found" });
    }

    // Get asset info
    const asset = await prisma.assetMaster.findFirst({
      where: { assetType: request.assetType }
    });
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found in master" });
    }

    // Transaction: update request + add assets to rider_assets
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Create rider_assets if not exists
      let riderAssets = await tx.rider_assets.findFirst({ where: { riderId } });
      if (!riderAssets) {
        riderAssets = await tx.rider_assets.create({
          data: { riderId, createdAt: new Date(), updatedAt: new Date() }
        });
      }

      // Add rider_asset_items
      const itemsData = Array.from({ length: request.quantity }, () => ({
        riderAssetsId: riderAssets.id,
        assetType: asset.assetType,
        assetName: asset.assetName,
        issuedDate: new Date(),
        status: "ISSUED",
        condition: "GOOD"
      }));

      await tx.rider_asset_items.createMany({ data: itemsData });

      // Update request status to dispatched
      return tx.assetRequest.update({
        where: { id: request.id },
        data: { status: RequestStatus.DISPATCHED }
      });
    });

    return res.status(200).json({
      success: true,
      message: "Request approved and assets dispatched",
      data: updatedRequest
    });

  } catch (error) {
    console.error("Approve Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Approval failed" });
  }
};// exports.makePayment = async (req, res) => {
//   try {

//     const riderId = req.rider?.id;

//     if (!riderId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }
    
//     const { paymentMode, paymentType, months } = req.body;

//     if (!paymentMode || !paymentType) {
//       return res.status(400).json({
//         success: false,
//         message: "paymentMode and paymentType are required"
//       });
//     }

   
//     // Find latest pending request for rider
//     const request = await prisma.assetRequest.findFirst({
//       where: {
//         riderId,
//         status: "READY_FOR_DISPATCH"
//       },
//       orderBy: {
//         createdAt: "desc"
//       }
//     });
    
//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "No pending payment request found"
//       });
//     }
//      // ✅ Prevent duplicate payment
// const existingPayment = await prisma.payment.findUnique({
//   where: {
//     assetRequestId: request.id
//   }
// });

// if (existingPayment) {
//   return res.status(400).json({
//     success: false,
//     message: "Payment already completed for this request"
//   });
// }
//     // 🔹 Get asset price from AssetMaster
//     const asset = await prisma.assetMaster.findFirst({
//       where: { assetType: request.assetType }
//     });

//     if (!asset) {
//       return res.status(404).json({
//         success: false,
//         message: "Asset not found in master"
//       });
//     }

//     const totalAmount = asset.price * request.quantity;

//     // 🔥 Use transaction for safety
//     const result = await prisma.$transaction(async (tx) => {

//       const payment = await tx.payment.create({
//         data: {
//           assetRequestId: request.id,
//           amount: totalAmount,
//           paymentMode,
//           paymentType,
//           status: "SUCCESS"
//         }
//       });

//       if (paymentType === "EMI") {

//         if (!months || months <= 0) {
//           throw new Error("Valid months required for EMI");
//         }

//         const monthly = totalAmount / months;

//         await tx.emiPlan.create({
//           data: {
//             paymentId: payment.id,
//             totalAmount,
//             interestRate: 10,
//             months,
//             monthlyAmount: monthly,
//             remainingAmount: totalAmount,
//             nextDueDate: new Date()
//           }
//         });
//       }

//       await tx.assetRequest.update({
//         where: { id: request.id },
//         data: { status: "READY_FOR_DISPATCH" }
//       });

//       return payment;
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Payment successful",
//       data: result
//     });

//   } catch (error) {
//     console.error("Payment Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong during payment"
//     });
//   }
// };

exports.makePayment = async (req, res) => {
  try {
    const riderId = req.rider?.id;
    console.log("Rider ID from token:", riderId);

    if (!riderId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { paymentMode, paymentType, months } = req.body;
    if (!paymentMode || !paymentType) {
      return res.status(400).json({
        success: false,
        message: "paymentMode and paymentType are required"
      });
    }

    // Find latest request pending payment
    const request = await prisma.assetRequest.findFirst({
      where: { riderId, 
    status: { in: [RequestStatus.PENDING, RequestStatus.PAYMENT_PENDING] }
      },
      orderBy: { createdAt: "desc" }
    });
    console.log("Payment pending request found:", request);
    if (!request) {
      return res.status(404).json({ success: false, message: "No payment pending request found" });
    }

    // Prevent duplicate payment
    const existingPayment = await prisma.payment.findUnique({
      where: { assetRequestId: request.id }
    });

    if (existingPayment) {
      return res.status(400).json({ success: false, message: "Payment already completed" });
    }

    const asset = await prisma.assetMaster.findFirst({
      where: { assetType: request.assetType }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found in master" });
    }

    const totalAmount = asset.price * request.quantity;

    // Transaction to create payment and update request status
    const payment = await prisma.$transaction(async (tx) => {
      const pay = await tx.payment.create({
        data: {
          assetRequestId: request.id,
          amount: totalAmount,
          paymentMode,
          paymentType,
          status: PaymentStatus.SUCCESS
        }
      });

      if (paymentType === "EMI") {
        if (!months || months <= 0) throw new Error("Valid months required for EMI");
        const monthly = totalAmount / months;
        await tx.emiPlan.create({
          data: {
            paymentId: pay.id,
            totalAmount,
            interestRate: 10,
            months,
            monthlyAmount: monthly,
            remainingAmount: totalAmount,
            nextDueDate: new Date()
          }
        });
      }

      // Update request status to indicate payment completed
      await tx.assetRequest.update({
        where: { id: request.id },
        data: { status: RequestStatus.READY_FOR_DISPATCH }
      });

      return pay;
    });

    return res.status(200).json({
      success: true,
      message: "Payment successful. Waiting for admin dispatch",
      data: payment
    });

  } catch (error) {
    console.error("Payment Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Payment failed" });
  }
};
exports.dispatchAsset = async (req, res) => {
  try {
    const { requestId, courierName, trackingId } = req.body;

    // ✅ Validate input
    if (!requestId || !courierName || !trackingId) {
      return res.status(400).json({
        success: false,
        message: "requestId, courierName and trackingId are required"
      });
    }

    // ✅ Check if asset request exists
    const request = await prisma.assetRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Asset request not found"
      });
    }

    // ✅ Ensure payment completed before dispatch
    if (![RequestStatus.READY_FOR_DISPATCH, RequestStatus.DISPATCHED].includes(request.status)) {
  return res.status(400).json({
    success: false,
    message: "Asset is not ready for dispatch"
  });
}

    // ✅ Prevent duplicate shipment
    const existingShipment = await prisma.shipment.findUnique({
      where: { assetRequestId: requestId }
    });

    if (existingShipment) {
      return res.status(400).json({
        success: false,
        message: "Shipment already created for this request"
      });
    }

    // 🔥 Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {

      const shipment = await tx.shipment.create({
        data: {
          assetRequestId: requestId,
          courierName,
          trackingId,
          dispatchDate: new Date(),
          deliveryStatus: "SHIPPED"
        }
      });

      await tx.assetRequest.update({
        where: { id: requestId },
        data: { status: "COMPLETED" }
      });

      return shipment;
    });

    return res.status(200).json({
      success: true,
      message: "Asset dispatched successfully",
      data: result
    });

  } catch (error) {
    console.error("Dispatch Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while dispatching asset"
    });
  }
};
exports.raiseIssue = async (req, res) => {
  try {
    // 🔐 Get rider from token
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token"
      });
    }

    const { riderAssetsId, assetType, description, issueType } = req.body;
    const imageUrl = req.file?.path || null;

    // Validate required fields
    if (!riderAssetsId || !assetType || !description) {
      return res.status(400).json({
        success: false,
        message: "riderAssetsId, assetType and description are required"
      });
    }
    console.log("Token Rider ID:", riderId);
console.log("Request riderAssetsId:", riderAssetsId);

    // Check asset belongs to rider
    const riderAsset = await prisma.rider_assets.findFirst({
      where: {
        id: riderAssetsId,
        riderId: riderId   // 🔐 token validation here
      }
      
    });
    console.log("DB Asset Record:", riderAsset);
    if (!riderAsset) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to raise issue for this asset"
      });
    }

    // Create issue
    const issue = await prisma.rider_asset_issues.create({
      data: {
        riderAssetsId,
        assetType,
        description,
        imageUrl,
        issueType: issueType || "OTHER",
        status: "OPEN"
      }
    });

    return res.status(201).json({
      success: true,
      message: "Issue raised successfully",
      data: issue
    });

  } catch (error) {
    console.error("Raise Issue Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while raising issue"
    });
  }
};

exports.markAsDelivered = async (req, res) => {
  try {
    const { shipmentId } = req.body;

    if (!shipmentId) {
      return res.status(400).json({ success: false, message: "shipmentId is required" });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { AssetRequest: true } // include request to update it
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    if (shipment.deliveryStatus === "DELIVERED") {
      return res.status(400).json({ success: false, message: "Shipment already marked as delivered" });
    }

    // Transaction to update shipment + assetRequest + rider_asset_items
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Update shipment
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          deliveryStatus: "DELIVERED",
          deliveredDate: new Date()
        }
      });

      // 2️⃣ Update assetRequest status
      await tx.assetRequest.update({
        where: { id: shipment.assetRequestId },
        data: { status: RequestStatus.COMPLETED }
      });

      // 3️⃣ Update rider_asset_items (optional: mark delivered)
      const riderAssets = await tx.rider_asset_items.updateMany({
        where: {
          riderAssetsId: shipment.AssetRequest.riderId,
          assetType: shipment.AssetRequest.assetType,
          status: AssetStatus.ISSUED
        },
        data: { status: AssetStatus.ISSUED } // You can create new status DELIVERED if needed
      });

      return updatedShipment;
    });

    return res.status(200).json({
      success: true,
      message: "Shipment marked as delivered and rider assets updated",
      data: result
    });

  } catch (error) {
    console.error("Mark Delivered Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update delivery" });
  }
};