const prisma = require("../config/prisma");
const {AssetType, RequestStatus,PaymentStatus,AssetStatus } = require("@prisma/client");

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
    console.log("Logged in riderId:", riderId);

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const riderAssets = await prisma.rider_assets.findMany({
      where: { riderId },
      include: {
        rider_asset_items: true
      }
    });

    console.log("riderAssets:", JSON.stringify(riderAssets, null, 2));

    const allRiderAssets = await prisma.rider_assets.findMany();
    console.log("All rider_assets rows:", JSON.stringify(allRiderAssets, null, 2));

    if (!riderAssets || riderAssets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No assets issued to this rider",
        totalAssets: 0,
        data: []
      });
    }

    let response = [];

    riderAssets.forEach((rAssets) => {
      rAssets.rider_asset_items.forEach((item) => {
        const isFree =
          item.status === "ISSUED" && item.condition === "GOOD";

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

    return res.status(200).json({
      success: true,
      message: "Rider assets fetched successfully",
      totalAssets: response.length,
      freeAssetsCount: response.filter((a) => a.isFree).length,
      paidAssetsCount: response.filter((a) => !a.isFree).length,
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

    // REMOVE price and isFree from DB insert
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
      price: calculatedPrice,   
      isFree                    
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

exports.approveRequest = async (req, res) => {
  try {
    const { riderId } = req.params;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "riderId is required"
      });
    }

    const requests = await prisma.assetRequest.findMany({
      where: {
        riderId,
        status: RequestStatus.PENDING
      },
      orderBy: { createdAt: "asc" }
    });

    if (!requests.length) {
      return res.status(404).json({
        success: false,
        message: "No pending requests found"
      });
    }

    const updatedRequests = [];

    for (const request of requests) {
      const asset = await prisma.assetMaster.findFirst({
        where: { assetType: request.assetType }
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: `Asset not found for assetType: ${request.assetType}`
        });
      }

      // example logic
      const isFree = asset.freeLimit > 0;

      const nextStatus = isFree
        ? RequestStatus.READY_FOR_DISPATCH
        : RequestStatus.PAYMENT_PENDING;

      const updatedRequest = await prisma.assetRequest.update({
        where: { id: request.id },
        data: {
          status: nextStatus
        }
      });

      updatedRequests.push({
        id: updatedRequest.id,
        assetType: updatedRequest.assetType,
        quantity: updatedRequest.quantity,
        status: updatedRequest.status
      });
    }

    return res.status(200).json({
      success: true,
      message: "Requests approved successfully",
      data: updatedRequests
    });
  } catch (error) {
    console.error("Approve Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Approval failed"
    });
  }
};

// exports.makePayment = async (req, res) => {
//   try {
//     const riderId = req.rider?.id;

//     if (!riderId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const { paymentMode, paymentType, months } = req.body;

//     // Get all requests that are waiting for payment or already ready/free
//     const requests = await prisma.assetRequest.findMany({
//       where: {
//         riderId,
//         status: {
//           in: ["PAYMENT_PENDING", "READY_FOR_DISPATCH"]
//         }
//       },
//       orderBy: { createdAt: "asc" }
//     });

//     if (!requests.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No payment pending request found"
//       });
//     }

//     const assetRequestIds = requests.map(r => r.id);

//     // Separate already-ready requests
//     const alreadyReady = requests.filter(r => r.status === "READY_FOR_DISPATCH");
//     const paymentPending = requests.filter(r => r.status === "PAYMENT_PENDING");

//     // If all are already ready, just return ids
//     if (paymentPending.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No payment is required for current asset requests",
//         assetRequestIds,
//         currentStatuses: [...new Set(requests.map(r => r.status))],
//         note: "Assets are either free or already moved beyond payment stage"
//       });
//     }

//     let totalAmount = 0;
//     let freeRequestIds = [];
//     let paidRequestIds = [];

//     for (const reqItem of paymentPending) {
//       const asset = await prisma.assetMaster.findFirst({
//         where: {
//           assetType: reqItem.assetType,
//           isActive: true
//         }
//       });

//       if (!asset) {
//         return res.status(404).json({
//           success: false,
//           message: `Active asset not found for ${reqItem.assetType}`
//         });
//       }

//       const isEligibleForFree =
//         asset.freeLimit > 0 &&
//         asset.issuedCount + reqItem.quantity <= asset.freeLimit;

//       if (isEligibleForFree) {
//         freeRequestIds.push(reqItem.id);
//       } else {
//         paidRequestIds.push(reqItem.id);
//         totalAmount += asset.price * reqItem.quantity;
//       }
//     }

//     // Update free requests directly
//     if (freeRequestIds.length > 0) {
//       await prisma.$transaction(async (tx) => {
//         for (const id of freeRequestIds) {
//           const reqItem = paymentPending.find(r => r.id === id);

//           await tx.assetRequest.update({
//             where: { id },
//             data: { status: "READY_FOR_DISPATCH" }
//           });

//           await tx.assetMaster.updateMany({
//             where: { assetType: reqItem.assetType, isActive: true },
//             data: {
//               issuedCount: {
//                 increment: reqItem.quantity
//               }
//             }
//           });
//         }
//       });
//     }

//     // If all requests were free
//     if (paidRequestIds.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "Congratulations! You got free assets",
//         popup: true,
//         paymentRequired: false,
//         amount: 0,
//         nextStage: "READY_FOR_DISPATCH",
//         assetRequestIds: [...alreadyReady.map(r => r.id), ...freeRequestIds]
//       });
//     }

//     // Paid flow
//     if (!paymentMode || !paymentType) {
//       return res.status(400).json({
//         success: false,
//         message: "paymentMode and paymentType are required"
//       });
//     }

//     const payment = await prisma.$transaction(async (tx) => {
//       const createdPayments = [];

//       for (const id of paidRequestIds) {
//         const reqItem = paymentPending.find(r => r.id === id);

//         const asset = await tx.assetMaster.findFirst({
//           where: {
//             assetType: reqItem.assetType,
//             isActive: true
//           }
//         });

//         const amount = asset.price * reqItem.quantity;

//         const pay = await tx.payment.create({
//           data: {
//             assetRequestId: id,
//             amount,
//             paymentMode,
//             paymentType,
//             status: "SUCCESS"
//           }
//         });

//         if (paymentType === "EMI") {
//           if (!months || months <= 0) {
//             throw new Error("Valid months required for EMI");
//           }

//           const monthlyAmount = amount / months;

//           await tx.emiPlan.create({
//             data: {
//               paymentId: pay.id,
//               totalAmount: amount,
//               interestRate: 10,
//               months,
//               monthlyAmount,
//               remainingAmount: amount,
//               nextDueDate: new Date()
//             }
//           });
//         }

//         await tx.assetRequest.update({
//           where: { id },
//           data: { status: "READY_FOR_DISPATCH" }
//         });

//         createdPayments.push(pay);
//       }

//       return createdPayments;
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Payment successful. Waiting for admin dispatch",
//       paymentRequired: true,
//       totalAmount,
//       assetRequestIds: [
//         ...alreadyReady.map(r => r.id),
//         ...freeRequestIds,
//         ...paidRequestIds
//       ],
//       data: payment
//     });

//   } catch (error) {
//     console.error("Payment Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Payment failed"
//     });
//   }
// };


exports.makePayment = async (req, res) => {
  try {
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;
    const { paymentMode, paymentType, emiMonths } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required in params"
      });
    }

    if (!paymentMode) {
      return res.status(400).json({
        success: false,
        message: "paymentMode is required"
      });
    }

    if (paymentMode !== "ONLINE" && paymentMode !== "OFFLINE") {
      return res.status(400).json({
        success: false,
        message: "Invalid paymentMode. Allowed: ONLINE, OFFLINE"
      });
    }

    const assetRequest = await prisma.assetRequest.findFirst({
      where: {
        id,
        riderId
      }
    });

    if (!assetRequest) {
      return res.status(404).json({
        success: false,
        message: "Asset request not found"
      });
    }

    if (
      assetRequest.status === "DISPATCHED" ||
      assetRequest.status === "COMPLETED" ||
      assetRequest.status === "CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message: `Payment selection not allowed for status ${assetRequest.status}`
      });
    }

    if (assetRequest.status === "READY_FOR_DISPATCH") {
      return res.status(200).json({
        success: true,
        message: "This asset is already free and ready for dispatch",
        data: assetRequest
      });
    }

    let updateData = {
      paymentMode,
      status: "PAYMENT_PENDING"
    };

    if (paymentMode === "OFFLINE") {
      updateData.paymentType = null;
      updateData.emiMonths = null;
    }

    if (paymentMode === "ONLINE") {
      if (!paymentType) {
        return res.status(400).json({
          success: false,
          message: "paymentType is required when paymentMode is ONLINE"
        });
      }

      if (paymentType !== "FULL_PAYMENT" && paymentType !== "EMI") {
        return res.status(400).json({
          success: false,
          message: "Invalid paymentType. Allowed: FULL_PAYMENT, EMI"
        });
      }

      updateData.paymentType = paymentType;

      if (paymentType === "EMI") {
        if (!emiMonths) {
          return res.status(400).json({
            success: false,
            message: "emiMonths is required when paymentType is EMI"
          });
        }

        const allowedMonths = [3, 6, 9, 12];

        if (!allowedMonths.includes(Number(emiMonths))) {
          return res.status(400).json({
            success: false,
            message: "Invalid emiMonths. Allowed: 3, 6, 9, 12"
          });
        }

        updateData.emiMonths = Number(emiMonths);
      } else {
        updateData.emiMonths = null;
      }
    }

    const updatedRequest = await prisma.assetRequest.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: "Payment option selected successfully",
      data: updatedRequest
    });

  } catch (error) {
    console.error("makePayment error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};
exports.dispatchAsset = async (req, res) => {
  try {
    const { assetRequestIds } = req.params;
    const { courierName, trackingId } = req.body;

    if (!assetRequestIds || !courierName || !trackingId) {
      return res.status(400).json({
        success: false,
        message: "assetRequestIds param, courierName and trackingId are required"
      });
    }

    const requestIds = assetRequestIds
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);

    if (!requestIds.length) {
      return res.status(400).json({
        success: false,
        message: "No valid assetRequestIds found in params"
      });
    }

    const requests = await prisma.assetRequest.findMany({
      where: {
        id: { in: requestIds }
      }
    });

    if (!requests.length) {
      return res.status(404).json({
        success: false,
        message: "No asset requests found"
      });
    }

    if (requests.length !== requestIds.length) {
      const foundIds = requests.map(r => r.id);
      const notFoundIds = requestIds.filter(id => !foundIds.includes(id));

      return res.status(404).json({
        success: false,
        message: "Some asset requests were not found",
        notFoundIds
      });
    }

    const invalidRequests = requests.filter(
      r => r.status !== "READY_FOR_DISPATCH"
    );

    if (invalidRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some assets are not ready for dispatch",
        invalidRequestIds: invalidRequests.map(r => r.id),
        statuses: invalidRequests.map(r => ({
          id: r.id,
          status: r.status
        }))
      });
    }

    const existingShipments = await prisma.shipment.findMany({
      where: {
        assetRequestId: { in: requestIds }
      }
    });

    if (existingShipments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Shipment already created for some requests",
        existingShipmentRequestIds: existingShipments.map(s => s.assetRequestId)
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const shipments = [];

      for (const request of requests) {
        const shipment = await tx.shipment.create({
          data: {
            assetRequestId: request.id,
            courierName,
            trackingId,
            dispatchDate: new Date(),
            deliveryStatus: "SHIPPED"
          }
        });

        await tx.assetRequest.update({
          where: { id: request.id },
          data: { status: "DISPATCHED" }
        });

        shipments.push(shipment);
      }

      return shipments;
    });

    return res.status(200).json({
      success: true,
      message: "Assets dispatched successfully",
      totalDispatched: result.length,
      assetRequestIds: requestIds,
      data: result
    });

  } catch (error) {
    console.error("Dispatch Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while dispatching asset",
      error: error.message
    });
  }
};
exports.raiseIssue = async (req, res) => {
  try {
    //  Get rider from token
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
        riderId: riderId   //  token validation here
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
    const { shipmentId } = req.params;

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






exports.requestJoiningKit = async (req, res) => {
  try {
    if (!req.rider?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const riderId = req.rider.id;

    const {
      deliveryMode,
      name,
      completeAddress,
      pincode,
      pickupLocationId
    } = req.body;

    // delivery mode validation
    if (!deliveryMode) {
      return res.status(400).json({
        success: false,
        message: "deliveryMode is required"
      });
    }

    if (
      deliveryMode !== "HOME_DELIVERY" &&
      deliveryMode !== "PICKUP"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid deliveryMode"
      });
    }

    if (deliveryMode === "HOME_DELIVERY") {
      if (!name || !completeAddress || !pincode) {
        return res.status(400).json({
          success: false,
          message:
            "name, completeAddress and pincode required for HOME_DELIVERY"
        });
      }
    }

    if (deliveryMode === "PICKUP") {
      if (!pickupLocationId) {
        return res.status(400).json({
          success: false,
          message: "pickupLocationId required for PICKUP"
        });
      }
    }

    const joiningKitAssets = [
      AssetType.T_SHIRT,
      AssetType.BAG,
      AssetType.HELMET,
      AssetType.JACKET,
      AssetType.ID_CARD
    ];

    const existingRequests = await prisma.assetRequest.findMany({
      where: {
        riderId,
        assetType: { in: joiningKitAssets }
      }
    });

    if (existingRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Joining kit already requested"
      });
    }

    const createdRequests = [];
    let totalPrice = 0;

    for (const assetType of joiningKitAssets) {
      const asset = await prisma.assetMaster.findFirst({
        where: { assetType }
      });

      if (!asset) continue;

      const isFree = asset.issuedCount < asset.freeLimit;
      const price = isFree ? 0 : Number(asset.price);

      const request = await prisma.assetRequest.create({
        data: {
          riderId,
          assetType,
          quantity: 1,
          status: isFree
            ? RequestStatus.READY_FOR_DISPATCH
            : RequestStatus.PAYMENT_PENDING
        }
      });

      createdRequests.push({
        ...request,
        deliveryDetails:
          deliveryMode === "HOME_DELIVERY"
            ? {
                deliveryMode,
                name,
                completeAddress,
                pincode
              }
            : {
                deliveryMode,
                pickupLocationId
              },
        price,
        isFree
      });

      totalPrice += price;

      await prisma.assetMaster.update({
        where: { id: asset.id },
        data: {
          issuedCount: { increment: 1 }
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: "Joining kit requested successfully",
      totalItems: createdRequests.length,
      totalPrice,
      data: createdRequests
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};
// exports.requestJoiningKit = async (req, res) => {
//   try {
//     if (!req.rider?.id) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const riderId = req.rider.id;

//     const {
//       deliveryMode,
//       name,
//       completeAddress,
//       pincode,
//       pickupLocationId
//     } = req.body;

//     // delivery mode validation
//     if (!deliveryMode) {
//       return res.status(400).json({
//         success: false,
//         message: "deliveryMode is required"
//       });
//     }

//     if (
//       deliveryMode !== "HOME_DELIVERY" &&
//       deliveryMode !== "PICKUP"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid deliveryMode"
//       });
//     }

//     if (deliveryMode === "HOME_DELIVERY") {
//       if (!name || !completeAddress || !pincode) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "name, completeAddress and pincode are required for HOME_DELIVERY"
//         });
//       }
//     }

//     if (deliveryMode === "PICKUP" && !pickupLocationId) {
//       return res.status(400).json({
//         success: false,
//         message: "pickupLocationId is required for PICKUP"
//       });
//     }

//     const joiningKitAssets = [
//       AssetType.T_SHIRT,
//       AssetType.BAG,
//       AssetType.HELMET,
//       AssetType.JACKET,
//       AssetType.ID_CARD
//     ];

//     // Prevent duplicate joining kit request
//     const existingRequests = await prisma.assetRequest.findMany({
//       where: {
//         riderId,
//         assetType: { in: joiningKitAssets },
//         status: {
//           notIn: [RequestStatus.CANCELLED]
//         }
//       }
//     });

//     if (existingRequests.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Joining kit already requested"
//       });
//     }

//     const createdRequests = [];
//     let totalPrice = 0;
//     let hasPaidItem = false;

//     for (const assetType of joiningKitAssets) {
//       const asset = await prisma.assetMaster.findFirst({
//         where: {
//           assetType,
//           isActive: true
//         }
//       });

//       if (!asset) continue;

//       const isFree = asset.issuedCount < asset.freeLimit;
//       const itemPrice = isFree ? 0 : Number(asset.price);

//       if (!isFree) {
//         hasPaidItem = true;
//       }

//       const request = await prisma.assetRequest.create({
//         data: {
//           riderId,
//           assetType,
//           quantity: 1,
//           deliveryMode,
//           name: deliveryMode === "HOME_DELIVERY" ? name : null,
//           completeAddress:
//             deliveryMode === "HOME_DELIVERY" ? completeAddress : null,
//           pincode: deliveryMode === "HOME_DELIVERY" ? pincode : null,
//           pickupLocationId:
//             deliveryMode === "PICKUP" ? pickupLocationId : null,
//           status: isFree
//             ? RequestStatus.READY_FOR_DISPATCH
//             : RequestStatus.PAYMENT_PENDING
//         }
//       });

//       createdRequests.push({
//         ...request,
//         price: itemPrice,
//         isFree
//       });

//       totalPrice += itemPrice;

//       await prisma.assetMaster.update({
//         where: { id: asset.id },
//         data: {
//           issuedCount: { increment: 1 }
//         }
//       });
//     }

//     if (createdRequests.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No joining kit assets found in asset master"
//       });
//     }

//     return res.status(201).json({
//       success: true,
//       message: hasPaidItem
//         ? "Joining kit requested successfully. Please select payment option for paid items."
//         : "Congratulations! You got a free joining kit.",
//       totalItems: createdRequests.length,
//       totalPrice,
//       paymentRequired: hasPaidItem,
//       nextStep: hasPaidItem
//         ? "Select payment mode and payment type"
//         : "Ready for dispatch",
//       data: createdRequests
//     });

//   } catch (error) {
//     console.error("requestJoiningKit error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message
//     });
//   }
// };