const axios = require("axios");

async function getWeather(lat, lng) {

  try {

    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat,
          lon: lng,
          appid: process.env.WEATHER_API_KEY
        }
      }
    );

    const weatherMain =
      response.data.weather?.[0]?.main || "";

    /**
     * BETTER RAIN DETECTION
     */

    const rainyConditions = [
      "Rain",
      "Drizzle",
      "Thunderstorm"
    ];

    const isRaining =
      rainyConditions.includes(weatherMain);

    return {

      success: true,

      condition: weatherMain,

      isRaining,

      temperature:
        response.data.main?.temp,

      humidity:
        response.data.main?.humidity
    };

  } catch (err) {

    console.error(
      "Weather API error:",
      err.message
    );

    return {

      success: false,

      isRaining: false,

      condition: "UNKNOWN"
    };

  }

}

module.exports = getWeather;