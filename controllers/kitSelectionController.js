const prisma = require("../config/prisma");
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
  const assets = await prisma.assetMaster.findMany({
    where: { isActive: true }
  })

  const response = assets.map(asset => ({
    id: asset.id,
    assetType: asset.assetType,
    assetName: asset.assetName,
    description: asset.description,
    imageUrl: asset.imageUrl,  // 👈 Sending image
    price: asset.issuedCount < asset.freeLimit ? 0 : asset.price,
    isFree: asset.issuedCount < asset.freeLimit
  }))

  res.json(response)
}
exports.requestAsset = async (req, res) => {
console.log("req.rider:", req.rider);

  try {
    const { assetType, quantity } = req.body;
    const riderId = req.rider?.id;

    // 🔹 Basic validation
    if (!assetType || !quantity) {
      return res.status(400).json({
        success: false,
        message: "assetType and quantity are required"
      });
    }

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Rider not found."
      });
    }

    // 🔹 Check asset exists
    const asset = await prisma.assetMaster.findFirst({
      where: { assetType }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found"
      });
    }

    // 🔹 Free limit logic
    const isFree = asset.issuedCount < asset.freeLimit;
    const price = isFree ? 0 : asset.price * Number(quantity);

    // 🔹 Create request
    const request = await prisma.assetRequest.create({
      data: {
        riderId,
        assetType,
        quantity: Number(quantity),
        price,
        isFree
      }
    });

    return res.status(201).json({
      success: true,
      message: "Asset request created successfully",
      data: request
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
  const { requestId } = req.body

  const request = await prisma.assetRequest.update({
    where: { id: requestId },
    data: {
      status: request.isFree ? "READY_FOR_DISPATCH" : "PAYMENT_PENDING"
    }
  })

  res.json(request)
}
exports.makePayment = async (req, res) => {
  const { requestId, paymentMode, paymentType, months } = req.body

  const request = await prisma.assetRequest.findUnique({
    where: { id: requestId }
  })

  const payment = await prisma.payment.create({
    data: {
      assetRequestId: requestId,
      amount: request.price,
      paymentMode,
      paymentType,
      status: "SUCCESS"
    }
  })

  if (paymentType === "EMI") {
    const monthly = request.price / months

    await prisma.emiPlan.create({
      data: {
        paymentId: payment.id,
        totalAmount: request.price,
        interestRate: 10,
        months,
        monthlyAmount: monthly,
        remainingAmount: request.price,
        nextDueDate: new Date()
      }
    })
  }

  await prisma.assetRequest.update({
    where: { id: requestId },
    data: { status: "READY_FOR_DISPATCH" }
  })

  res.json({ message: "Payment success" })
}
exports.dispatchAsset = async (req, res) => {
  const { requestId, courierName, trackingId } = req.body

  await prisma.shipment.create({
    data: {
      assetRequestId: requestId,
      courierName,
      trackingId,
      deliveryStatus: "SHIPPED"
    }
  })

  await prisma.assetRequest.update({
    where: { id: requestId },
    data: { status: "COMPLETED" }
  })

  res.json({ message: "Dispatched successfully" })
}
exports.raiseIssue = async (req, res) => {
  const { riderAssetsId, assetType, description } = req.body
  const imageUrl = req.file?.path

  const issue = await prisma.riderAssetIssue.create({
    data: {
      riderAssetsId,
      assetType,
      description,
      issueType: "DAMAGED"
    }
  })

  res.json(issue)
}