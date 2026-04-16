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
    const { riderId } = req.body;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "riderId is required"
      });
    }

    console.log("Admin approving riderId:", riderId);

    const requests = await prisma.assetRequest.findMany({
      where: {
        riderId,
        status: RequestStatus.READY_FOR_DISPATCH
      },
      orderBy: { createdAt: "asc" }
    });

    console.log("Requests ready for dispatch:", requests);

    if (!requests.length) {
      return res.status(404).json({
        success: false,
        message: "No requests ready for dispatch found"
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let riderAssets = await tx.rider_assets.findFirst({
        where: { riderId }
      });

      if (!riderAssets) {
        riderAssets = await tx.rider_assets.create({
          data: {
            riderId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      const approvedRequests = [];
      const dispatchedItems = [];

      for (const request of requests) {
        const asset = await tx.assetMaster.findFirst({
          where: { assetType: request.assetType }
        });

        if (!asset) {
          throw new Error(`Asset not found in master for assetType: ${request.assetType}`);
        }

        const itemsData = Array.from({ length: request.quantity }, () => ({
          riderAssetsId: riderAssets.id,
          assetType: asset.assetType,
          assetName: asset.assetName,
          issuedDate: new Date(),
          status: "ISSUED",
          condition: "GOOD",
          quantity: 1
        }));

        await tx.rider_asset_items.createMany({
          data: itemsData
        });

        const updatedRequest = await tx.assetRequest.update({
          where: { id: request.id },
          data: { status: RequestStatus.DISPATCHED }
        });

        approvedRequests.push(updatedRequest);
        dispatchedItems.push({
          assetType: asset.assetType,
          assetName: asset.assetName,
          quantity: request.quantity
        });
      }

      return {
        riderAssetsId: riderAssets.id,
        totalRequestsApproved: approvedRequests.length,
        totalItemsDispatched: dispatchedItems.reduce((sum, item) => sum + item.quantity, 0),
        approvedRequests,
        dispatchedItems
      };
    });

    return res.status(200).json({
      success: true,
      message: "All ready requests approved and assets dispatched successfully",
      ...result
    });
  } catch (error) {
    console.error("Approve Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Approval failed"
    });
  }
};





exports.makePayment = async (req, res) => {
  try {
    const riderId = req.rider?.id;
    console.log("Rider ID from token:", riderId);

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { paymentMode, paymentType, months } = req.body;

    if (!paymentMode || !paymentType) {
      return res.status(400).json({
        success: false,
        message: "paymentMode and paymentType are required"
      });
    }

    const riderAssets = await prisma.rider_assets.findFirst({
      where: { riderId },
      orderBy: { createdAt: "desc" }
    });

    const allRequests = await prisma.assetRequest.findMany({
      where: { riderId },
      orderBy: { createdAt: "desc" }
    });

    console.log("All requests for this rider:", JSON.stringify(allRequests, null, 2));

    if (!allRequests.length) {
      return res.status(404).json({
        success: false,
        message: "No asset requests found for this rider",
        riderAssetsId: riderAssets?.id || null
      });
    }

    const request = allRequests.find(
      (r) => r.status === RequestStatus.PAYMENT_PENDING
    );

    console.log("Payment pending request found:", request);

if (!request) {
  const statuses = [...new Set(allRequests.map((r) => r.status))];
  const assetRequestIds = allRequests.map((r) => r.id);

  return res.status(200).json({
    success: true,
    message: "No payment is required for current asset requests",
    riderAssetsId: riderAssets?.id || null,
    assetRequestIds,
    currentStatuses: statuses,
    note: "Assets are either free or already moved beyond payment stage"
  });
}
    const existingPayment = await prisma.payment.findFirst({
      where: { assetRequestId: request.id }
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Payment already completed",
        riderAssetsId: riderAssets?.id || null,
        assetRequestId: request.id,
        data: existingPayment
      });
    }

    const asset = await prisma.assetMaster.findFirst({
      where: { assetType: request.assetType }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found in master",
        riderAssetsId: riderAssets?.id || null
      });
    }

    if ((asset.price || 0) <= 0) {
      await prisma.assetRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.READY_FOR_DISPATCH
        }
      });

      return res.status(200).json({
        success: true,
        message: "This asset is free. Payment is not required.",
        riderAssetsId: riderAssets?.id || null,
        assetRequestId: request.id,
        assetType: request.assetType,
        quantity: request.quantity,
        status: RequestStatus.READY_FOR_DISPATCH
      });
    }

    const totalAmount = asset.price * request.quantity;

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
        if (!months || months <= 0) {
          throw new Error("Valid months required for EMI");
        }

        const monthlyAmount = totalAmount / months;

        await tx.emiPlan.create({
          data: {
            paymentId: pay.id,
            totalAmount,
            interestRate: 10,
            months,
            monthlyAmount,
            remainingAmount: totalAmount,
            nextDueDate: new Date()
          }
        });
      }

      await tx.assetRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.READY_FOR_DISPATCH
        }
      });

      return pay;
    });

    return res.status(200).json({
      success: true,
      message: "Payment successful. Waiting for admin dispatch",
      riderAssetsId: riderAssets?.id || null,
      assetRequestId: request.id,
      data: payment
    });
  } catch (error) {
    console.error("Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Payment failed"
    });
  }
};

