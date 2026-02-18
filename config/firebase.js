const admin = require("firebase-admin");




if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}


//testing

// console.log("Firebase apps:", admin.apps.length);

// console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
// console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
// console.log(
//   "FIREBASE_PRIVATE_KEY exists:",
//   !!process.env.FIREBASE_PRIVATE_KEY
// );

module.exports = admin;
