const admin = require("../config/firebase");

const sendToDevice = async ({ token, title, body, data = {} }) => {
  const message = {
    token,
    notification: { title, body },
    data,
  };
//    console.log("FCM Message:", message);
//    console.log("FCM Message 2 :", admin.messaging().send(message));
  return admin.messaging().send(message);
};

// this is use full for : Same rider logged in on 2 phones (don't use this presently becuase of in schema we have fcmToken as single string)

const sendToMultiple = async ({ tokens, title, body, data = {} }) => {
  const message = {
    tokens,
    notification: { title, body },
    data,
  };

  return admin.messaging().sendMulticast(message);
};

const sendToTopic = async ({ topic, title, body, data = {} }) => {
  const message = {
    topic,
    notification: { title, body },
    data,
  };

  return admin.messaging().send(message);
};

module.exports = {
  sendToDevice,
  sendToMultiple,
  sendToTopic,
};
