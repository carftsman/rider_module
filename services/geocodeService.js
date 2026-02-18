const axios = require("axios");

const GOOGLE_KEY = process.env.GOOGLE_KEY;

async function getLatLng(address) {

  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  const response = await axios.get(url, {
    params: {
      address: address,
      key: GOOGLE_KEY
    }
  });

  if (
    !response.data.results ||
    response.data.results.length === 0
  ) {
    throw new Error("Invalid address");
  }

  const loc = response.data.results[0].geometry.location;

  return {
    lat: loc.lat,
    lng: loc.lng
  };
}

module.exports = { getLatLng };
