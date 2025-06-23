import { Client } from '@googlemaps/google-maps-services-js';
import axios from 'axios';

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
    const maxWidth = 800;
    if (candidate.photos && candidate.photos.length > 0) {
      const photoReference = candidate.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${key}`;
    }

    // Fallback #1: fetch Place Details to see if it contains photos not returned by FindPlaceFromText
    if (!photoUrl) {
      try {
        const details = await client.placeDetails({
          params: {
            place_id: candidate.place_id,
            fields: ['photos'],
            key,
          },
        });
        const detailsPhotos = details.data?.result?.photos;
        if (detailsPhotos && detailsPhotos.length > 0) {
          const ref = detailsPhotos[0].photo_reference;
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${ref}&key=${key}`;
        }
      } catch (e) {
        console.warn('Place Details photo fetch failed:', e.response?.status || e.code, e.message);
      }
    }

    // Fallback #2: Text Search (broader search than FindPlaceFromText)
    if (!photoUrl) {
      try {
        const textRes = await client.textSearch({
          params: {
            query,
            fields: ['photos'],
            key,
          },
        });
        const tsPhoto = textRes.data?.results?.[0]?.photos?.[0]?.photo_reference;
        if (tsPhoto) {
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${tsPhoto}&key=${key}`;
        }
      } catch (e) {
        console.warn('TextSearch photo fetch failed:', e.response?.status || e.code, e.message);
      }
    }

    // As a final fallback return null (frontend can use placeholder)
    if (!photoUrl) {
      return { photoUrl: null, name: candidate.name, address: candidate.formatted_address };
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