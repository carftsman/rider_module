const citiesData = require("../helpers/data.json");

// ===============================
// GET ALL CITIES
// ===============================
exports.getCities = async (req, res) => {
  try {
    const cities = citiesData.map((item) => item.city);
    res.json({ success: true, cities });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// GET AREAS BY CITY
// ===============================
exports.getAreas = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city)
      return res.status(400).json({ success: false, message: "City is required" });

    const foundCity = citiesData.find(
      (item) => item.city.toLowerCase() === city.toLowerCase()
    );

    if (!foundCity)
      return res.status(404).json({ success: false, message: "City not found" });

    res.json({
      success: true,
      city: foundCity.city,
      areas: foundCity.areas,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