exports.dispatchAsset = async (req, res) => {
  try {
    const { assetRequestIds } = req.params;
    const { courierName, trackingId } = req.body || {};

    if (!assetRequestIds || !courierName || !trackingId) {
      return res.status(400).json({
        success: false,
        message: "assetRequestIds param, courierName and trackingId are required"
      });
    }

    const idsArray = assetRequestIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!idsArray.length) {
      return res.status(400).json({
        success: false,
        message: "No valid assetRequestIds provided"
      });
    }

    const allMatchedRequests = await prisma.assetRequest.findMany({
      where: {
        id: { in: idsArray }
      }
    });

    if (!allMatchedRequests.length) {
      return res.status(404).json({
        success: false,
        message: "No asset requests found for given IDs"
      });
    }

    const readyRequests = allMatchedRequests.filter(
      (r) => r.status === RequestStatus.READY_FOR_DISPATCH
    );

    const alreadyDispatched = allMatchedRequests.filter(
      (r) => r.status === RequestStatus.DISPATCHED
    );

    if (!readyRequests.length) {
      return res.status(400).json({
        success: false,
        message: "No READY_FOR_DISPATCH requests found for given IDs",
        currentStatuses: [...new Set(allMatchedRequests.map((r) => r.status))],
        alreadyDispatchedIds: alreadyDispatched.map((r) => r.id)
      });
    }

    await prisma.assetRequest.updateMany({
      where: {
        id: { in: readyRequests.map((r) => r.id) }
      },
      data: {
        status: RequestStatus.DISPATCHED
      }
    });

    await Promise.all(
      readyRequests.map((request) =>
        prisma.shipment.create({
          data: {
            assetRequestId: request.id,
            courierName,
            trackingId
          }
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: "Assets dispatched successfully",
      totalDispatched: readyRequests.length,
      assetRequestIds: readyRequests.map((r) => r.id),
      skippedAlreadyDispatchedIds: alreadyDispatched.map((r) => r.id)
    });
  } catch (error) {
    console.error("dispatchAsset error =", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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






exports.requestJoiningKit = async (req, res) => {
  try {
    if (!req.rider?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const riderId = req.rider.id;

    const { name, completeAddress, pincode } = req.body;

    // ✅ Validation
    if (!name || !completeAddress || !pincode) {
      return res.status(400).json({
        success: false,
        message: "name, completeAddress and pincode are required"
      });
    }

    const joiningKitAssets = [
      AssetType.T_SHIRT,
      AssetType.BAG,
      AssetType.HELMET,
      AssetType.JACKET,
      AssetType.ID_CARD
    ];

    // ✅ Prevent duplicate request
    const existingRequests = await prisma.assetRequest.findMany({
      where: {
        riderId,
        assetType: {
          in: joiningKitAssets
        }
      }
    });

    if (existingRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Joining kit already requested for this rider"
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
      const calculatedPrice = isFree ? 0 : Number(asset.price);

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
        deliveryDetails: {
          name,
          completeAddress,
          pincode
        },
        price: calculatedPrice,
        isFree
      });

      totalPrice += calculatedPrice;

      await prisma.assetMaster.update({
        where: { id: asset.id },
        data: {
          issuedCount: {
            increment: 1
          }
        }
      });
    }

    if (createdRequests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No assets found"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Joining kit requested successfully",
      totalItems: createdRequests.length,
      totalPrice,
      deliveryDetails: {
        name,
        completeAddress,
        pincode
      },
      data: createdRequests
    });

  } catch (error) {
    console.error("Request Joining Kit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};