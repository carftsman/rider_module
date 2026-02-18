const jwt = require("jsonwebtoken");

exports.generateTokens = (rider) => {
  const accessToken = jwt.sign(
    { riderId: rider._id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "30d" }  // short life
  );

  const refreshToken = jwt.sign(
    { riderId: rider._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }  // long life
  );

  return { accessToken, refreshToken };
};
