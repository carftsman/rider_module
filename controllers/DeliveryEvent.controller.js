const prisma = require("../config/prisma");

const createDeliveryEvent = async (req, res) => {

    try {

        const { deliveryId } = req.body;

        if (!deliveryId) {

            return res.status(400).json({
                success: false,
                message: "deliveryId is required"
            });

        }

        const delivery = await prisma.deliveryWebhookEvent.create({

            data: {

                event: "SEARCHING_FOR_RIDER",

                deliveryId,

                eventTime: new Date()

            }

        });

        return res.status(201).json({

            success: true,
            message: "Searching for rider",
            data: delivery

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,
            message: error.message

        });

    }

};

const updateDeliveryEvent = async (req, res) => {

    try {

        const { deliveryId } = req.params;

        const {
            riderId,
            riderName,
            riderPhone,
            vehicle,
            latitude,
            longitude,
            // orderId
        } = req.body;

        // check delivery exists
        const existingDelivery =
            await prisma.deliveryWebhookEvent.findUnique({

                where: {
                    deliveryId
                }

            });

        if (!existingDelivery) {

            return res.status(404).json({
                success: false,
                message: "Delivery event not found"
            });

        }

        // update object
        const updateData = {

            riderName,
            riderPhone,
            vehicle,

            latitude,
            longitude,

            event: "RIDER_ASSIGNED"

        };

        // validate riderId
        if (riderId) {

            const riderExists =
                await prisma.rider.findUnique({

                    where: {
                        id: riderId
                    }

                });

            if (!riderExists) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid riderId"
                });

            }

            updateData.riderId = riderId;
        }
        // final update
        const updatedDelivery =
            await prisma.deliveryWebhookEvent.update({

                where: {
                    deliveryId
                },

                data: updateData

            });

        return res.status(200).json({

            success: true,
            message: "Delivery event updated successfully",
            data: updatedDelivery

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,
            message: error.message

        });

    }

};

module.exports = {
    createDeliveryEvent,
    updateDeliveryEvent
};