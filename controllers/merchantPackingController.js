// This API ONLY collects merchant data
// and calls our Create Order API

const axios = require("axios");

exports.merchantPackingApi = async (req, res) => {

  try {

    const {
      orderId,
      storeId,
      vendorShopName,
      pickupAddress,
      deliveryAddress,
      orderDetails
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required"
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "storeId is required"
      });
    }

    if (!vendorShopName) {
      return res.status(400).json({
        success: false,
        message: "vendorShopName is required"
      });
    }

    if (!pickupAddress) {
      return res.status(400).json({
        success: false,
        message: "pickupAddress is required"
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "deliveryAddress is required"
      });
    }

    if (!orderDetails) {
      return res.status(400).json({
        success: false,
        message: "orderDetails is required"
      });
    }


    const createOrderPayload = {

      orderId,

      storeId,

      vendorShopName,

      pickupAddress: {
        merchantName:
          pickupAddress.merchantName,

        addressLine:
          pickupAddress.addressLine,

        contactNumber:
          pickupAddress.contactNumber,

        latitude:
          pickupAddress.latitude,

        longitude:
          pickupAddress.longitude,

        pincode:
          pickupAddress.pincode
      },

      deliveryAddress: {
        name:
          deliveryAddress.name,

        addressLine:
          deliveryAddress.addressLine,

        contactNumber:
          deliveryAddress.contactNumber,

        latitude:
          deliveryAddress.latitude,

        longitude:
          deliveryAddress.longitude
      },

      orderDetails: {
        items:
          orderDetails.items,

        totalAmount:
          orderDetails.totalAmount,

        estimatedWeight:
          orderDetails.estimatedWeight
      }
    };

   

    const createOrderResponse =
      await axios.post(
        `${process.env.RENDER_URL}/api/orders/rider/store-order-details`,  // ${process.env.RENDER_URL}/api/orders/rider/store-order-details
        createOrderPayload
      );

    const deliveryId = {
        deliveryId : createOrderResponse.data.data.deliveryId
    }
     const merchentResponse =   await axios.post(
        `${process.env.RENDER_URL}/api/delivery-event`,  // ${process.env.RENDER_URL}/api/delivery-event
        deliveryId
      );



    // console.log(createOrderResponse.data.data.deliveryId)
    return res.status(200).json({
      success: true,
      message:
        "Merchant packing data sent to rider module API successfully",

      merchantPackingData:
        createOrderPayload,

      createOrderResponse:
        createOrderResponse.data,

      merchentResponse : merchentResponse.data


    });

  } catch (error) {

    console.log(
      "Merchant Packing API Error",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to call create order API",

      error:
        error.response?.data || error.message
    });
  }
};