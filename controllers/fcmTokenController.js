const Rider = require("../models/RiderModel");

// SAVE FCM TOKEN

exports.saveFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const riderId = req.rider._id;

  if (!fcmToken) {
    return res.status(400).json({ 
               success: false , 
               message: "FCM token is required" 
              });
  }
  if(!riderId){
    return res.status(400).json({ 
               success: false , 
               message: "Rider ID is required" 
              });
  }

  await Rider.findByIdAndUpdate(riderId, { fcmToken });
  res.json({ 
             success: true ,
             message: "FCM token saved successfully"
            });
};
