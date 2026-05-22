const {
  PrismaClient,
  OrderStatus,
  AllocationStatus,
  OrderState,
} = require("@prisma/client");

const prisma = new PrismaClient();

exports.syncPincodeMetrics = async (req, res) => {
  try {
    const { pincodeId } = req.params;

    /**
     * CHECK PINCODE
     */
    const pincode = await prisma.pincode.findUnique({
      where: {
        id: pincodeId,
      },
    });

    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: "Pincode not found",
      });
    }

    /**
     * TOTAL ORDERS
     */
    const totalOrders = await prisma.order.count({
      where: {
        OrderPickupAddress: {
          is: {
            pincode: pincode.code,
          },
        },
      },
    });

    /**
     * LIVE ORDERS
     */
    const liveOrders = await prisma.order.count({
      where: {
        orderStatus: {
          in: [
            OrderStatus.CREATED,
            OrderStatus.CONFIRMED,
          ],
        },
        OrderPickupAddress: {
          is: {
            pincode: pincode.code,
          },
        },
      },
    });

    /**
     * ASSIGNED ORDERS
     */
    const assignedOrders = await prisma.order.count({
      where: {
        orderStatus: OrderStatus.ASSIGNED,
        OrderPickupAddress: {
          is: {
            pincode: pincode.code,
          },
        },
      },
    });

    /**
     * DELIVERED ORDERS
     */
    const deliveredOrders = await prisma.order.count({
      where: {
        orderStatus: OrderStatus.DELIVERED,
        OrderPickupAddress: {
          is: {
            pincode: pincode.code,
          },
        },
      },
    });

    /**
     * CANCELLED ORDERS
     */
    const cancelledOrders = await prisma.order.count({
      where: {
        orderStatus: OrderStatus.CANCELLED,
        OrderPickupAddress: {
          is: {
            pincode: pincode.code,
          },
        },
      },
    });

    /**
     * ACCEPTED ORDERS
     */
    const acceptedOrders =
      await prisma.orderCandidateRider.count({
        where: {
          status: AllocationStatus.ACCEPTED,
          OrderAllocation: {
            Order: {
              OrderPickupAddress: {
                is: {
                  pincode: pincode.code,
                },
              },
            },
          },
        },
      });

    /**
     * REJECTED ORDERS
     */
    const rejectedOrders =
      await prisma.orderCandidateRider.count({
        where: {
          status: AllocationStatus.REJECTED,
          OrderAllocation: {
            Order: {
              OrderPickupAddress: {
                is: {
                  pincode: pincode.code,
                },
              },
            },
          },
        },
      });

    /**
     * TIMEOUT ORDERS
     */
    const timeoutOrders =
      await prisma.orderCandidateRider.count({
        where: {
          status: AllocationStatus.TIMEOUT,
          OrderAllocation: {
            Order: {
              OrderPickupAddress: {
                is: {
                  pincode: pincode.code,
                },
              },
            },
          },
        },
      });

    /**
     * AVAILABLE RIDERS
     */
    const availableRiders = await prisma.rider.count({
      where: {
        isOnline: true,
        orderState: OrderState.READY,
        location: {
          is: {
            pincode: pincode.code,
          },
        },
      },
    });

    /**
     * BUSY RIDERS
     */
    const busyRiders = await prisma.rider.count({
      where: {
        isOnline: true,
        orderState: OrderState.BUSY,
        location: {
          is: {
            pincode: pincode.code,
          },
        },
      },
    });

    /**
     * OFFLINE RIDERS
     */
    const offlineRiders = await prisma.rider.count({
      where: {
        isOnline: false,
        location: {
          is: {
            pincode: pincode.code,
          },
        },
      },
    });

    /**
     * ACCEPTANCE RATE
     */
    const totalResponses =
      acceptedOrders +
      rejectedOrders +
      timeoutOrders;

    const avgAcceptanceRate =
      totalResponses > 0
        ? (acceptedOrders / totalResponses) * 100
        : 0;

    /**
     * UPDATE / CREATE METRICS
     */
    const metrics =
      await prisma.pincodeMetrics.upsert({
        where: {
          pincodeId,
        },
        update: {
          totalOrders,
          liveOrders,
          assignedOrders,
          deliveredOrders,
          cancelledOrders,
          acceptedOrders,
          rejectedOrders,
          timeoutOrders,
          availableRiders,
          busyRiders,
          offlineRiders,
          avgAcceptanceRate,
        },
        create: {
          pincodeId,
          totalOrders,
          liveOrders,
          assignedOrders,
          deliveredOrders,
          cancelledOrders,
          acceptedOrders,
          rejectedOrders,
          timeoutOrders,
          availableRiders,
          busyRiders,
          offlineRiders,
          avgAcceptanceRate,
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Pincode metrics synced successfully",
      data: metrics,
    });
  } catch (error) {
    console.log(
      "SYNC PINCODE METRICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};