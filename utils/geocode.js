const axios = require("axios");

async function addressToLatLng(address) {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: address,
          key: process.env.GOOGLE_KEY
        }
      }
    );

    if (
      !response.data ||
      response.data.status !== "OK" ||
      response.data.results.length === 0
    ) {
      throw new Error("Unable to geocode address");
    }

    const result = response.data.results[0];

    return {
      formattedAddress: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng
    };
  } catch (error) {
    console.error("Google Geocoding Error:", error.message);
    throw error;
  }
}

module.exports = addressToLatLng;
