// tools/maps.js
import { Client } from "@googlemaps/google-maps-services-js";
const maps = new Client({});

export async function getNearbyPlaces({ lat, lng, radius = 1000, type }) {
  const res = await maps.placesNearby({
    params: {
      key: process.env.GOOGLE_MAPS_API_KEY,
      location: { lat, lng },
      radius,
      type,                // e.g. "restaurant", "museum"
    },
    timeout: 5000,
  });
  return res.data.results.map(p => ({
    name:        p.name,
    address:     p.vicinity,
    rating:      p.rating,
    place_id:    p.place_id,
    plus_code:   p.plus_code?.global_code,
    total_ratings: p.user_ratings_total,
  }));
}

export async function getTravelTime({ origin, destination, mode = "driving" }) {
  try {
    const res = await maps.directions({
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY,
        origin,
        destination,
        mode,
      },
      timeout: 5000,
    });
    const leg = res.data.routes?.[0]?.legs?.[0];
    if (!leg) return null;
    return {
      distance_m: leg.distance.value,
      duration_s: leg.duration.value,
    };
  } catch (err) {
    console.error("Directions API error:", err.response?.status || err.code, err.message);
    return null;
  }
}
