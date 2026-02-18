exports.getToday = () => {
  return new Date().toISOString().split("T")[0];
};
