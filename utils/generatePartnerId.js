module.exports.generatePartnerId = () => {
  const ts = Date.now().toString();
  return "PID" + ts.slice(-6); // Max length = 8
};
