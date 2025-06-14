import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export async function getPlacePhoto(query) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_MAPS_API_KEY is not set in the environment variables.');
  }

  try {
    // 1. Find the place ID from the query
    const findPlaceRequest = await client.findPlaceFromText({
      params: {
        input: query,
        inputtype: 'textquery',
        fields: ['place_id', 'photos', 'name', 'formatted_address'],
        key,
      },
    });

    const candidate = findPlaceRequest.data.candidates[0];
    if (!candidate) {
      console.log(`No place found for query: "${query}"`);
      return null;
    }
    
    let photoUrl = null;
    if (candidate.photos && candidate.photos.length > 0) {
      const photoReference = candidate.photos[0].photo_reference;
      const maxWidth = 800;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${key}`;
    } else {
      console.log(`No photo found for query: "${query}"`);
    }

    return {
      photoUrl,
      name: candidate.name,
      address: candidate.formatted_address,
    };

  } catch (error) {
    console.error(`Google Places API error for query "${query}":`, error.response?.data || error.message);
    throw error;
  }
} 