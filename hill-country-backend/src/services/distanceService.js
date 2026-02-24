const axios = require("axios");

exports.getDistanceInKm = async (originLat, originLng, destLat, destLng) => {
  try {
    if (
      originLat == null || originLng == null ||
      destLat == null || destLng == null
    ) {
      throw new Error("Missing coordinates for distance calculation");
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const res = await axios.get(url);

    const element = res.data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      throw new Error("Distance API returned invalid data");
    }

    return element.distance.value / 1000; // KM
  } catch (err) {
    console.error("Distance API Error:", err.message);
    console.log("Distance fallback used");

    return 10;
  }
};
